// LUMEN — пайплайн шейдерных пассов v2: ping-pong FBO + mask stack + blur.
// present() — identity blit FBO→main with Y-flip. Static-prefix cache when safe.
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

/**
 * @param {object} glc - p5.Graphics WEBGL
 * @param {object} p - root p5 (for HALF_FLOAT / UNSIGNED_BYTE constants)
 * @param {{ format?: number }} [opts] - framebuffer color format
 */
export function createPipeline(glc, p, opts = {}) {
  const format = opts.format ?? p.HALF_FLOAT;
  const fboOpts = { format, depth: false, antialias: false };
  const fboBlank = glc.createFramebuffer(fboOpts);
  const fbos = [glc.createFramebuffer(fboOpts), glc.createFramebuffer(fboOpts)];
  const fboStatic = glc.createFramebuffer(fboOpts);
  fboBlank.draw(() => glc.clear(0, 0, 0, 0));
  fbos[0].draw(() => glc.clear(0, 0, 0, 0));
  fbos[1].draw(() => glc.clear(0, 0, 0, 0));
  fboStatic.draw(() => glc.clear(0, 0, 0, 0));
  let ping = 0;
  let staticDirty = true;
  let cachedSplit = -1;

  const shaders = {};
  for (const [key, frag] of Object.entries(FRAG_SOURCES)) {
    shaders[key] = glc.createShader(lumenVert, frag);
  }

  const maskPlaceholder = glc.createFramebuffer({ width: 1, height: 1, depth: false });
  maskPlaceholder.draw(() => glc.clear(1, 1, 1, 1));

  const pool = {};
  function getBuffer(name, bufOpts = {}) {
    const defaults = { width: glc.width, height: glc.height, format, depth: false, antialias: false };
    const merged = { ...defaults, ...bufOpts };
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

  function setTex(sh, name, tex) {
    if (tex == null || typeof tex === 'number') return;
    sh.setUniform(name, tex);
  }

  function runPass(inst, inputTex, env, maskTex) {
    const mod = MODULES[inst.module];
    if (!mod) return inputTex;
    if (inst.module === 'fillMedia') {
      const entry = env.media.get(inst.params.image);
      if (!entry?.ready) return inputTex;
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
    for (const name in u) {
      if (name === 'u_src' || name === 'u_mask' || name === 'u_maskUse' || name === 'u_img') continue;
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
        mod.run({ ctx, inst, inputTex: tex, env });
        continue;
      }
      if (inst.type !== 'pass') continue;
      const mask = activeMask(ctx);
      const maskTex = mask ? getBuffer(mask.bufName).color : null;
      if (!inst.enabled) {
        consumeMaskCharge(ctx, !!mask);
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
   * Full stack with optional static-prefix cache.
   * Cache stores layers [0, split) when no masks precede the first animated pass.
   * Copy uses blur.copy (never p5.image) so userFillShader cannot poison the blit.
   */
  function render(stack, env) {
    const split = findStaticSplit(stack);

    if (split <= 0) {
      staticDirty = true;
      cachedSplit = -1;
      return runStackRange(stack, env, 0, stack.length, fboBlank.color);
    }

    if (staticDirty || cachedSplit !== split) {
      const prefixTex = runStackRange(stack, env, 0, split, fboBlank.color);
      blur.copy(prefixTex, fboStatic, glc.width, glc.height);
      staticDirty = false;
      cachedSplit = split;
    }

    if (split >= stack.length) {
      return fboStatic.color;
    }

    return runStackRange(stack, env, split, stack.length, fboStatic.color);
  }

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
    staticDirty = true;
    cachedSplit = -1;
  }

  function resizeAll() {
    fboBlank.resize(glc.width, glc.height);
    fbos[0].resize(glc.width, glc.height);
    fbos[1].resize(glc.width, glc.height);
    fboStatic.resize(glc.width, glc.height);
    fboBlank.draw(() => glc.clear(0, 0, 0, 0));
    fbos[0].draw(() => glc.clear(0, 0, 0, 0));
    fbos[1].draw(() => glc.clear(0, 0, 0, 0));
    fboStatic.draw(() => glc.clear(0, 0, 0, 0));
    Object.values(pool).forEach((fbo) => fbo.resize(glc.width, glc.height));
    blur.resize(glc.width, glc.height);
    invalidate();
  }

  return {
    render,
    present,
    fboBlank,
    resizeAll,
    invalidate,
    findStaticSplit: (stack) => findStaticSplit(stack),
    format,
  };
}
