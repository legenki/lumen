import { describe, it, expect } from 'vitest';
import { deepMerge } from './deepMerge.js';

describe('deepMerge', () => {
  it('recursively merges nested plain objects', () => {
    const target = { cnv: { ratio: '1:1', scale: { value: 2.5, max: 8 } } };
    deepMerge(target, { cnv: { scale: { value: 4 } } });
    expect(target.cnv.scale).toEqual({ value: 4, max: 8 });
    expect(target.cnv.ratio).toBe('1:1');
  });
  it('replaces arrays wholesale (no element merge)', () => {
    const target = { stack: [{ id: 'a' }, { id: 'b' }] };
    deepMerge(target, { stack: [{ id: 'c' }] });
    expect(target.stack).toEqual([{ id: 'c' }]);
  });
  it('ignores keys missing from source and keeps extra target keys', () => {
    const target = { a: 1, b: 2 };
    deepMerge(target, { b: 3 });
    expect(target).toEqual({ a: 1, b: 3 });
  });
});
