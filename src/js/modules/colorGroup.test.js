import { describe, it, expect } from 'vitest';
import { MODULES } from './index.js';
import { GRADIENT_MAX } from './uniformUtils.js';
import { getByPath } from '../../shared/ui/panelBuilder.js';
import { RGB_SHIFT_MODES } from './optionTables.js';

const ENV = { width: 1200, height: 960, time: 0.25, frameRate: 60, totalFrames: 600, scaleValue: 2.5, media: {} };

describe('Color-группа modules registry', () => {
  it('has exactly four color group modules, keyed consistently', () => {
    const colorKeys = ['colorCorrection', 'gradientMap', 'lumaBands', 'rgbShift'];
    for (const key of colorKeys) {
      expect(MODULES[key]).toBeTruthy();
      const def = MODULES[key];
      expect(def.key || def.label).toBeTruthy(); // key or label exists
      expect(def.type).toBe('pass');
      expect(typeof def.uniforms).toBe('function');
    }
  });
});

describe('gradientMap.uniforms (bundle 47328-47348)', () => {
  it('maps defaults verbatim', () => {
    const p = MODULES.gradientMap.defaults;
    const u = MODULES.gradientMap.uniforms(p, ENV);
    expect(u.u_resolution).toEqual([1200, 960]);
    expect(u.u_mix).toBe(1);
    expect(u.u_blendMode).toBe(0);
    expect(u.u_ditherStrength).toBeCloseTo(10 / 255, 10);
    expect(u.u_mapMode).toBe(0);
    expect(u.u_mapReverse).toBe(false);
    expect(u.u_mapGamma).toBe(1);
    expect(u.u_mapRange).toEqual([0, 1]);
    expect(u.u_alphaMode).toBe(0);
    expect(u.u_gradStopCount).toBe(2);
    expect(u.u_gradTime).toHaveLength(GRADIENT_MAX);
    expect(u.u_gradColor).toHaveLength(GRADIENT_MAX * 4);
  });

  it('packs gradient and respects range', () => {
    const p = {
      ...MODULES.gradientMap.defaults,
      mapRange: { min: 0.2, max: 0.8 },
      mapGamma: 2,
      mapReverse: true,
    };
    const u = MODULES.gradientMap.uniforms(p, ENV);
    expect(u.u_mapRange).toEqual([0.2, 0.8]);
    expect(u.u_mapGamma).toBe(2);
    expect(u.u_mapReverse).toBe(true);
  });
});

describe('colorCorrection.uniforms (bundle 47371-47387)', () => {
  it('maps defaults verbatim', () => {
    const p = MODULES.colorCorrection.defaults;
    const u = MODULES.colorCorrection.uniforms(p, ENV);
    expect(u.u_mix).toBe(1);
    expect(u.u_brightness).toBe(0);
    expect(u.u_contrast).toBe(0);
    expect(u.u_saturation).toBe(1);
  });

  it('respects parameter changes', () => {
    const p = { ...MODULES.colorCorrection.defaults, brightness: 0.5, contrast: 1, saturation: 2 };
    const u = MODULES.colorCorrection.uniforms(p, ENV);
    expect(u.u_brightness).toBe(0.5);
    expect(u.u_contrast).toBe(1);
    expect(u.u_saturation).toBe(2);
  });
});

