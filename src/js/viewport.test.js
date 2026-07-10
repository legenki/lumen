import { describe, it, expect } from 'vitest';
import { computeViewport, PANEL_LEFT, PANEL_RIGHT, FIT } from './viewport.js';

describe('computeViewport', () => {
  // Рабочая область: окно минус панели (290px с каждой стороны: 260 панель
  // + 20 margin + 10 зазор). Буфер вписывается в 85% рабочей области
  // с сохранением пропорций и центрируется в ней (спека §3).
  it('centers a square buffer in the workspace between panels', () => {
    const v = computeViewport({ winW: 1920, winH: 1080, bufW: 1200, bufH: 1200 });
    // avail: w=1920-580=1340, h=1080; scale=min(1340/1200,1080/1200)*0.85=0.765
    expect(v.w).toBeCloseTo(918, 0);
    expect(v.h).toBeCloseTo(918, 0);
    expect(v.x).toBeCloseTo(290 + (1340 - 918) / 2, 0); // 501
    expect(v.y).toBeCloseTo((1080 - 918) / 2, 0); // 81
  });
  it('fits a wide buffer by width', () => {
    const v = computeViewport({ winW: 1920, winH: 1080, bufW: 1920, bufH: 1080 });
    // scale = min(1340/1920, 1080/1080) * 0.85 ≈ 0.59323; w = 1340*0.85 = 1139
    expect(v.w).toBeCloseTo(1139, 0);
    expect(v.h).toBeCloseTo(640.7, 0);
  });
  it('keeps aspect ratio', () => {
    const v = computeViewport({ winW: 1400, winH: 900, bufW: 640, bufH: 360 });
    expect(v.w / v.h).toBeCloseTo(640 / 360, 5);
  });
  it('exports the layout constants used by CSS', () => {
    // 290 = 260px панель + 20px margin + 10px зазор (AGENTS.md §3, как в divix)
    expect(PANEL_LEFT).toBe(290);
    expect(PANEL_RIGHT).toBe(290);
    expect(FIT).toBe(0.85);
  });
});
