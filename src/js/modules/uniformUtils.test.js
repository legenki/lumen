import { describe, it, expect } from 'vitest';
import { hexToRgba, hexToRgb, radians, packGradient, GRADIENT_MAX, map, EASE, QUALITY_SCALE } from './uniformUtils.js';

describe('hexToRgba', () => {
  it('converts #RRGGBB + alpha into reused [r,g,b,a] 0..1', () => {
    const out = new Float32Array(4);
    const r = hexToRgba('#FF0000', 0.5, out);
    expect(r).toBe(out);
    expect(Array.from(r)).toEqual([1, 0, 0, 0.5]);
  });
  it('supports #RGB shorthand', () => {
    const r = hexToRgba('#0F0', 1, new Float32Array(4));
    expect(Array.from(r)).toEqual([0, 1, 0, 1]);
  });
});

describe('hexToRgb', () => {
  it('converts #RRGGBB into reused [r,g,b] 0..1', () => {
    const out = new Float32Array(3);
    const r = hexToRgb('#FF0000', out);
    expect(r).toBe(out);
    expect(Array.from(r)).toEqual([1, 0, 0]);
  });
  it('supports #RGB shorthand', () => {
    const out = new Float32Array(3);
    const r = hexToRgb('#0F0', out);
    expect(r).toBe(out);
    expect(Array.from(r)).toEqual([0, 1, 0]);
  });
  it('maintains identity (returns same buffer)', () => {
    const out = new Float32Array(3);
    const r = hexToRgb('#CCCCCC', out);
    expect(r).toBe(out);
  });
});

describe('radians', () => {
  it('converts degrees', () => {
    expect(radians(90)).toBeCloseTo(Math.PI / 2, 10);
    expect(radians(-180)).toBeCloseTo(-Math.PI, 10);
  });
});

describe('packGradient', () => {
  it('packs stops into 16-slot time/color arrays (colors /255, alpha as-is)', () => {
    expect(GRADIENT_MAX).toBe(16);
    const times = new Array(GRADIENT_MAX).fill(0);
    const colors = new Array(GRADIENT_MAX * 4).fill(0);
    const stops = [
      { time: 0, value: { r: 255, g: 255, b: 255, a: 1 } },
      { time: 1, value: { r: 0, g: 0, b: 0, a: 0.5 } },
    ];
    const count = packGradient(stops, times, colors);
    expect(count).toBe(2);
    expect(times.slice(0, 2)).toEqual([0, 1]);
    expect(colors.slice(0, 8)).toEqual([1, 1, 1, 1, 0, 0, 0, 0.5]);
    expect(times[2]).toBe(0); // хвост занулён
  });
});

describe('map (транскрипция ja, bundle 46940-46942)', () => {
  it('remaps linearly', () => {
    expect(map(50, 0, 100, 0, 1)).toBeCloseTo(0.5, 10);
    expect(map(0.3, 0, 1, 0, 0.25)).toBeCloseTo(0.075, 10);
  });
  it('returns out-min when input range is degenerate', () => {
    expect(map(5, 2, 2, 7, 9)).toBe(7);
  });
});

describe('EASE (нужные подмножества hI)', () => {
  it('quadIn = t^2, sineIn = 1-cos(t·π/2)', () => {
    expect(EASE.quadIn(0.5)).toBeCloseTo(0.25, 10);
    expect(EASE.sineIn(1)).toBeCloseTo(1, 10);
    expect(EASE.sineIn(0.5)).toBeCloseTo(1 - Math.cos(Math.PI / 4), 10);
    expect(EASE.linear(0.7)).toBe(0.7);
  });
});

describe('QUALITY_SCALE (yF, bundle 39253)', () => {
  it('is [1, 1.5, 3, 5]', () => {
    expect(QUALITY_SCALE).toEqual([1, 1.5, 3, 5]);
  });
});
