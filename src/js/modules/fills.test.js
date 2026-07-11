import { describe, it, expect } from 'vitest';
import { MODULES } from './index.js';
import { GRADIENT_MAX } from './uniformUtils.js';
import { getByPath } from '../../shared/ui/panelBuilder.js';
import { BLEND_MODES, WRAP_MODES, ALPHA_MODES, GRADIENT_MODES } from './optionTables.js';

const ENV = { width: 1200, height: 960, time: 0.25, frameRate: 60, totalFrames: 600, media: {} };

describe('MODULES registry (fills only)', () => {
  it('has the four fill modules', () => {
    const fillKeys = ['fillColor', 'fillGradient', 'fillMedia', 'fillNoise'];
    for (const key of fillKeys) {
      expect(MODULES[key]).toBeTruthy();
      const def = MODULES[key];
      expect(def.key).toBe(key);
      expect(def.type).toBe('pass');
      expect(typeof def.uniforms).toBe('function');
    }
  });
});

describe('fillColor.uniforms (bundle 47303)', () => {
  it('maps defaults verbatim', () => {
    const u = MODULES.fillColor.uniforms(MODULES.fillColor.defaults, ENV);
    expect(Array.from(u.u_color)).toEqual([1, 1, 1, 1]); // #FFFFFF, mix 1
    expect(u.u_blendMode).toBe(0);
    expect(u.u_alphaMode).toBe(0);
  });
  it('bakes mix into color alpha', () => {
    const u = MODULES.fillColor.uniforms({ ...MODULES.fillColor.defaults, color: '#FF0000', mix: 0.5 }, ENV);
    expect(Array.from(u.u_color)).toEqual([1, 0, 0, 0.5]);
  });
});

describe('fillGradient.uniforms (bundle 47320-47326)', () => {
  it('maps defaults verbatim', () => {
    const p = MODULES.fillGradient.defaults;
    const u = MODULES.fillGradient.uniforms(p, ENV);
    expect(u.u_aspect).toBeCloseTo(1200 / 960, 10);
    expect(u.u_resolution).toEqual([1200, 960]);
    expect(u.u_mix).toBe(1);
    expect(u.u_ditherStrength).toBeCloseTo(10 / 255, 10);
    expect(u.u_gradMode).toBe(0);
    expect(u.u_gradCenter).toEqual([0, 0]);
    expect(u.u_gradAngle).toBe(0);
    expect(u.u_gradScale).toEqual([1, 1]); // скаляр дублируется в vec2
    expect(u.u_gradReverse).toBe(false);
    expect(u.u_wrapMode).toBe(0);
    expect(u.u_gradStopCount).toBe(2);
    expect(u.u_gradTime).toHaveLength(GRADIENT_MAX);
    expect(u.u_gradColor).toHaveLength(GRADIENT_MAX * 4);
    expect(u.u_gradColor.slice(0, 8)).toEqual([1, 1, 1, 1, 0, 0, 0, 1]);
  });
  it('converts angle degrees to radians', () => {
    const u = MODULES.fillGradient.uniforms({ ...MODULES.fillGradient.defaults, gradAngle: 90 }, ENV);
    expect(u.u_gradAngle).toBeCloseTo(Math.PI / 2, 10);
  });
});

describe('fillMedia.uniforms (bundle 47369)', () => {
  it('maps params verbatim (scale /100, rotate rad, offset /100)', () => {
    const p = { ...MODULES.fillMedia.defaults, scale: 150, rotate: 45, position: { x: 10, y: -20 } };
    const u = MODULES.fillMedia.uniforms(p, ENV);
    expect(u.u_scale).toBeCloseTo(1.5, 10);
    expect(u.u_rotate).toBeCloseTo(Math.PI / 4, 10);
    expect(u.u_offset).toEqual([0.1, -0.2]);
    expect(u.u_wrapMode).toBe(3); // дефолт fillMedia
    expect(u.u_blendMode).toBe(0);
    expect(u.u_mix).toBe(1);
    expect(u.u_srcRes).toEqual([1200, 960]);
  });
});

