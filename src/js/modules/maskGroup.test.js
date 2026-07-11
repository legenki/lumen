// LUMEN — maskMedia (bundle-pretty.js:47498-47522): реестр 19 модулей,
// числовые проверки uniform-маппингов через run() с мок-ctx, pushMask-семантика,
// separator/controls-гварды.
import { describe, it, expect, vi } from 'vitest';
import { MODULES } from './index.js';
import { getByPath } from '../../shared/ui/panelBuilder.js';
import { MASK_CHANNELS } from './optionTables.js';

const ENV_BASE = { width: 1200, height: 960, time: 0.25, frameRate: 60, totalFrames: 600, scaleValue: 2.5 };

function makeCtx() {
  const uniforms = {};
  const shader = { setUniform: vi.fn((name, val) => { uniforms[name] = val; }) };
  const rectCalls = [];
  const drawCalls = [];
  const buffers = {};
  return {
    ctx: {
      glc: {
        width: ENV_BASE.width,
        height: ENV_BASE.height,
        clear: vi.fn(),
        shader: vi.fn(),
        rect: vi.fn((...args) => rectCalls.push(args)),
      },
      shaders: { maskMedia: shader },
      maskStack: [],
      getBuffer: vi.fn((name) => {
        if (!buffers[name]) {
          buffers[name] = {
            color: `COLOR:${name}`,
            draw: vi.fn((fn) => { drawCalls.push(name); fn(); }),
          };
        }
        return buffers[name];
      }),
    },
    shader,
    uniforms,
    rectCalls,
    drawCalls,
    buffers,
  };
}

function mediaEnv(entry) {
  return { ...ENV_BASE, media: { get: vi.fn(() => entry) } };
}

describe('module registry: 19 keys including maskMedia', () => {
  it('has exactly 19 modules', () => {
    expect(Object.keys(MODULES)).toHaveLength(19);
  });

  it('maskMedia is registered with type mask', () => {
    expect(MODULES.maskMedia).toBeTruthy();
    expect(MODULES.maskMedia.type).toBe('mask');
    expect(MODULES.maskMedia.label).toBe('MASK: Media File');
    expect(typeof MODULES.maskMedia.run).toBe('function');
  });
});

describe('maskMedia.run() — no media / not ready guard', () => {
  it('returns inputTex unchanged and does not push a mask when media entry missing', () => {
    const { ctx } = makeCtx();
    const env = mediaEnv(null);
    const inst = { id: 'p02', params: MODULES.maskMedia.defaults, maskMembers: ['p03'] };
    const result = MODULES.maskMedia.run({ ctx, inst, inputTex: 'INPUT', env });
    expect(result).toBe('INPUT');
    expect(ctx.maskStack).toHaveLength(0);
  });

  it('returns inputTex unchanged when media not ready', () => {
    const { ctx } = makeCtx();
    const env = mediaEnv({ ready: false, tex: null, res: [0, 0] });
    const inst = { id: 'p02', params: MODULES.maskMedia.defaults, maskMembers: ['p03'] };
    const result = MODULES.maskMedia.run({ ctx, inst, inputTex: 'INPUT', env });
    expect(result).toBe('INPUT');
    expect(ctx.maskStack).toHaveLength(0);
  });
});