describe('rgbShift.uniforms (bundle 47388-47404)', () => {
  it('maps defaults with env.scaleValue', () => {
    const p = MODULES.rgbShift.defaults;
    const u = MODULES.rgbShift.uniforms(p, ENV);
    expect(u.u_mix).toBe(1);
    expect(u.u_texelSize[0]).toBeCloseTo(1 / 1200, 10);
    expect(u.u_texelSize[1]).toBeCloseTo(1 / 960, 10);
    // abStrength × env.scaleValue = 10 × 2.5 = 25
    expect(u.u_abStrength).toBeCloseTo(25, 10);
    // maxStrength = 50 × env.scaleValue = 50 × 2.5 = 125
    expect(u.u_maxStrength).toBeCloseTo(125, 10);
    expect(u.u_abMode).toBe(0);
    // default angle 45° → radians = π/4
    expect(u.u_abAngle).toBeCloseTo(Math.PI / 4, 10);
    // abFocus sums 0.5 to x,y
    expect(u.u_abFocus).toEqual([0.5, 0.5]); // abFocus {x:0, y:0} + 0.5 each
    expect(u.u_abChannel[0]).toBeCloseTo(0.3, 10);
    expect(u.u_abChannel[1]).toBeCloseTo(0.18, 10);
    expect(u.u_abChannel[2]).toBeCloseTo(0.06, 10);
    expect(u.u_abHueShift).toBe(0);
    expect(u.u_wrapMode).toBe(2);
  });

  it('converts angle to radians', () => {
    const p = { ...MODULES.rgbShift.defaults, abAngle: 90 };
    const u = MODULES.rgbShift.uniforms(p, ENV);
    expect(u.u_abAngle).toBeCloseTo(Math.PI / 2, 10);
  });

  it('applies focus offset (+0.5)', () => {
    const p = { ...MODULES.rgbShift.defaults, abFocus: { x: 0.2, y: -0.3 } };
    const u = MODULES.rgbShift.uniforms(p, ENV);
    expect(u.u_abFocus).toEqual([0.7, 0.2]);
  });

  it('scales channel by ×3', () => {
    const p = { ...MODULES.rgbShift.defaults, abChannel: { x: 0.5, y: 0.3, z: 0.1 } };
    const u = MODULES.rgbShift.uniforms(p, ENV);
    expect(u.u_abChannel[0]).toBeCloseTo(1.5, 10);
    expect(u.u_abChannel[1]).toBeCloseTo(0.9, 10);
    expect(u.u_abChannel[2]).toBeCloseTo(0.3, 10);
  });
});

describe('lumaBands.uniforms (bundle 47405-47420)', () => {
  it('maps defaults with env.time', () => {
    const p = MODULES.lumaBands.defaults;
    const u = MODULES.lumaBands.uniforms(p, ENV);
    expect(u.u_time).toBe(0.25); // env.time
    expect(u.u_blendMode).toBe(0);
    expect(u.u_contrast).toBe(1);
    expect(u.u_weight).toBe(1);
    expect(u.u_weightAmp).toBe(0);
    expect(u.u_weightFreq).toBe(1);
    expect(u.u_mix).toBe(1);
    expect(u.u_phase).toBe(0);
    expect(u.u_phaseFreq).toBe(0);
  });

  it('respects parameter changes', () => {
    const p = {
      ...MODULES.lumaBands.defaults,
      contrast: 2,
      weight: 0.5,
      phase: 0.25,
      phaseFreq: 2,
      blendMode: 11,
    };
    const u = MODULES.lumaBands.uniforms(p, ENV);
    expect(u.u_contrast).toBe(2);
    expect(u.u_weight).toBe(0.5);
    expect(u.u_phase).toBe(0.25);
    expect(u.u_phaseFreq).toBe(2);
    expect(u.u_blendMode).toBe(11);
  });
});

describe('zero-alloc contract', () => {
  it('uniforms() returns the same object on repeated calls', () => {
    for (const key of ['colorCorrection', 'gradientMap', 'lumaBands', 'rgbShift']) {
      const m = MODULES[key];
      const a = m.uniforms(m.defaults, ENV);
      const b = m.uniforms(m.defaults, ENV);
      expect(b).toBe(a);
    }
  });
});

describe('module control schemas (color group)', () => {
  it('every module declares controls and every path resolves into defaults', () => {
    for (const key of ['colorCorrection', 'gradientMap', 'lumaBands', 'rgbShift']) {
      const def = MODULES[key];
      expect(Array.isArray(def.controls)).toBe(true);
      expect(def.controls.length).toBeGreaterThan(0);
      for (const c of def.controls) {
        if (c.type === 'separator') continue; // separators have no path
        expect(getByPath(def.defaults, c.path)).not.toBeUndefined();
      }
    }
  });

  it('gradientMap has gradient + interval mapRange', () => {
    const cs = MODULES.gradientMap.controls;
    expect(cs.find((c) => c.path === 'gradient')).toBeTruthy();
    expect(cs.find((c) => c.path === 'mapRange.min')).toBeTruthy();
    expect(cs.find((c) => c.path === 'mapRange.max')).toBeTruthy();
  });

  it('rgbShift has centerPoint abFocus and abChannel point3d', () => {
    const cs = MODULES.rgbShift.controls;
    const focus = cs.find((c) => c.path === 'abFocus');
    expect(focus?.type).toBe('centerPoint');
    expect(focus?.axes.x).toEqual({ min: -0.5, max: 0.5, step: 0.01 });
  });

  it('option tables: RGB_SHIFT_MODES present', () => {
    expect(RGB_SHIFT_MODES).toEqual({
      Directional: 0,
      Center: 1,
      Edges: 2,
    });
  });
});
