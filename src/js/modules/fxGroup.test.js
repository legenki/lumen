import { describe, it, expect } from 'vitest';
import { MODULES } from './index.js';
import { EASE } from './uniformUtils.js';

const ENV = { width: 1200, height: 960, time: 0.25, frameRate: 60, totalFrames: 600, scaleValue: 2.5, media: {}, textures: { blueNoise: {} } };

describe('FX-группа modules registry (embossEffect, lensGrid, warpGrid)', () => {
  it('has exactly three fx group modules', () => {
    const fxKeys = ['embossEffect', 'lensGrid', 'warpGrid'];
    for (const key of fxKeys) {
      expect(MODULES[key]).toBeTruthy();
      const def = MODULES[key];
      expect(def.key || def.label).toBeTruthy();
      expect(def.type).toBe('pass');
    }
  });

  it('embossEffect and lensGrid have run() hooks', () => {
    expect(typeof MODULES.embossEffect.run).toBe('function');
    expect(typeof MODULES.lensGrid.run).toBe('function');
  });

  it('warpGrid has uniforms() function', () => {
    expect(typeof MODULES.warpGrid.uniforms).toBe('function');
  });
});

describe('embossEffect.run() — pré-blur and depth scaling (bundle 47421-47446)', () => {
  it('has correct defaults', () => {
    const d = MODULES.embossEffect.defaults;
    expect(d.mix).toBe(1);
    expect(d.blendMode).toBe(0);
    expect(d.heightSource).toBe(0);
    expect(d.depthSize).toBe(20);
    expect(d.heightSize).toBe(0.5);
    expect(d.softness).toBe(0.5);
    expect(d.contourMode).toBe(0);
    expect(d.lightAlt).toBe(30);
    expect(d.lightAngle).toBe(235);
    expect(d.colorMode).toBe(0);
    expect(d.highColor).toBe('#FFFFFF');
    expect(d.highMode).toBe(7);
    expect(d.highOpacity).toBe(0.9);
    expect(d.shadColor).toBe('#CCCCCC');
    expect(d.shadMode).toBe(7);
    expect(d.shadOpacity).toBe(0.9);
  });

  it('exports embossSigma formula for pré-blur calculation', () => {
    const sigmaFunc = MODULES.embossEffect.embossSigma;
    expect(typeof sigmaFunc).toBe('function');
  });

  it('embossSigma: heightSize × softness × scaleValue (pré-blur)', () => {
    const p = { ...MODULES.embossEffect.defaults };
    // 0.5 × 0.5 × 2.5 = 0.625
    const sigma = MODULES.embossEffect.embossSigma(p, ENV);
    expect(sigma).toBeCloseTo(0.625, 10);
  });

  it('exportedHexToRgb test helper for unit tests', () => {
    const rgbFunc = MODULES.embossEffect.testHexToRgb;
    expect(typeof rgbFunc).toBe('function');
    const out = new Float32Array(3);
    const r = rgbFunc('#FF0000', out);
    expect(r).toBe(out);
    expect(Array.from(r)).toEqual([1, 0, 0]);
  });
});

describe('lensGrid.run() — blur and light direction (bundle 47447-47475)', () => {
  it('has correct defaults', () => {
    const d = MODULES.lensGrid.defaults;
    expect(d.mix).toBe(1);
    expect(d.strength).toBe(0.5);
    expect(d.blur).toBe(1);
    expect(d.gridCells).toEqual({ x: 6, y: 6 });
    expect(d.gridScale).toBe(0.9);
    expect(d.gridAngle).toBe(0);
    expect(d.squircle).toBe(8);
    expect(d.lensScale).toBe(1);
    expect(d.ior).toBe(1.5);
    expect(d.curvature).toBe(1);
    expect(d.edgeSoftness).toBe(0.1);
    expect(d.aberration).toBe(0.015);
    expect(d.lightDir).toEqual({ x: 0.66, y: 0.5 });
    expect(d.specAmount).toBe(0.4);
    expect(d.specPower).toBe(0.5);
    expect(d.specColor).toBe('#FFFFFF');
    expect(d.shadowAmount).toBe(0.2);
    expect(d.shadowPower).toBe(0.5);
    expect(d.shadowColor).toBe('#000000');
    expect(d.wrapMode).toBe(2);
  });

  it('exports lensSigma formula for pré-blur', () => {
    const sigmaFunc = MODULES.lensGrid.lensSigma;
    expect(typeof sigmaFunc).toBe('function');
  });

  it('lensSigma: blur × strength × scaleValue (pré-blur)', () => {
    const p = { ...MODULES.lensGrid.defaults };
    // 1 × 0.5 × 2.5 = 1.25
    const sigma = MODULES.lensGrid.lensSigma(p, ENV);
    expect(sigma).toBeCloseTo(1.25, 10);
  });

  it('exports lightDirVector formula: angle-vector from lightDir.x, y-component as-is', () => {
    const vecFunc = MODULES.lensGrid.lightDirVector;
    expect(typeof vecFunc).toBe('function');
  });

  it('lightDirVector: x × 2π → [sin(lightAngle), cos(lightAngle), y]', () => {
    const p = { ...MODULES.lensGrid.defaults }; // lightDir.x = 0.66
    const vec = MODULES.lensGrid.lightDirVector(p);
    const angle = p.lightDir.x * 2 * Math.PI;
    expect(vec[0]).toBeCloseTo(Math.sin(angle), 5);
    expect(vec[1]).toBeCloseTo(Math.cos(angle), 5);
    expect(vec[2]).toBe(p.lightDir.y);
  });

  it('lightDirVector when lightDir.x=0.25 → angle=π/2 → [sin(π/2), cos(π/2), y] = [1, 0, y]', () => {
    const p = { ...MODULES.lensGrid.defaults, lightDir: { x: 0.25, y: 0.5 } };
    const vec = MODULES.lensGrid.lightDirVector(p);
    expect(vec[0]).toBeCloseTo(1, 5); // sin(π/2)
    expect(vec[1]).toBeCloseTo(0, 5); // cos(π/2)
    expect(vec[2]).toBeCloseTo(0.5, 5); // y as-is
  });
});