describe('maskMedia.run() — uniform mapping (bundle 47498-47522)', () => {
  it('maps defaults verbatim into shader uniforms', () => {
    const { ctx, shader, rectCalls } = makeCtx();
    const media = { ready: true, tex: 'TEX', res: [256, 256] };
    const env = mediaEnv(media);
    const inst = { id: 'p02', params: MODULES.maskMedia.defaults, maskMembers: [] };
    const result = MODULES.maskMedia.run({ ctx, inst, inputTex: 'INPUT', env });

    expect(shader.setUniform).toHaveBeenCalledWith('u_mask', 'TEX');
    expect(shader.setUniform).toHaveBeenCalledWith('u_maskRes', [256, 256]);
    expect(shader.setUniform).toHaveBeenCalledWith('u_compRes', [1200, 960]);
    expect(shader.setUniform).toHaveBeenCalledWith('u_channel', 0);
    expect(shader.setUniform).toHaveBeenCalledWith('u_maskRange', [0, 1]); // 0/100, 100/100
    expect(shader.setUniform).toHaveBeenCalledWith('u_wrapMode', 0);
    expect(shader.setUniform).toHaveBeenCalledWith('u_scale', 1); // 100/100
    expect(shader.setUniform).toHaveBeenCalledWith('u_rotate', 0); // radians(0)
    expect(shader.setUniform).toHaveBeenCalledWith('u_offset', [0, 0]);
    expect(shader.setUniform).toHaveBeenCalledWith('u_invert', false);
    expect(shader.setUniform).toHaveBeenCalledWith('u_contrast', [0, 1]); // 0/100, 100/100
    expect(rectCalls).toHaveLength(1);
    expect(rectCalls[0]).toEqual([-600, -480, 1200, 960]);
    // mask не меняет цветовую цепочку
    expect(result).toBe('INPUT');
  });

  it('maskRange [50,80] → [0.5,0.8]', () => {
    const { ctx, uniforms } = makeCtx();
    const media = { ready: true, tex: 'TEX', res: [256, 256] };
    const env = mediaEnv(media);
    const p = { ...MODULES.maskMedia.defaults, maskRange: { min: 50, max: 80 } };
    const inst = { id: 'p02', params: p, maskMembers: [] };
    MODULES.maskMedia.run({ ctx, inst, inputTex: 'INPUT', env });
    expect(uniforms.u_maskRange[0]).toBeCloseTo(0.5, 10);
    expect(uniforms.u_maskRange[1]).toBeCloseTo(0.8, 10);
  });

  it('contrast [10,90] → [0.1,0.9]', () => {
    const { ctx, uniforms } = makeCtx();
    const media = { ready: true, tex: 'TEX', res: [256, 256] };
    const env = mediaEnv(media);
    const p = { ...MODULES.maskMedia.defaults, contrast: { min: 10, max: 90 } };
    const inst = { id: 'p02', params: p, maskMembers: [] };
    MODULES.maskMedia.run({ ctx, inst, inputTex: 'INPUT', env });
    expect(uniforms.u_contrast[0]).toBeCloseTo(0.1, 10);
    expect(uniforms.u_contrast[1]).toBeCloseTo(0.9, 10);
  });

  it('scale/100', () => {
    const { ctx, uniforms } = makeCtx();
    const media = { ready: true, tex: 'TEX', res: [256, 256] };
    const env = mediaEnv(media);
    const p = { ...MODULES.maskMedia.defaults, scale: 250 };
    const inst = { id: 'p02', params: p, maskMembers: [] };
    MODULES.maskMedia.run({ ctx, inst, inputTex: 'INPUT', env });
    expect(uniforms.u_scale).toBeCloseTo(2.5, 10);
  });

  it('rotate → radians', () => {
    const { ctx, uniforms } = makeCtx();
    const media = { ready: true, tex: 'TEX', res: [256, 256] };
    const env = mediaEnv(media);
    const p = { ...MODULES.maskMedia.defaults, rotate: 90 };
    const inst = { id: 'p02', params: p, maskMembers: [] };
    MODULES.maskMedia.run({ ctx, inst, inputTex: 'INPUT', env });
    expect(uniforms.u_rotate).toBeCloseTo(Math.PI / 2, 10);
  });

  it('position/100 offset', () => {
    const { ctx, uniforms } = makeCtx();
    const media = { ready: true, tex: 'TEX', res: [256, 256] };
    const env = mediaEnv(media);
    const p = { ...MODULES.maskMedia.defaults, position: { x: 25, y: -10 } };
    const inst = { id: 'p02', params: p, maskMembers: [] };
    MODULES.maskMedia.run({ ctx, inst, inputTex: 'INPUT', env });
    expect(uniforms.u_offset[0]).toBeCloseTo(0.25, 10);
    expect(uniforms.u_offset[1]).toBeCloseTo(-0.1, 10);
  });
});

