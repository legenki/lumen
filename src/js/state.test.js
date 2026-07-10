import { describe, it, expect, beforeEach } from 'vitest';
import {
  createDefaultState, serializeState, restoreState,
  RATIO_TYPES, RATIO_BASE_SIZE, SCHEMA_VERSION, bufferSize,
} from './state.js';

describe('state defaults', () => {
  it('matches the old tool defaults (architecture.md §2)', () => {
    const s = createDefaultState();
    expect(s.cnv.ratio).toBe('1:1');
    expect(s.cnv.animation).toBe(true);
    expect(s.cnv.scale).toEqual({ value: 2.5, min: 2, max: 8, step: 0.25 });
    expect(s.rec.frameRate).toBe(60);
    expect(s.rec.length.value).toBe(10);
    expect(s.stack).toEqual([]);
    expect(s.ui.selectedId).toBeNull();
  });
  it('has 11 ratios with base sizes', () => {
    expect(Object.keys(RATIO_TYPES)).toHaveLength(11);
    expect(RATIO_BASE_SIZE['1:1']).toEqual({ width: 480, height: 480 });
    expect(RATIO_BASE_SIZE['16:9']).toEqual({ width: 640, height: 360 });
  });
});

describe('bufferSize', () => {
  it('is base size × scale, rounded', () => {
    const s = createDefaultState();
    expect(bufferSize(s.cnv)).toEqual({ width: 1200, height: 1200 }); // 480 × 2.5
    s.cnv.ratio = '16:9';
    s.cnv.scale.value = 3;
    expect(bufferSize(s.cnv)).toEqual({ width: 1920, height: 1080 });
  });
});

describe('serialize/restore round-trip', () => {
  let s;
  beforeEach(() => { s = createDefaultState(); });

  it('round-trips persisted fields', () => {
    s.cnv.ratio = '4:5';
    s.stack.push({ id: 'p01', type: 'pass', module: 'fillColor', enabled: true, params: {} });
    const snap = serializeState(s);
    expect(snap.v).toBe(SCHEMA_VERSION);
    const t = createDefaultState();
    restoreState(t, snap);
    expect(t.cnv.ratio).toBe('4:5');
    expect(t.stack).toHaveLength(1);
    expect(t.stack[0].module).toBe('fillColor');
  });
  it('does not serialize runtime/ui', () => {
    const snap = serializeState(s);
    expect(snap.runtime).toBeUndefined();
    expect(snap.ui).toBeUndefined();
  });
  it('ignores unknown fields and survives missing sections', () => {
    const t = createDefaultState();
    restoreState(t, { v: SCHEMA_VERSION, cnv: { ratio: '3:4', bogus: 1 }, junk: true });
    expect(t.cnv.ratio).toBe('3:4');
    expect(t.cnv.scale.value).toBe(2.5); // не тронут
    expect(t.cnv.bogus).toBeUndefined();
    expect('junk' in t).toBe(false);
  });
  it('rejects wrong schema version (returns false, state untouched)', () => {
    const t = createDefaultState();
    expect(restoreState(t, { v: 999, cnv: { ratio: '9:16' } })).toBe(false);
    expect(t.cnv.ratio).toBe('1:1');
  });
});
