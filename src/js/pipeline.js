// LUMEN — пайплайн шейдерных пассов v2: ping-pong между fboA/fboB внутри
// WEBGL2-графики + FBO-пул getBuffer(name) + mask-стек + blur-движок.
// Static-prefix cache: если первые N слоёв не animated и нет масок — кэшируем
// их результат и на анимированных кадрах гоняем только суффикс.
import { MODULES } from './modules/index.js';
import { resetMaskStack, activeMask, consumeMaskCharge } from './maskStack.js';
import { createBlurEngine } from './blurEngine.js';
import { findStaticSplit } from './pipelineSplit.js';

export { findStaticSplit } from './pipelineSplit.js';

import lumenVert from '../shaders/lumen.vert?raw';
import fillColorFrag from '../shaders/fillColor.frag?raw';
import fillGradientFrag from '../shaders/fillGradient.frag?raw';
import fillMediaFrag from '../shaders/fillMedia.frag?raw';
import fillNoiseFrag from '../shaders/fillNoise.frag?raw';
import blurCompFrag from '../shaders/blurComp.frag?raw';
import blurGaussianDirFrag from '../shaders/blurGaussianDir.frag?raw';
import blurNoiseFrag from '../shaders/blurNoise.frag?raw';
import displaceCubicFrag from '../shaders/displaceCubic.frag?raw';
import displaceSimplexFrag from '../shaders/displaceSimplex.frag?raw';
import displaceSineFrag from '../shaders/displaceSine.frag?raw';
import displaceTextureFrag from '../shaders/displaceTexture.frag?raw';
import gradientMapFrag from '../shaders/gradientMap.frag?raw';
import colorCorrectionFrag from '../shaders/colorCorrection.frag?raw';
import rgbShiftFrag from '../shaders/rgbShift.frag?raw';
import lumaBandsFrag from '../shaders/lumaBands.frag?raw';
import embossEffectFrag from '../shaders/embossEffect.frag?raw';
import lensGridFrag from '../shaders/lensGrid.frag?raw';
import warpGridFrag from '../shaders/warpGrid.frag?raw';
import maskMediaFrag from '../shaders/maskMedia.frag?raw';

const FRAG_SOURCES = {
  fillColor: fillColorFrag,
  fillGradient: fillGradientFrag,
  fillMedia: fillMediaFrag,
  fillNoise: fillNoiseFrag,
  blurComp: blurCompFrag,
  blurGaussianDir: blurGaussianDirFrag,
  blurNoise: blurNoiseFrag,
  displaceCubic: displaceCubicFrag,
  displaceSimplex: displaceSimplexFrag,
  displaceSine: displaceSineFrag,
  displaceTexture: displaceTextureFrag,
  gradientMap: gradientMapFrag,
  colorCorrection: colorCorrectionFrag,
  rgbShift: rgbShiftFrag,
  lumaBands: lumaBandsFrag,
  embossEffect: embossEffectFrag,
  lensGrid: lensGridFrag,
  warpGrid: warpGridFrag,
  maskMedia: maskMediaFrag,
};

