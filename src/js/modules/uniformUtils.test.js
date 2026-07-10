import { describe, it, expect } from 'vitest';
import { hexToRgba, radians, packGradient, GRADIENT_MAX } from './uniformUtils.js';

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
