import { describe, it, expect } from 'vitest';
import { MODULES } from './index.js';
import { getByPath } from '../../shared/ui/panelBuilder.js';
import { SINE_MODES, FREQ_MODES, SIMPLEX_NOISE_MODES, DISPLACE_TEXTURE_SOURCE_MODES } from './optionTables.js';

const ENV = { width: 1200, height: 960, time: 0.25, frameRate: 60, totalFrames: 600, scaleValue: 2.5, media: {} };

describe('Displace-группа modules registry', () => {
  it('has exactly four displace group modules', () => {
    const displaceKeys = ['displaceSine', 'displaceCubic', 'displaceSimplex', 'displaceTexture'];
    for (const key of displaceKeys) {
      expect(MODULES[key]).toBeTruthy();
      const def = MODULES[key];
      expect(def.key || def.label).toBeTruthy();
      expect(def.type).toBe('pass');
      // displaceSine/Cubic/Simplex: uniforms(); displaceTexture: run()
      expect(def.uniforms || def.run).toBeTruthy();
    }
  });
});

describe('displaceSine.uniforms (bundle 47215-47233)', () => {
  it('maps defaults with amp remap and freq selection', () => {
    const p = MODULES.displaceSine.defaults;
    const u = MODULES.displaceSine.uniforms(p, ENV);
    // amp: 10 → map(10, 0, 100, 0, 0.25) = 0.025
    expect(u.u_amp).toEqual([0.025, 0.025]);
    expect(u.u_time).toBe(ENV.time);
    expect(u.u_mode).toBe(0); // sineMode default
    expect(u.u_compress).toBe(0);
    expect(u.u_aspect).toBe(0);
    expect(u.u_freq).toEqual([10, 10]); // freqLow when freqMode=0
    expect(u.u_speed).toEqual([0, 0]); // cycle default
    expect(u.u_phase).toEqual([0, 0]);
    expect(u.u_angle).toBeCloseTo(0, 10);
    expect(u.u_center).toEqual([0, 0]);
    expect(u.u_wrapMode).toBe(0);
  });

  it('amp 50 maps to 0.125', () => {
    const p = { ...MODULES.displaceSine.defaults, amp: 50 };
    const u = MODULES.displaceSine.uniforms(p, ENV);
    expect(u.u_amp[0]).toBeCloseTo(0.125, 10);
    expect(u.u_amp[1]).toBeCloseTo(0.125, 10);
  });

  it('freqMode 1 uses freqHigh', () => {
    const p = { ...MODULES.displaceSine.defaults, freqMode: 1, freqHigh: 100 };
    const u = MODULES.displaceSine.uniforms(p, ENV);
    expect(u.u_freq).toEqual([100, 100]);
  });

  it('converts angle to radians', () => {
    const p = { ...MODULES.displaceSine.defaults, angle: 90 };
    const u = MODULES.displaceSine.uniforms(p, ENV);
    expect(u.u_angle).toBeCloseTo(Math.PI / 2, 10);
  });

  it('packs center.x/y and phase as pairs', () => {
    const p = { ...MODULES.displaceSine.defaults, center: { x: 0.5, y: -0.3 }, phase: 0.25 };
    const u = MODULES.displaceSine.uniforms(p, ENV);
    expect(u.u_center).toEqual([0.5, -0.3]);
    expect(u.u_phase).toEqual([0.25, 0.25]);
  });
});