describe('warpGrid.uniforms() — falloffFocus offset and gridCells mapping (bundle 47476-47497)', () => {
  it('has correct defaults', () => {
    const d = MODULES.warpGrid.defaults;
    expect(d.mix).toBe(1);
    expect(d.strength).toBe(0.1);
    expect(d.cellFeather).toBe(0);
    expect(d.gridMode).toBe(1);
    expect(d.gridCell).toBe(16);
    expect(d.gridCells).toEqual({ x: 16, y: 16 });
    expect(d.gridScale).toBe(1);
    expect(d.gridAngle).toBe(0);
    expect(d.falloffMode).toBe(0);
    expect(d.falloffRange).toEqual({ min: 0, max: 1 });
    expect(d.falloffFocus1D).toBe(0);
    expect(d.falloffFocus2D).toEqual({ x: 0, y: 0 });
    expect(d.wrapMode).toBe(0);
  });

  it('exports gridCellsForMode for testing', () => {
    const func = MODULES.warpGrid.gridCellsForMode;
    expect(typeof func).toBe('function');
  });

  it('gridCellsForMode: mode 0 → [gridCell, 1]', () => {
    const p = { ...MODULES.warpGrid.defaults, gridMode: 0, gridCell: 8 };
    const cells = MODULES.warpGrid.gridCellsForMode(p);
    expect(cells).toEqual([8, 1]);
  });

  it('gridCellsForMode: mode 1 → [gridCell, gridCell]', () => {
    const p = { ...MODULES.warpGrid.defaults, gridMode: 1, gridCell: 16 };
    const cells = MODULES.warpGrid.gridCellsForMode(p);
    expect(cells).toEqual([16, 16]);
  });

  it('gridCellsForMode: mode 2 → [gridCells.x, gridCells.y]', () => {
    const p = { ...MODULES.warpGrid.defaults, gridMode: 2, gridCells: { x: 20, y: 10 } };
    const cells = MODULES.warpGrid.gridCellsForMode(p);
    expect(cells).toEqual([20, 10]);
  });

  it('exports falloffFocusForMode for testing', () => {
    const func = MODULES.warpGrid.falloffFocusForMode;
    expect(typeof func).toBe('function');
  });

  it('falloffFocusForMode: mode 0 → [falloffFocus1D + 0.5, 0.5]', () => {
    const p = { ...MODULES.warpGrid.defaults, gridMode: 0, falloffFocus1D: 0.3 };
    const focus = MODULES.warpGrid.falloffFocusForMode(p);
    expect(focus).toEqual([0.8, 0.5]); // 0.3 + 0.5 = 0.8
  });

  it('falloffFocusForMode: mode 1 or 2 → [falloffFocus2D.x + 0.5, falloffFocus2D.y + 0.5]', () => {
    const p = {
      ...MODULES.warpGrid.defaults,
      gridMode: 1,
      falloffFocus2D: { x: 0.1, y: 0.2 },
    };
    const focus = MODULES.warpGrid.falloffFocusForMode(p);
    expect(focus).toEqual([0.6, 0.7]); // x+0.5, y+0.5
  });

  it('maps uniforms with falloffFocus offset', () => {
    const p = {
      ...MODULES.warpGrid.defaults,
      gridMode: 0,
      strength: 0.2,
    };
    const u = MODULES.warpGrid.uniforms(p, ENV);
    expect(u.u_strength).toBeCloseTo(EASE.sineIn(0.2), 10);
    expect(u.u_aspect).toBeCloseTo(1200 / 960, 10); // w/h
    expect(u.u_mix).toBe(1);
    expect(u.u_gridCells).toEqual([16, 1]); // gridMode 0
    expect(u.u_gridScale).toBe(1);
    expect(u.u_gridAngle).toBeCloseTo(0, 10); // radians(0)
    expect(u.u_blendEdge).toBe(0); // cellFeather
    expect(u.u_falloffMode).toBe(0);
    expect(u.u_falloffRange).toEqual([0, 1]);
    expect(u.u_falloffFocus).toEqual([0.5, 0.5]); // falloffFocus1D=0 + 0.5, and 0.5
  });

  it('applies sineIn easing to strength', () => {
    const p = { ...MODULES.warpGrid.defaults, strength: 1 };
    const u = MODULES.warpGrid.uniforms(p, ENV);
    expect(u.u_strength).toBeCloseTo(EASE.sineIn(1), 10);
  });

  it('converts gridAngle to radians', () => {
    const p = { ...MODULES.warpGrid.defaults, gridAngle: 45 };
    const u = MODULES.warpGrid.uniforms(p, ENV);
    expect(u.u_gridAngle).toBeCloseTo(Math.PI / 4, 10);
  });
});