// p — корневой p5-инстанс: константы (HALF_FLOAT и др.) живут на p5.prototype
// и есть только у p5-инстансов; p5.Graphics их НЕ наследует (p5 2.2.3), поэтому
// glc.HALF_FLOAT === undefined и p5 молча откатился бы к UNSIGNED_BYTE.
export function createPipeline(glc, p) {
  const fboOpts = { format: p.HALF_FLOAT, depth: false, antialias: false };
  const fboBlank = glc.createFramebuffer(fboOpts);
  const fbos = [glc.createFramebuffer(fboOpts), glc.createFramebuffer(fboOpts)];
  const fboStatic = glc.createFramebuffer(fboOpts);
  let ping = 0;
  let staticDirty = true;
  let cachedSplit = -1;

  const shaders = {};
  for (const [key, frag] of Object.entries(FRAG_SOURCES)) {
    shaders[key] = glc.createShader(lumenVert, frag);
  }

  // 1×1 белая заглушка для неиспользуемого u_mask.
  const maskPlaceholder = glc.createFramebuffer({ width: 1, height: 1, depth: false });
  maskPlaceholder.draw(() => glc.clear(1, 1, 1, 1));

  // FBO-пул именованных буферов (маски, временные цели модулей с run()).
  const pool = {};
  function getBuffer(name, opts = {}) {
    const defaults = { width: glc.width, height: glc.height, format: p.HALF_FLOAT, depth: false, antialias: false };
    const merged = { ...defaults, ...opts };
    const existing = pool[name];
    if (existing) {
      if (existing.width !== merged.width || existing.height !== merged.height) {
        existing.resize(merged.width, merged.height);
      }
      return existing;
    }
    const fbo = glc.createFramebuffer(merged);
    pool[name] = fbo;
    return fbo;
  }

  const blur = createBlurEngine(glc, p, shaders);

  function nextTarget() {
    ping ^= 1;
    return fbos[ping];
  }

  // runCtx, передаваемый в модульные хуки run({ ctx, inst, inputTex, env, maskTex }).
  const ctx = {
    glc,
    p,
    shaders,
    pool,
    maskStack: [],
    blur,
    nextTarget,
    getBuffer,
    maskPlaceholder,
  };

  function runPass(inst, inputTex, env, maskTex) {
    const mod = MODULES[inst.module];
    if (!mod) return inputTex;
    if (inst.module === 'fillMedia') {
      const entry = env.media.get(inst.params.image);
      if (!entry?.ready) return inputTex; // как старый код: медиа нет — пасс прозрачен
    }
    const fbo = nextTarget();
    const sh = shaders[inst.module];
    fbo.begin();
    glc.clear();
    glc.shader(sh);
    sh.setUniform('u_src', inputTex);
    sh.setUniform('u_mask', maskTex ?? maskPlaceholder.color);
    sh.setUniform('u_maskUse', !!maskTex);
    const u = mod.uniforms(inst.params, env);
    for (const name in u) sh.setUniform(name, u[name]);
    if (inst.module === 'fillMedia') {
      const entry = env.media.get(inst.params.image);
      sh.setUniform('u_img', entry.tex);
      sh.setUniform('u_imgRes', entry.res);
    }
    glc.rect(-glc.width / 2, -glc.height / 2, glc.width, glc.height);
    fbo.end();
    return fbo.color;
  }

  function runStackRange(stack, env, start, end, inputTex) {
    resetMaskStack(ctx);
    let tex = inputTex;
    for (let i = start; i < end; i++) {
      const inst = stack[i];
      if (inst.type === 'mask') {
        if (!inst.enabled) continue;
        resetMaskStack(ctx);
        const mod = MODULES[inst.module];
        if (!mod?.run) continue;
        mod.run({ ctx, inst, inputTex: tex, env }); // маска не меняет вход
        continue;
      }
      if (inst.type !== 'pass') continue;
      const mask = activeMask(ctx);
      const maskTex = mask ? getBuffer(mask.bufName).color : null;
      if (!inst.enabled) {
        consumeMaskCharge(ctx, !!mask); // выключенный пасс тоже списывает заряд
        continue;
      }
      const mod = MODULES[inst.module];
      const result = mod?.run
        ? mod.run({ ctx, inst, inputTex: tex, env, maskTex })
        : runPass(inst, tex, env, maskTex);
      tex = result ?? tex;
      consumeMaskCharge(ctx, !!mask);
    }
    return tex;
  }

  function copyTexToFbo(tex, target) {
    target.begin();
    glc.clear();
    glc.image(tex, -glc.width / 2, -glc.height / 2, glc.width, glc.height);
    target.end();
  }

  /** Прогоняет стек; возвращает текстуру финального пасса (или пустую). */
  function render(stack, env) {
    const split = findStaticSplit(stack);

    // Полный прогон, если кэш бесполезен (всё animated / есть маски / split=0).
    if (split <= 0) {
      return runStackRange(stack, env, 0, stack.length, fboBlank.color);
    }

    // Пересобрать static prefix при dirty или смене split.
    if (staticDirty || cachedSplit !== split) {
      const prefixTex = runStackRange(stack, env, 0, split, fboBlank.color);
      copyTexToFbo(prefixTex, fboStatic);
      staticDirty = false;
      cachedSplit = split;
    }

    // Все слои статичны — отдаём кэш.
    if (split >= stack.length) {
      return fboStatic.color;
    }

    // Анимированный суффикс: старт с кэшированного префикса.
    return runStackRange(stack, env, split, stack.length, fboStatic.color);
  }

  function invalidate() {
    staticDirty = true;
    cachedSplit = -1;
  }

  function resizeAll() {
    fboBlank.resize(glc.width, glc.height);
    fbos[0].resize(glc.width, glc.height);
    fbos[1].resize(glc.width, glc.height);
    fboStatic.resize(glc.width, glc.height);
    Object.values(pool).forEach((fbo) => fbo.resize(glc.width, glc.height));
    blur.resize(glc.width, glc.height);
    invalidate();
  }

  return { render, fboBlank, resizeAll, invalidate, findStaticSplit: (stack) => findStaticSplit(stack) };
}
