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
  const stateRef = fakeState();
  return {
    api: {
      getP: () => p,
      getBuffer: () => glc,
      renderFrame,
      setFrame,
      setExporting,
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
    stateRef,
  };
}

describe('startMp4Export', () => {
  it('returns undefined and calls nothing when api is not ready', () => {
    const exportMP4 = vi.fn();
    const result = startMp4Export(null, fakeState(), { active: false }, vi.fn(), { exportMP4 });
    expect(result).toBeUndefined();
    expect(exportMP4).not.toHaveBeenCalled();
  });

  it('pauses scheduler and locks export mode before encoding', () => {
    const { api, setAnimating, setExporting } = fakeApi({ animating: true });
    const exportMP4 = vi.fn();
    startMp4Export(api, fakeState(), { active: false }, vi.fn(), { exportMP4 });
    expect(setExporting).toHaveBeenCalledWith(true);
    expect(setAnimating).toHaveBeenCalledWith(false);
  });

  it('calls exportMP4 with buffer size, setFrame, and quality scaled 0..100', () => {
    const { api, glc } = fakeApi();
    const state = fakeState();
    const recVideo = { active: false };
    const setStatus = vi.fn();
    const exportMP4 = vi.fn();

    startMp4Export(api, state, recVideo, setStatus, { exportMP4 });

    expect(exportMP4).toHaveBeenCalledTimes(1);
    const opts = exportMP4.mock.calls[0][0];
    expect(opts.prefix).toBe('lumen');
    expect(opts.cnv).toBe(state.cnv);
    expect(opts.rec.frameRate).toBe(30);
    expect(opts.rec.quality).toBe(95);
    expect(opts.rec.bitrate).toBe(50);
    expect(opts.recVideo).toBe(recVideo);
    expect(opts.recVideo.seconds).toBe(10); // SSOT from rec.length
    expect(opts.setStatus).toBe(setStatus);
    expect(opts.getSize()).toEqual({ w: glc.width, h: glc.height });
    expect(opts.getCanvas()).toBe(glc.canvas);
    expect(typeof opts.setFrame).toBe('function');
    expect(typeof opts.drawComposite).toBe('function');
  });

  it('drawComposite routes through renderFrame without screen blit', () => {
    const { api, renderFrame, p } = fakeApi();
    const exportMP4 = vi.fn();
    startMp4Export(api, fakeState(), { active: false }, vi.fn(), { exportMP4 });
    const opts = exportMP4.mock.calls[0][0];
    opts.drawComposite(42);
    expect(renderFrame).toHaveBeenCalledWith(42, { blitScreen: false });
    expect(p.redraw).not.toHaveBeenCalled();
  });

  it('setFrame writes absolute cursor into state.runtime.frame', () => {
    const { api } = fakeApi();
    const state = fakeState();
    const exportMP4 = vi.fn();
    startMp4Export(api, state, { active: false }, vi.fn(), { exportMP4 });
    const opts = exportMP4.mock.calls[0][0];
    opts.setFrame(15);
    expect(api.setFrame).toHaveBeenCalledWith(15);
    expect(state.runtime.frame).toBe(15);
  });

  it('onDone restores frame, export lock, and animation state', () => {
    const { api, setAnimating, setExporting } = fakeApi({ animating: true });
    const state = fakeState();
    state.runtime.frame = 3;
    const exportMP4 = vi.fn();
    startMp4Export(api, state, { active: false }, vi.fn(), { exportMP4 });
    // Simulate encoder advancing frame
    state.runtime.frame = 99;
    const opts = exportMP4.mock.calls[0][0];
    opts.onDone();

    expect(api.setFrame).toHaveBeenCalledWith(3);
    expect(state.runtime.frame).toBe(3);
    expect(setExporting).toHaveBeenCalledWith(false);
    expect(setAnimating).toHaveBeenCalledWith(true);
    expect(api.scheduler.requestRender).toHaveBeenCalled();
  });

  it('onDone restores animating=false when it was off before export', () => {
    const { api, setAnimating } = fakeApi({ animating: false });
    const exportMP4 = vi.fn();
    startMp4Export(api, fakeState(), { active: false }, vi.fn(), { exportMP4 });
    exportMP4.mock.calls[0][0].onDone();
    // last setAnimating call should restore false
    expect(setAnimating).toHaveBeenLastCalledWith(false);
  });
});

describe('cancelMp4Export', () => {
  it('sets cancel flag on active recVideo', () => {
    const rec = { active: true, cancel: false };
    cancelMp4Export(rec);
    expect(rec.cancel).toBe(true);
  });
});
