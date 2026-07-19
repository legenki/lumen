// LUMEN — пайплайн шейдерных пассов v2: ping-pong между fboA/fboB внутри
// WEBGL2-графики + FBO-пул getBuffer(name) + mask-стек + blur-движок.
// present() — identity blit FBO→main через blurComp (не p5.image).
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
import presentFrag from '../shaders/present.frag?raw';

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
  present: presentFrag,
};

// p — корневой p5-инстанс: константы (HALF_FLOAT и др.) живут на p5.prototype
// и есть только у p5-инстансов; p5.Graphics их НЕ наследует (p5 2.2.3), поэтому
// glc.HALF_FLOAT === undefined и p5 молча откатился бы к UNSIGNED_BYTE.
export function createPipeline(glc, p) {
  const fboOpts = { format: p.HALF_FLOAT, depth: false, antialias: false };
  const fboBlank = glc.createFramebuffer(fboOpts);
  const fbos = [glc.createFramebuffer(fboOpts), glc.createFramebuffer(fboOpts)];
  // Initialize color attachments so WebGL never hits "lazy initialization" on first sample.
  fboBlank.draw(() => glc.clear(0, 0, 0, 0));
  fbos[0].draw(() => glc.clear(0, 0, 0, 0));
  fbos[1].draw(() => glc.clear(0, 0, 0, 0));
  let ping = 0;

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
    setTex(sh, 'u_src', inputTex);
    setTex(sh, 'u_mask', maskTex ?? maskPlaceholder.color);
    sh.setUniform('u_maskUse', !!maskTex);
    const u = mod.uniforms(inst.params, env);
    // Skip host-owned sampler uniforms so a module scratch object cannot
    // overwrite them with placeholders (e.g. historic warpGrid u_src: 0).
    for (const name in u) {
      if (name === 'u_src' || name === 'u_mask' || name === 'u_maskUse' || name === 'u_img') continue;
      // Never feed numbers into samplers (p5: "use a number as the data for a texture").
      if (typeof u[name] === 'number' && /tex|img|mask|src|noise|disp|blur|samp/i.test(name)) continue;
      sh.setUniform(name, u[name]);
    }
    if (inst.module === 'fillMedia') {
      const entry = env.media.get(inst.params.image);
      setTex(sh, 'u_img', entry.tex);
      sh.setUniform('u_imgRes', entry.res);
    }
    glc.rect(-glc.width / 2, -glc.height / 2, glc.width, glc.height);
    fbo.end();
    return fbo.color;
  }

  /** setUniform for sampler2D — refuse numbers/null (p5 throws friendly error otherwise). */
  function setTex(sh, name, tex) {
    if (tex == null || typeof tex === 'number') return;
    sh.setUniform(name, tex);
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

  /**
   * Full stack render → final color texture (ping-pong FBO attachment).
   * Static-prefix cache disabled for correctness: partial caching interacted badly
   * with p5 userFillShader / FBO sampling and produced blank frames on presets.
   */
  function render(stack, env) {
    return runStackRange(stack, env, 0, stack.length, fboBlank.color);
  }

  /**
   * Present a pipeline texture onto glc's default (screen) framebuffer.
   * Never use p5.image(): with a leftover userFillShader it re-runs the last
   * effect instead of blitting. present.frag identity-samples with V flipped
   * (FBO attachments vs main canvas orientation in p5/WebGL).
   */
  function present(tex) {
    if (!tex || typeof tex === 'number') {
      glc.clear();
      return;
    }
    glc.clear();
    glc.noStroke();
    glc.textureWrap(p.CLAMP);
    const sh = shaders.present;
    glc.shader(sh);
    setTex(sh, 'u_tex', tex);
    glc.rect(-glc.width / 2, -glc.height / 2, glc.width, glc.height);
    if (typeof glc.resetShader === 'function') glc.resetShader();
  }

  function invalidate() {
    // Reserved for future static-prefix cache / dirty tracking.
  }

  function resizeAll() {
    fboBlank.resize(glc.width, glc.height);
    fbos[0].resize(glc.width, glc.height);
    fbos[1].resize(glc.width, glc.height);
    // Re-clear after resize (attachments wiped).
    fboBlank.draw(() => glc.clear(0, 0, 0, 0));
    fbos[0].draw(() => glc.clear(0, 0, 0, 0));
    fbos[1].draw(() => glc.clear(0, 0, 0, 0));
    Object.values(pool).forEach((fbo) => fbo.resize(glc.width, glc.height));
    blur.resize(glc.width, glc.height);
    invalidate();
  }

  return { render, present, fboBlank, resizeAll, invalidate, findStaticSplit: (stack) => findStaticSplit(stack) };
}
