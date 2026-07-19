import { describe, it, expect } from 'vitest';
import { findStaticSplit } from './pipelineSplit.js';

describe('findStaticSplit', () => {
  it('returns 0 when the first enabled pass is animated', () => {
    const stack = [
      { type: 'pass', module: 'fillNoise', enabled: true },
      { type: 'pass', module: 'blurGaussian', enabled: true },
    ];
    expect(findStaticSplit(stack)).toBe(0);
  });

  it('returns index of first animated pass after static fills', () => {
    const stack = [
      { type: 'pass', module: 'fillColor', enabled: true },
      { type: 'pass', module: 'blurGaussian', enabled: true },
      { type: 'pass', module: 'displaceSine', enabled: true },
      { type: 'pass', module: 'rgbShift', enabled: true },
    ];
    expect(findStaticSplit(stack)).toBe(2);
  });

  it('returns stack.length when nothing is animated', () => {
    const stack = [
      { type: 'pass', module: 'fillMedia', enabled: true },
      { type: 'pass', module: 'blurGaussian', enabled: true },
    ];
    expect(findStaticSplit(stack)).toBe(2);
  });

  it('disables cache (returns 0) when an enabled mask sits before the split', () => {
    const stack = [
      { type: 'pass', module: 'fillColor', enabled: true },
      { type: 'mask', module: 'maskMedia', enabled: true },
      { type: 'pass', module: 'blurGaussian', enabled: true },
      { type: 'pass', module: 'displaceSine', enabled: true },
    ];
    expect(findStaticSplit(stack)).toBe(0);
  });

  it('ignores disabled animated passes when locating the split', () => {
    const stack = [
      { type: 'pass', module: 'fillColor', enabled: true },
      { type: 'pass', module: 'fillNoise', enabled: false },
      { type: 'pass', module: 'blurGaussian', enabled: true },
    ];
    expect(findStaticSplit(stack)).toBe(3);
  });
});
