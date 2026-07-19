// Регрессия: emboss/lensGrid при pre-blur > 0 съедали ДВА шага пинг-понга,
// из-за чего основной пасс писал в тот же FBO, чей color сэмплировал как u_src.
// С antialias:false p5 при таком самосэмплировании молча подставляет пустую
// текстуру (bindTextures → "prevent a feedback cycle") — весь накопленный стек
// терялся, пресеты с emboss.softness>0 / lensGrid.blur>0 показывали только фон.
// Контракт: run() любого модуля не рисует в FBO, текстуры которого сэмплирует.
import { describe, it, expect } from 'vitest';
import { MODULES } from './index.js';

function makeFbo(id) {
  const fbo = {
    id,
    color: { fboId: id },
    begun: false,
    begin() { fbo.begun = true; activeStack.push(fbo); },
    end() { fbo.begun = false; activeStack.pop(); },
  };
  return fbo;
}

let activeStack = [];

function makeCtx() {
  activeStack = [];
  const fbos = [makeFbo('ping0'), makeFbo('ping1')];
  let ping = 0;
  const pool = {};
  const uniforms = {};
  const sampled = []; // { name, tex, activeFbo } на момент setUniform
  const shader = {
    setUniform(name, value) {
      uniforms[name] = value;
      if (value && typeof value === 'object' && 'fboId' in value) {
        sampled.push({ name, tex: value, activeFbo: activeStack[activeStack.length - 1] ?? null });
      }
    },
  };
  return {
    glc: { width: 200, height: 100, clear() {}, shader() {}, rect() {}, textureWrap() {} },
    p: { CLAMP: 'clamp' },
    shaders: new Proxy({}, { get: () => shader }),
    blur: {
      gaussian(inputTex, target) {
        // как в blurEngine: результат оказывается в target
        target.lastInput = inputTex;
      },
    },
    nextTarget() { ping ^= 1; return fbos[ping]; },
    getBuffer(name) {
      pool[name] ??= makeFbo(`pool:${name}`);
      return pool[name];
    },
    maskPlaceholder: makeFbo('maskPlaceholder'),
    fbos, pool, uniforms, sampled,
  };
}

const ENV = {
  width: 200, height: 100, time: 0, frameRate: 30, totalFrames: 1,
  scaleValue: 2.5, media: {}, textures: {}, draft: true,
};

/** Прогоняет run() так, как это делает пайплайн: input лежит в fbos[ping=0]. */
function runModule(key, params) {
  const ctx = makeCtx();
  const inputTex = ctx.fbos[0].color; // предыдущий пасс писал в fbos[0], ping=0
  const inst = { id: 't1', module: key, enabled: true, params: { ...MODULES[key].defaults, ...params } };
  const result = MODULES[key].run({ ctx, inst, inputTex, env: ENV, maskTex: null });
  return { ctx, inputTex, result };
}

describe('пинг-понг контракт: пасс не пишет в FBO, который сэмплирует', () => {
  it('embossEffect с pre-blur (softness>0) не возвращает input-FBO', () => {
    // softness 0.5 × heightSize 0.5 × scale 2.5 → preBlurPx 0.625 > 0
    const { inputTex, result } = runModule('embossEffect', { softness: 0.5, heightSize: 0.5 });
    expect(result).not.toBe(inputTex);
  });

  it('embossEffect: u_src сэмплируется не из активного FBO', () => {
    const { ctx } = runModule('embossEffect', { softness: 0.5, heightSize: 0.5 });
    for (const s of ctx.sampled) {
      expect(s.activeFbo?.color, `${s.name} сэмплирует активный FBO ${s.activeFbo?.id}`).not.toBe(s.tex);
    }
  });

  it('embossEffect без pre-blur (softness=0) тоже соблюдает контракт', () => {
    const { ctx, inputTex, result } = runModule('embossEffect', { softness: 0 });
    expect(result).not.toBe(inputTex);
    for (const s of ctx.sampled) {
      expect(s.activeFbo?.color).not.toBe(s.tex);
    }
  });

  it('lensGrid с pre-blur (blur>0) не возвращает input-FBO', () => {
    // blur 1 × strength 0.5 × scale 2.5 → preBlurPx 1.25 > 0
    const { inputTex, result } = runModule('lensGrid', { blur: 1, strength: 0.5 });
    expect(result).not.toBe(inputTex);
  });

  it('lensGrid: u_src и u_blur сэмплируются не из активного FBO', () => {
    const { ctx } = runModule('lensGrid', { blur: 1, strength: 0.5 });
    for (const s of ctx.sampled) {
      expect(s.activeFbo?.color, `${s.name} сэмплирует активный FBO ${s.activeFbo?.id}`).not.toBe(s.tex);
    }
  });
});
