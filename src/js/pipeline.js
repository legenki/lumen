// LUMEN — пайплайн шейдерных пассов: ping-pong между fboA/fboB внутри
// WEBGL-графики. Дословный перенос схемы старого filtr-tool:
// setup fbo — bundle-pretty.js:47573-47588 (HALF_FLOAT, depth:false, antialias:true);
// схема пасса — 47271-47420 (begin/clear/shader/uniforms/rect/end → fbo.color);
// nextTarget — 46916-46918 (pingFBO ^= 1).
import { MODULES } from './modules/index.js';
import { getRenderPasses } from './stack.js';

import lumenVert from '../shaders/lumen.vert?raw';
import fillColorFrag from '../shaders/fillColor.frag?raw';
import fillGradientFrag from '../shaders/fillGradient.frag?raw';
import fillMediaFrag from '../shaders/fillMedia.frag?raw';
import fillNoiseFrag from '../shaders/fillNoise.frag?raw';

const FRAG_SOURCES = {
  fillColor: fillColorFrag,
  fillGradient: fillGradientFrag,
  fillMedia: fillMediaFrag,
  fillNoise: fillNoiseFrag,
};

// p — корневой p5-инстанс: константы (HALF_FLOAT и др.) живут на p5.prototype
// и есть только у p5-инстансов; p5.Graphics их НЕ наследует (p5 2.2.3), поэтому
// glc.HALF_FLOAT === undefined и p5 молча откатился бы к UNSIGNED_BYTE.
export function createPipeline(glc, p) {
  const fboOpts = { format: p.HALF_FLOAT, depth: false, antialias: true };
  const fboBlank = glc.createFramebuffer(fboOpts);
  const fbos = [glc.createFramebuffer(fboOpts), glc.createFramebuffer(fboOpts)];
  let ping = 0;

  const shaders = {};
  for (const [key, frag] of Object.entries(FRAG_SOURCES)) {
    shaders[key] = glc.createShader(lumenVert, frag);
  }

  // 1×1 белая заглушка для неиспользуемого u_mask (маски — фаза 5).
  const maskPlaceholder = glc.createFramebuffer({ width: 1, height: 1, depth: false });

  function nextTarget() {
    ping ^= 1;
    return fbos[ping];
  }

  function runPass(inst, inputTex, env) {
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
    sh.setUniform('u_mask', maskPlaceholder.color);
    sh.setUniform('u_maskUse', false);
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

  /** Прогоняет стек; возвращает текстуру финального пасса (или пустую). */
  function render(stack, env) {
    let tex = fboBlank.color;
    const passes = getRenderPasses(stack);
    for (let i = 0; i < passes.length; i++) tex = runPass(passes[i], tex, env);
    return tex;
  }

  return { render, fboBlank };
}