describe('fillNoise.uniforms (bundle 47286)', () => {
  it('maps defaults + env verbatim', () => {
    const u = MODULES.fillNoise.uniforms(MODULES.fillNoise.defaults, ENV);
    expect(u.u_mix).toBeCloseTo(0.2, 10);
    expect(u.u_blendMode).toBe(0);
    expect(u.u_contrast).toBe(1);
    expect(u.u_grainPx).toBe(1); // p.size
    expect(u.u_colorNoise).toBe(false);
    expect(u.u_alphaMode).toBe(0);
    expect(u.u_threshRange).toEqual([0, 1]);
    expect(u.u_threshSoft).toBe(0.25); // константа старого кода
    expect(u.u_fps).toBe(0);
    expect(u.u_time).toBe(0.25);
    expect(u.u_clipFps).toBe(60);
    expect(u.u_totalFrames).toBe(600);
    expect(u.u_seed).toBe(0); // константа старого кода
    expect(u.u_srcRes).toEqual([1200, 960]);
  });
});

describe('zero-alloc contract', () => {
  it('uniforms() returns the same object on repeated calls', () => {
    const m = MODULES.fillGradient;
    const a = m.uniforms(m.defaults, ENV);
    const b = m.uniforms(m.defaults, ENV);
    expect(b).toBe(a);
  });
});

describe('option tables (verbatim from reference)', () => {
  it('blend modes: 26 entries Normal..Luminosity', () => {
    expect(Object.keys(BLEND_MODES)).toHaveLength(26);
    expect(BLEND_MODES.Normal).toBe(0);
    expect(BLEND_MODES.Luminosity).toBe(25);
  });
  it('wrap/alpha/gradient modes', () => {
    expect(WRAP_MODES).toEqual({ CLAMP: 0, REPEAT: 1, MIRROR: 2, TRANSPARENT: 3 });
    expect(ALPHA_MODES).toEqual({ 'Ignore Source Alpha': 0, 'Fade by Source Alpha': 1 });
    expect(GRADIENT_MODES).toEqual({ Linear: 0, Radial: 1, Angular: 2, Box: 3, Triangle: 4 });
  });
});

describe('module control schemas', () => {
  it('every fill module declares controls and every path resolves into defaults', () => {
    const fillKeys = ['fillColor', 'fillGradient', 'fillMedia', 'fillNoise'];
    for (const key of fillKeys) {
      const def = MODULES[key];
      expect(Array.isArray(def.controls)).toBe(true);
      expect(def.controls.length).toBeGreaterThan(0);
      for (const c of def.controls) {
        expect(getByPath(def.defaults, c.path)).not.toBeUndefined();
      }
    }
  });
  it('fillGradient has gradientMapper + centerPoint with reference axes', () => {
    const cs = MODULES.fillGradient.controls;
    expect(cs.find((c) => c.type === 'gradientMapper')?.path).toBe('gradient');
    const cp = cs.find((c) => c.type === 'centerPoint');
    expect(cp.path).toBe('gradCenter');
    expect(cp.axes.x).toEqual({ min: -0.5, max: 0.5, step: 0.01 });
  });
  it('fillMedia position axes are ±50 (reference), image is a select over DEFAULT_MEDIA', () => {
    const cs = MODULES.fillMedia.controls;
    expect(cs.find((c) => c.path === 'position')?.axes.x).toEqual({ min: -50, max: 50, step: 0.1 });
    const img = cs.find((c) => c.path === 'image');
    expect(img.type).toBe('select');
    expect(Object.values(img.options)).toContain('text0');
  });
  it('fillNoise threshold is two sliders (interval transcription)', () => {
    const cs = MODULES.fillNoise.controls;
    expect(cs.find((c) => c.path === 'threshold.min')).toBeTruthy();
    expect(cs.find((c) => c.path === 'threshold.max')).toBeTruthy();
  });
});
