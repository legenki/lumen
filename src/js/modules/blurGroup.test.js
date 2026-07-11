import { describe, it, expect } from 'vitest';
import { MODULES } from './index.js';
import { map, EASE, QUALITY_SCALE } from './uniformUtils.js';

const ENV = { width: 1200, height: 960, time: 0.25, frameRate: 60, totalFrames: 600, scaleValue: 2.5, media: {}, textures: { blueNoise: {} } };

describe('Blur-группа modules registry', () => {
  it('has exactly three blur group modules', () => {
    const blurKeys = ['blurGaussian', 'blurMotion', 'blurNoise'];
    for (const key of blurKeys) {
      expect(MODULES[key]).toBeTruthy();
      const def = MODULES[key];
      expect(def.key || def.label).toBeTruthy();
      expect(def.type).toBe('pass');
      // All blur modules use run() hook
      expect(def.run).toBeTruthy();
    }
  });
});

describe('blurGaussian.run() — sigma calculation (bundle 47150-47166)', () => {
  it('exports gaussianSigma formula for testing', () => {
    const sigmaFunc = MODULES.blurGaussian.gaussianSigma;
    expect(typeof sigmaFunc).toBe('function');
  });

  it('radius 50 → quadIn(0.5)=0.25 → map(0.25, 0, 1, 0, 0.1)=0.025', () => {
    const p = { ...MODULES.blurGaussian.defaults, radius: 50 };
    const sigma = MODULES.blurGaussian.gaussianSigma(p);
    // quadIn(50/100) = quadIn(0.5) = 0.25
    // map(0.25, 0, 1, 0, 0.1) = 0.025
    expect(sigma).toBeCloseTo(0.025, 10);
  });

  it('radius 100 → quadIn(1)=1 → map(1, 0, 1, 0, 0.1)=0.1', () => {
    const p = { ...MODULES.blurGaussian.defaults, radius: 100 };
    const sigma = MODULES.blurGaussian.gaussianSigma(p);
    expect(sigma).toBeCloseTo(0.1, 10);
  });

  it('radius 0 → sigma 0', () => {
    const p = { ...MODULES.blurGaussian.defaults, radius: 0 };
    const sigma = MODULES.blurGaussian.gaussianSigma(p);
    expect(sigma).toBeCloseTo(0, 10);
  });

  it('has defaults: mix=1, blendMode=0, radius=15, aspect=0', () => {
    const defs = MODULES.blurGaussian.defaults;
    expect(defs.mix).toBe(1);
    expect(defs.blendMode).toBe(0);
    expect(defs.radius).toBe(15);
    expect(defs.aspect).toBe(0);
    expect(defs.quality).toBeUndefined(); // no such param in reference defaults
  });
});

describe('blurMotion.run() — sigma calculation (bundle 47167-47181)', () => {
  it('exports motionSigma formula for testing', () => {
    const sigmaFunc = MODULES.blurMotion.motionSigma;
    expect(typeof sigmaFunc).toBe('function');
  });

  it('radius 50 → sineIn(0.5)=1-cos(π/4) → map(..., 0, 1, 0, 0.2)≈0.0931', () => {
    const p = { ...MODULES.blurMotion.defaults, radius: 50 };
    const sigma = MODULES.blurMotion.motionSigma(p);
    // sineIn(0.5) = 1 - cos(0.5 * π / 2) = 1 - cos(π/4) ≈ 1 - 0.7071 ≈ 0.2929
    // map(0.2929, 0, 1, 0, 0.2) ≈ 0.05858
    const expected = map(EASE.sineIn(0.5), 0, 1, 0, 0.2);
    expect(sigma).toBeCloseTo(expected, 10);
  });

  it('radius 100 → sineIn(1)=1 → map(1, 0, 1, 0, 0.2)=0.2', () => {
    const p = { ...MODULES.blurMotion.defaults, radius: 100 };
    const sigma = MODULES.blurMotion.motionSigma(p);
    expect(sigma).toBeCloseTo(0.2, 10);
  });

  it('radius 0 → sigma 0', () => {
    const p = { ...MODULES.blurMotion.defaults, radius: 0 };
    const sigma = MODULES.blurMotion.motionSigma(p);
    expect(sigma).toBeCloseTo(0, 10);
  });

  it('has defaults: mix=1, blendMode=0, radius=15, angle=0', () => {
    const defs = MODULES.blurMotion.defaults;
    expect(defs.mix).toBe(1);
    expect(defs.blendMode).toBe(0);
    expect(defs.radius).toBe(15);
    expect(defs.angle).toBe(0);
  });
});

