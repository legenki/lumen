import { describe, it, expect } from 'vitest';
import { isControlVisible } from './inspector.js';

describe('isControlVisible (showIf predicate)', () => {
  it('control without showIf is always visible', () => {
    expect(isControlVisible({ path: 'mix' }, { mix: 1 })).toBe(true);
  });

  it('notEquals: visible when value differs', () => {
    const c = { path: 'abFocus', showIf: { path: 'abMode', notEquals: 0 } };
    expect(isControlVisible(c, { abMode: 1 })).toBe(true);
    expect(isControlVisible(c, { abMode: 0 })).toBe(false);
  });

  it('equals: visible only when value matches', () => {
    const c = { path: 'source', showIf: { path: 'mode', equals: 1 } };
    expect(isControlVisible(c, { mode: 1 })).toBe(true);
    expect(isControlVisible(c, { mode: 0 })).toBe(false);
  });

  it('equals 0 works (falsy value is a valid target)', () => {
    const c = { path: 'freqLow', showIf: { path: 'freqMode', equals: 0 } };
    expect(isControlVisible(c, { freqMode: 0 })).toBe(true);
    expect(isControlVisible(c, { freqMode: 1 })).toBe(false);
  });

  it('in: visible when value is in the array', () => {
    const c = { path: 'center', showIf: { path: 'sineMode', in: [1, 2] } };
    expect(isControlVisible(c, { sineMode: 1 })).toBe(true);
    expect(isControlVisible(c, { sineMode: 2 })).toBe(true);
    expect(isControlVisible(c, { sineMode: 0 })).toBe(false);
  });

  it('resolves nested paths', () => {
    const c = { path: 'x', showIf: { path: 'opts.mode', equals: 2 } };
    expect(isControlVisible(c, { opts: { mode: 2 } })).toBe(true);
    expect(isControlVisible(c, { opts: { mode: 3 } })).toBe(false);
  });
});
