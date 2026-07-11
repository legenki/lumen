import { describe, it, expect } from 'vitest';
import {
  GRADIENT_MIN_STOPS, GRADIENT_MAX_STOPS,
  sortStops, addStop, removeStop, moveStop, stopsToCss,
} from '../gradientModel.js';

const bw = () => ([
  { time: 0, value: { r: 255, g: 255, b: 255, a: 1 } },
  { time: 1, value: { r: 0, g: 0, b: 0, a: 1 } },
]);

describe('gradient model', () => {
  it('constants', () => {
    expect(GRADIENT_MIN_STOPS).toBe(2);
    expect(GRADIENT_MAX_STOPS).toBe(16);
  });

  it('addStop inserts interpolated stop at time, keeps sort order', () => {
    const g = bw();
    const idx = addStop(g, 0.5);
    expect(g).toHaveLength(3);
    expect(g[idx].time).toBe(0.5);
    expect(g[idx].value.r).toBeCloseTo(127.5, 1); // интерполяция соседей
    expect(g[idx].value.a).toBe(1);
    expect(g.map((s) => s.time)).toEqual([0, 0.5, 1]);
  });

  it('addStop refuses beyond max', () => {
    const g = bw();
    for (let i = 0; i < 20; i++) addStop(g, (i + 1) / 22);
    expect(g.length).toBe(GRADIENT_MAX_STOPS);
  });

  it('removeStop refuses below min', () => {
    const g = bw();
    expect(removeStop(g, 0)).toBe(false);
    expect(g).toHaveLength(2);
    addStop(g, 0.5);
    expect(removeStop(g, 1)).toBe(true);
    expect(g).toHaveLength(2);
  });

  it('moveStop clamps time to 0..1 and resorts, returning new index', () => {
    const g = bw();
    const i = addStop(g, 0.5);
    const newIdx = moveStop(g, i, 1.7);
    expect(g[newIdx].time).toBe(1);
    expect(g.map((s) => s.time)).toEqual([0, 1, 1]);
  });

  it('stopsToCss renders a css linear-gradient stop list', () => {
    expect(stopsToCss(bw())).toBe(
      'rgba(255,255,255,1) 0%, rgba(0,0,0,1) 100%',
    );
  });

  it('sortStops is stable for equal times', () => {
    const g = [
      { time: 0.5, value: { r: 1, g: 0, b: 0, a: 1 } },
      { time: 0.5, value: { r: 2, g: 0, b: 0, a: 1 } },
    ];
    sortStops(g);
    expect(g[0].value.r).toBe(1);
  });
});