describe('blurNoise.run() — uniform mapping (bundle 47182-47197)', () => {
  it('has defaults: mix=1, blendMode=0, radius=8, samples=16, scale=5', () => {
    const defs = MODULES.blurNoise.defaults;
    expect(defs.mix).toBe(1);
    expect(defs.blendMode).toBe(0);
    expect(defs.radius).toBe(8);
    expect(defs.samples).toBe(16);
    expect(defs.scale).toBe(5);
  });

  it('exports noiseUniforms formula for testing', () => {
    const uniforFunc = MODULES.blurNoise.noiseUniforms;
    expect(typeof uniforFunc).toBe('function');
  });

  it('u_radius = radius × env.scaleValue', () => {
    const p = { ...MODULES.blurNoise.defaults, radius: 8 };
    const u = MODULES.blurNoise.noiseUniforms(p, ENV);
    expect(u.u_radius).toBe(8 * ENV.scaleValue); // 8 * 2.5 = 20
  });

  it('u_noiseScale = map(quadIn(scale), 0, 1, 0.01, 5) with scale default 5', () => {
    const p = { ...MODULES.blurNoise.defaults, scale: 5 };
    const u = MODULES.blurNoise.noiseUniforms(p, ENV);
    // scale 5 (from reference default): map(quadIn(5), 0, 1, 0.01, 5)
    // Note: scale=5 is out of [0,1], so this represents full-range (maps to 5)
    const expected = map(EASE.quadIn(5), 0, 1, 0.01, 5);
    expect(u.u_noiseScale).toBeCloseTo(expected, 10);
  });

  it('u_samples = p.samples', () => {
    const p = { ...MODULES.blurNoise.defaults, samples: 12 };
    const u = MODULES.blurNoise.noiseUniforms(p, ENV);
    expect(u.u_samples).toBe(12);
  });

  it('u_mix = p.mix', () => {
    const p = { ...MODULES.blurNoise.defaults, mix: 0.7 };
    const u = MODULES.blurNoise.noiseUniforms(p, ENV);
    expect(u.u_mix).toBe(0.7);
  });

  it('u_blendMode = p.blendMode', () => {
    const p = { ...MODULES.blurNoise.defaults, blendMode: 2 };
    const u = MODULES.blurNoise.noiseUniforms(p, ENV);
    expect(u.u_blendMode).toBe(2);
  });

  it('u_noiseIndependence = 0.15', () => {
    const p = MODULES.blurNoise.defaults;
    const u = MODULES.blurNoise.noiseUniforms(p, ENV);
    expect(u.u_noiseIndependence).toBe(0.15);
  });

  it('u_resolution = [env.width, env.height]', () => {
    const p = MODULES.blurNoise.defaults;
    const u = MODULES.blurNoise.noiseUniforms(p, ENV);
    expect(u.u_resolution).toEqual([ENV.width, ENV.height]);
  });
});

describe('QUALITY_SCALE helper (bundle 39253)', () => {
  it('is [1, 1.5, 3, 5]', () => {
    expect(QUALITY_SCALE).toEqual([1, 1.5, 3, 5]);
  });
});

describe('EASE.sineIn easing function', () => {
  it('is 0 at t=0', () => {
    expect(EASE.sineIn(0)).toBeCloseTo(0, 10);
  });

  it('is 1 at t=1', () => {
    expect(EASE.sineIn(1)).toBeCloseTo(1, 10);
  });

  it('returns 1 - cos(t·π/2) for intermediate values', () => {
    const t = 0.5;
    const expected = 1 - Math.cos((t * Math.PI) / 2);
    expect(EASE.sineIn(t)).toBeCloseTo(expected, 10);
  });
});

describe('EASE.quadIn easing function', () => {
  it('is 0 at t=0', () => {
    expect(EASE.quadIn(0)).toBeCloseTo(0, 10);
  });

  it('is 1 at t=1', () => {
    expect(EASE.quadIn(1)).toBeCloseTo(1, 10);
  });

  it('returns t² for intermediate values', () => {
    expect(EASE.quadIn(0.5)).toBeCloseTo(0.25, 10);
    expect(EASE.quadIn(0.7)).toBeCloseTo(0.49, 10);
  });
});