describe('warpGrid showIf logic for controls', () => {
  it('falloffFocus1D visible only when gridMode === 0', () => {
    const def = MODULES.warpGrid;
    // Find the control for falloffFocus1D
    const ctrl = def.controls.find((c) => c.path === 'falloffFocus1D');
    expect(ctrl).toBeTruthy();
    expect(ctrl.showIf).toBeTruthy();
    // Verify the showIf object has the correct structure
    if (Array.isArray(ctrl.showIf)) {
      // Array of conditions (AND logic)
      expect(ctrl.showIf.some((cond) => cond.key === 'gridMode' && cond.equals === 0)).toBe(true);
      expect(ctrl.showIf.some((cond) => cond.key === 'falloffMode' && cond.notEquals === 0)).toBe(true);
    } else {
      // Single condition
      expect(ctrl.showIf.key).toBe('gridMode');
      expect(ctrl.showIf.equals).toBe(0);
    }
  });

  it('falloffFocus2D visible when gridMode !== 0 AND falloffMode !== 0', () => {
    const def = MODULES.warpGrid;
    const ctrl = def.controls.find((c) => c.path === 'falloffFocus2D');
    expect(ctrl).toBeTruthy();
    expect(ctrl.showIf).toBeTruthy();
    if (Array.isArray(ctrl.showIf)) {
      expect(ctrl.showIf.some((cond) => cond.key === 'gridMode' && cond.notEquals === 0)).toBe(true);
      expect(ctrl.showIf.some((cond) => cond.key === 'falloffMode' && cond.notEquals === 0)).toBe(true);
    }
  });
});

describe('module control schemas (fx group) — contract', () => {
  it('every control has a path (no separators leak into schemas) — all 18 modules', () => {
    for (const def of Object.values(MODULES)) {
      for (const c of def.controls) {
        expect(typeof c.path, `${def.key}: control without path (${c.type})`).toBe('string');
      }
    }
  });

  it('lensGrid has all 19 controls from reference.panels', () => {
    const keys = MODULES.lensGrid.controls.map((c) => c.path);
    const expected = [
      'strength', 'blur', 'gridCells', 'gridScale', 'gridAngle',
      'squircle', 'lensScale', 'edgeSoftness', 'ior', 'curvature',
      'aberration', 'lightDir', 'specAmount', 'specPower', 'specColor',
      'shadowAmount', 'shadowPower', 'shadowColor', 'wrapMode',
    ];
    for (const key of expected) {
      expect(keys, `lensGrid missing control: ${key}`).toContain(key);
    }
    expect(MODULES.lensGrid.controls.length).toBe(19);
  });

  it('embossEffect slider ranges align with reference', () => {
    const c = MODULES.embossEffect.controls;
    const depthSize = c.find((x) => x.path === 'depthSize');
    expect(depthSize.step).toBe(0.1);
    const heightSize = c.find((x) => x.path === 'heightSize');
    expect(heightSize.min).toBe(0.01);
    expect(heightSize.max).toBe(10);
    const lightAlt = c.find((x) => x.path === 'lightAlt');
    expect(lightAlt.min).toBe(0);
    expect(lightAlt.max).toBe(90);
    expect(lightAlt.step).toBe(0.1);
  });

  it('lensGrid slider ranges align with reference', () => {
    const c = MODULES.lensGrid.controls;
    const gridScale = c.find((x) => x.path === 'gridScale');
    expect(gridScale.min).toBe(0.5);
    expect(gridScale.max).toBe(2.5);
    const gridAngle = c.find((x) => x.path === 'gridAngle');
    expect(gridAngle.min).toBe(-180);
    expect(gridAngle.max).toBe(180);
  });

  it('warpGrid slider ranges align with reference', () => {
    const c = MODULES.warpGrid.controls;
    const gridCell = c.find((x) => x.path === 'gridCell');
    expect(gridCell.min).toBe(2);
    expect(gridCell.max).toBe(128);
    const gridScale = c.find((x) => x.path === 'gridScale');
    expect(gridScale.min).toBe(0.5);
    expect(gridScale.max).toBe(2);
    const gridAngle = c.find((x) => x.path === 'gridAngle');
    expect(gridAngle.min).toBe(-180);
    expect(gridAngle.max).toBe(180);
    const focus1D = c.find((x) => x.path === 'falloffFocus1D');
    expect(focus1D.min).toBe(-0.5);
    expect(focus1D.max).toBe(0.5);
  });
});