describe('displaceCubic.uniforms (bundle 47198-47214)', () => {
  it('maps defaults verbatim', () => {
    const p = MODULES.displaceCubic.defaults;
    const u = MODULES.displaceCubic.uniforms(p, ENV);
    expect(u.u_tileXY).toEqual([8, 8]);
    expect(u.u_ampXY).toEqual([0.7, 0.7]);
    expect(u.u_aspect).toBe(0);
    expect(u.u_angle).toBeCloseTo(0, 10);
    expect(u.u_time).toBe(ENV.time);
    expect(u.u_speedXY).toEqual([0, 0]);
    expect(u.u_phase).toBe(0);
    expect(u.u_wrapMode).toBe(0);
  });

  it('converts angle to radians', () => {
    const p = { ...MODULES.displaceCubic.defaults, angle: 45 };
    const u = MODULES.displaceCubic.uniforms(p, ENV);
    expect(u.u_angle).toBeCloseTo(Math.PI / 4, 10);
  });

  it('packs tile and speed as pairs', () => {
    const p = {
      ...MODULES.displaceCubic.defaults,
      tile: { x: 4, y: 16 },
      cycle: { x: 1.5, y: -0.5 },
    };
    const u = MODULES.displaceCubic.uniforms(p, ENV);
    expect(u.u_tileXY).toEqual([4, 16]);
    expect(u.u_speedXY).toEqual([1.5, -0.5]);
  });
});

describe('displaceSimplex.uniforms (bundle 47234-47253)', () => {
  it('maps defaults with amp and speed remapping', () => {
    const p = MODULES.displaceSimplex.defaults;
    const u = MODULES.displaceSimplex.uniforms(p, ENV);
    // amp: 10 → map(10, 0, 100, 0, 1) = 0.1
    expect(u.u_amp).toEqual([0.1, 0.1]);
    expect(u.u_time).toBe(ENV.time);
    expect(u.u_mode).toBe(0); // noiseMode default
    expect(u.u_aspect).toBe(0);
    expect(u.u_angleDomain).toBeCloseTo(0, 10);
    expect(u.u_angleVector).toBeCloseTo(0, 10);
    expect(u.u_freq).toEqual([10, 10]); // freqLow when freqMode=0
    // speed: 0 → map(0, 0, 100, 0, 0.01) × totalFrames = 0 × 600 = 0
    expect(u.u_speed).toEqual([0, 0]);
    expect(u.u_seed).toBe(0);
    expect(u.u_octaves).toBe(1);
    expect(u.u_wrapMode).toBe(0);
  });

  it('amp 100 maps to 1', () => {
    const p = { ...MODULES.displaceSimplex.defaults, amp: 100 };
    const u = MODULES.displaceSimplex.uniforms(p, ENV);
    expect(u.u_amp[0]).toBeCloseTo(1, 10);
    expect(u.u_amp[1]).toBeCloseTo(1, 10);
  });

  it('speed 50 maps to 0.005 × totalFrames = 3', () => {
    const p = { ...MODULES.displaceSimplex.defaults, speed: 50 };
    const u = MODULES.displaceSimplex.uniforms(p, ENV);
    // map(50, 0, 100, 0, 0.01) = 0.005; 0.005 × 600 = 3
    expect(u.u_speed[0]).toBeCloseTo(3, 10);
    expect(u.u_speed[1]).toBeCloseTo(3, 10);
  });

  it('freqMode 1 uses freqHigh', () => {
    const p = { ...MODULES.displaceSimplex.defaults, freqMode: 1, freqHigh: 500 };
    const u = MODULES.displaceSimplex.uniforms(p, ENV);
    expect(u.u_freq).toEqual([500, 500]);
  });

  it('converts angles to radians', () => {
    const p = {
      ...MODULES.displaceSimplex.defaults,
      angleDomain: 180,
      angleVector: -90,
    };
    const u = MODULES.displaceSimplex.uniforms(p, ENV);
    expect(u.u_angleDomain).toBeCloseTo(Math.PI, 10);
    expect(u.u_angleVector).toBeCloseTo(-Math.PI / 2, 10);
  });

  it('packs octaves and seed', () => {
    const p = {
      ...MODULES.displaceSimplex.defaults,
      octaves: 3,
      seed: 42,
    };
    const u = MODULES.displaceSimplex.uniforms(p, ENV);
    expect(u.u_octaves).toBe(3);
    expect(u.u_seed).toBe(42);
  });
});

