import { describe, it, expect } from 'vitest';
import { createDefaultState, bufferSize } from './state.js';
import {
  PREVIEW_MAX_EDGE,
  previewBufferSize,
  exportBufferSize,
  isPreviewResolutionCapped,
  estimateStackCost,
  perfHintText,
} from './perf.js';

describe('bufferSize preview/export modes', () => {
  it('export mode is full base × scale (even dims)', () => {
    const s = createDefaultState();
    expect(bufferSize(s.cnv, { mode: 'export' })).toEqual({ width: 1200, height: 1200 });
    expect(exportBufferSize(s.cnv)).toEqual({ width: 1200, height: 1200 });
  });

  it('default bufferSize without opts stays export-sized for backward compat', () => {
    const s = createDefaultState();
    expect(bufferSize(s.cnv)).toEqual({ width: 1200, height: 1200 });
  });

  it('preview mode caps the long edge', () => {
    const s = createDefaultState();
    s.cnv.scale.value = 8; // 3840² export
    const full = exportBufferSize(s.cnv);
    expect(full.width).toBe(3840);
    const prev = previewBufferSize(s.cnv);
    expect(Math.max(prev.width, prev.height)).toBeLessThanOrEqual(PREVIEW_MAX_EDGE);
    expect(isPreviewResolutionCapped(s.cnv)).toBe(true);
  });

  it('preview is not capped at default scale 2.5', () => {
    const s = createDefaultState();
    expect(isPreviewResolutionCapped(s.cnv)).toBe(false);
    expect(previewBufferSize(s.cnv)).toEqual(exportBufferSize(s.cnv));
  });
});

describe('estimateStackCost / perfHintText', () => {
  it('scores heavy modules higher', () => {
    const light = [{ module: 'fillColor', enabled: true, type: 'pass' }];
    const heavy = [
      { module: 'fillColor', enabled: true, type: 'pass' },
      { module: 'embossEffect', enabled: true, type: 'pass' },
      { module: 'blurGaussian', enabled: true, type: 'pass' },
      { module: 'lensGrid', enabled: true, type: 'pass' },
    ];
    expect(estimateStackCost(heavy)).toBeGreaterThan(estimateStackCost(light));
  });

  it('hints when export res is large', () => {
    const s = createDefaultState();
    s.cnv.scale.value = 8;
    const text = perfHintText(s);
    expect(text).toMatch(/Export|capped|⚡/);
  });
});
