// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { startMp4Export, cancelMp4Export } from './mp4Export.js';

function fakeState() {
  return {
    cnv: { ratio: '1:1', animation: true, scale: { value: 2.5 } },
    rec: { frameRate: 30, length: { value: 10 }, quality: 0.95, bitrate: 50, h264: 20 },
    runtime: { frame: 7 },
  };
}

function fakeApi({ animating = true } = {}) {
  const p = { redraw: vi.fn(), width: 480, height: 480 };
  const glc = { width: 480, height: 480, canvas: {} };
  let isAnimating = animating;
  const setAnimating = vi.fn((v) => { isAnimating = v; });
  const renderFrame = vi.fn();
  const setFrame = vi.fn((f) => { stateRef.runtime.frame = f; });
  const setExporting = vi.fn();
  const withFinalQuality = vi.fn(async (fn) => fn());
  const stateRef = fakeState();
  return {
    api: {
      getP: () => p,
      getBuffer: () => glc,
      renderFrame,
      setFrame,
      setExporting,
      withFinalQuality,
      scheduler: {
        isAnimating: () => isAnimating,
        setAnimating,
        requestRender: vi.fn(),
      },
    },
    p,
    glc,
    setAnimating,
    renderFrame,
    setFrame,
    setExporting,
    withFinalQuality,
    stateRef,
  };
}

describe('startMp4Export', () => {
  it('returns undefined when api is not ready', () => {
    const exportMP4 = vi.fn();
    expect(startMp4Export(null, fakeState(), { active: false }, vi.fn(), { exportMP4 })).toBeUndefined();
    expect(exportMP4).not.toHaveBeenCalled();
  });

  it('runs encode inside withFinalQuality for full-res export', async () => {
    const { api, withFinalQuality } = fakeApi();
    const exportMP4 = vi.fn(async () => 'ok');
    await startMp4Export(api, fakeState(), { active: false }, vi.fn(), { exportMP4 });
    expect(withFinalQuality).toHaveBeenCalledTimes(1);
    expect(exportMP4).toHaveBeenCalledTimes(1);
  });

  it('drawComposite uses renderFrame without screen blit', async () => {
    const { api, renderFrame, p } = fakeApi();
    const exportMP4 = vi.fn(async (opts) => {
      opts.drawComposite(3);
    });
    await startMp4Export(api, fakeState(), { active: false }, vi.fn(), { exportMP4 });
    expect(renderFrame).toHaveBeenCalledWith(3, { blitScreen: false });
    expect(p.redraw).not.toHaveBeenCalled();
  });

  it('scales quality 0..1 → 0..100 and wires size from buffer', async () => {
    const { api, glc } = fakeApi();
    const state = fakeState();
    const exportMP4 = vi.fn(async () => {});
    await startMp4Export(api, state, { active: false }, vi.fn(), { exportMP4 });
    const opts = exportMP4.mock.calls[0][0];
    expect(opts.rec.quality).toBe(95);
    expect(opts.getSize()).toEqual({ w: glc.width, h: glc.height });
    expect(opts.prefix).toBe('lumen');
  });
});

describe('cancelMp4Export', () => {
  it('sets cancel flag', () => {
    const rec = { active: true, cancel: false };
    cancelMp4Export(rec);
    expect(rec.cancel).toBe(true);
  });
});