describe('displaceTexture (bundle 47254-47269)', () => {
  it('is a pass-type module with run() hook', () => {
    const def = MODULES.displaceTexture;
    expect(def.type).toBe('pass');
    expect(typeof def.run).toBe('function');
    expect(MODULES.displaceTexture.uniforms).toBeUndefined(); // no uniforms(), only run()
  });

  it('has texture and source media selects in controls', () => {
    const cs = MODULES.displaceTexture.controls;
    const textureCtrl = cs.find((c) => c.path === 'texture');
    const sourceCtrl = cs.find((c) => c.path === 'source');
    expect(textureCtrl?.type).toBe('media');
    expect(sourceCtrl?.type).toBe('media');
  });

  it('scale and offset divisons by 100 in defaults', () => {
    const p = MODULES.displaceTexture.defaults;
    expect(p.scale).toBe(100); // will be /100 in uniforms
    expect(p.position).toEqual({ x: 0, y: 0 });
    expect(p.scaleSrc).toBe(100);
    expect(p.positionSrc).toEqual({ x: 0, y: 0 });
  });

  it('weight pair in defaults', () => {
    const p = MODULES.displaceTexture.defaults;
    expect(p.weight).toEqual({ x: 0.5, y: 0.5 });
  });
});

describe('zero-alloc contract (displace group)', () => {
  it('uniforms() returns the same object on repeated calls', () => {
    for (const key of ['displaceSine', 'displaceCubic', 'displaceSimplex']) {
      const m = MODULES[key];
      const a = m.uniforms(m.defaults, ENV);
      const b = m.uniforms(m.defaults, ENV);
      expect(b).toBe(a);
    }
  });
});

describe('module control schemas (displace group)', () => {
  it('every displace module declares controls and every path resolves into defaults', () => {
    for (const key of ['displaceSine', 'displaceCubic', 'displaceSimplex', 'displaceTexture']) {
      const def = MODULES[key];
      expect(Array.isArray(def.controls)).toBe(true);
      expect(def.controls.length).toBeGreaterThan(0);
      for (const c of def.controls) {
        if (c.path) {
          expect(getByPath(def.defaults, c.path)).not.toBeUndefined();
        }
      }
    }
  });

  it('every control has a path (no separators leak into schemas)', () => {
    for (const key of ['displaceSine', 'displaceCubic', 'displaceSimplex', 'displaceTexture']) {
      const def = MODULES[key];
      for (const c of def.controls) {
        expect(typeof c.path, `${key}: control without path (${c.type})`).toBe('string');
      }
    }
  });

  it('displaceSine has point2d center with showIf for radial modes', () => {
    const cs = MODULES.displaceSine.controls;
    const center = cs.find((c) => c.path === 'center');
    expect(center?.type).toBe('centerPoint');
    expect(center?.showIf).toBeTruthy();
  });

  it('displaceCubic has tile and amp with x/y sliders', () => {
    const cs = MODULES.displaceCubic.controls;
    expect(cs.find((c) => c.path === 'tile.x')).toBeTruthy();
    expect(cs.find((c) => c.path === 'tile.y')).toBeTruthy();
    expect(cs.find((c) => c.path === 'amp.x')).toBeTruthy();
    expect(cs.find((c) => c.path === 'amp.y')).toBeTruthy();
  });

  it('displaceSimplex has octaves slider', () => {
    const cs = MODULES.displaceSimplex.controls;
    expect(cs.find((c) => c.path === 'octaves')).toBeTruthy();
  });

  it('option tables present: SINE_MODES, FREQ_MODES, SIMPLEX_NOISE_MODES, DISPLACE_TEXTURE_SOURCE_MODES', () => {
    expect(SINE_MODES).toEqual({
      'Flow (2D)': 0,
      'Radial (2D)': 1,
      'Radial (Center)': 2,
    });
    expect(FREQ_MODES).toEqual({
      'Low Frequency': 0,
      'High Frequency': 1,
    });
    expect(SIMPLEX_NOISE_MODES).toEqual({
      '1D Noise': 0,
      '2D Noise': 1,
    });
    expect(DISPLACE_TEXTURE_SOURCE_MODES).toEqual({
      'Previous Pass': 0,
      'Media File': 1,
    });
  });
});