describe('maskMedia.run() — pushMask semantics (mask-стек)', () => {
  it('does not push a mask when maskMembers is empty', () => {
    const { ctx } = makeCtx();
    const media = { ready: true, tex: 'TEX', res: [256, 256] };
    const env = mediaEnv(media);
    const inst = { id: 'p02', params: MODULES.maskMedia.defaults, maskMembers: [] };
    MODULES.maskMedia.run({ ctx, inst, inputTex: 'INPUT', env });
    expect(ctx.maskStack).toHaveLength(0);
  });

  it('pushes a mask entry with left = maskMembers.length and tex = getBuffer(inst.id).color', () => {
    const { ctx, buffers } = makeCtx();
    const media = { ready: true, tex: 'TEX', res: [256, 256] };
    const env = mediaEnv(media);
    const inst = { id: 'p02', params: MODULES.maskMedia.defaults, maskMembers: ['p03', 'p04'] };
    MODULES.maskMedia.run({ ctx, inst, inputTex: 'INPUT', env });
    expect(ctx.maskStack).toHaveLength(1);
    expect(ctx.maskStack[0]).toMatchObject({ id: 'p02', bufName: 'p02', left: 2 });
    expect(ctx.maskStack[0].tex).toBe(buffers.p02.color);
  });

  it('draws into ctx.getBuffer(inst.id) exactly once', () => {
    const { ctx, drawCalls } = makeCtx();
    const media = { ready: true, tex: 'TEX', res: [256, 256] };
    const env = mediaEnv(media);
    const inst = { id: 'p05', params: MODULES.maskMedia.defaults, maskMembers: [] };
    MODULES.maskMedia.run({ ctx, inst, inputTex: 'INPUT', env });
    expect(drawCalls).toEqual(['p05']);
  });
});

describe('maskMedia controls schema', () => {
  it('every control has a path and resolves into defaults', () => {
    const def = MODULES.maskMedia;
    expect(Array.isArray(def.controls)).toBe(true);
    expect(def.controls.length).toBeGreaterThan(0);
    for (const c of def.controls) {
      expect(typeof c.path, `control without path (${c.type})`).toBe('string');
      expect(getByPath(def.defaults, c.path)).not.toBeUndefined();
    }
  });

  it('has interval controls split into maskRange.min/max and contrast.min/max', () => {
    const cs = MODULES.maskMedia.controls;
    expect(cs.find((c) => c.path === 'maskRange.min')).toBeTruthy();
    expect(cs.find((c) => c.path === 'maskRange.max')).toBeTruthy();
    expect(cs.find((c) => c.path === 'contrast.min')).toBeTruthy();
    expect(cs.find((c) => c.path === 'contrast.max')).toBeTruthy();
  });

  it('has centerPoint position with ±50 axes', () => {
    const cs = MODULES.maskMedia.controls;
    const pos = cs.find((c) => c.path === 'position');
    expect(pos?.type).toBe('centerPoint');
    expect(pos.axes.x).toEqual({ min: -50, max: 50, step: 0.1 });
    expect(pos.axes.y).toEqual({ min: -50, max: 50, step: 0.1 });
  });

  it('has media select for image and select for useChannel/wrapMode', () => {
    const cs = MODULES.maskMedia.controls;
    expect(cs.find((c) => c.path === 'image')?.type).toBe('media');
    expect(cs.find((c) => c.path === 'useChannel')?.type).toBe('select');
    expect(cs.find((c) => c.path === 'wrapMode')?.type).toBe('select');
  });

  it('MASK_CHANNELS option table matches reference', () => {
    expect(MASK_CHANNELS).toEqual({
      Luma: 0,
      Alpha: 1,
      'R Channel': 2,
      'G Channel': 3,
      'B Channel': 4,
    });
  });
});

describe('separator-guard: no separator leaks into any module schema', () => {
  it('every control across all 19 modules has a string path (no separator objects)', () => {
    for (const [key, def] of Object.entries(MODULES)) {
      for (const c of def.controls) {
        expect(typeof c.path, `${key}: control without path (${c.type})`).toBe('string');
        expect(c.type).not.toBe('separator');
      }
    }
  });
});

describe('maskMedia defaults exclude __maskMembers (instance field, not params)', () => {
  it('defaults has no __maskMembers key', () => {
    expect('__maskMembers' in MODULES.maskMedia.defaults).toBe(false);
  });
});
