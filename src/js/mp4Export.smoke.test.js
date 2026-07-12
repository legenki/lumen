// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { startMp4Export } from './mp4Export.js';

function fakeState() {
  return {
    cnv: { ratio: '1:1', animation: true, scale: { value: 2.5 } },
    rec: { frameRate: 60, length: { value: 10 }, quality: 0.95 },
  };
}

function fakeApi({ animating = true } = {}) {
  const p = { redraw: vi.fn(), width: 480, height: 480 };
  const glc = { width: 480, height: 480, canvas: {} };
  let isAnimating = animating;
  const setAnimating = vi.fn((v) => { isAnimating = v; });
  return {
    api: {
      getP: () => p,
      getBuffer: () => glc,
      scheduler: {
        isAnimating: () => isAnimating,
        setAnimating,
        requestRender: vi.fn(),
      },
    },
    p,
    glc,
    setAnimating,
  };
}

describe('startMp4Export', () => {
  it('returns undefined and calls nothing when api is not ready', () => {
    const exportMP4 = vi.fn();
    const result = startMp4Export(null, fakeState(), { active: false, seconds: 4 }, vi.fn(), { exportMP4 });
    expect(result).toBeUndefined();
    expect(exportMP4).not.toHaveBeenCalled();
  });

  it('calls exportMP4 with the buffer size, prefix, state.cnv/rec, and recVideo', () => {
    const { api, glc } = fakeApi();
    const state = fakeState();
    const recVideo = { active: false, seconds: 6 };
    const setStatus = vi.fn();
    const exportMP4 = vi.fn();

    startMp4Export(api, state, recVideo, setStatus, { exportMP4 });

    expect(exportMP4).toHaveBeenCalledTimes(1);
    const opts = exportMP4.mock.calls[0][0];
    expect(opts.prefix).toBe('lumen');
    expect(opts.cnv).toBe(state.cnv);
    expect(opts.rec).toBe(state.rec);
    expect(opts.recVideo).toBe(recVideo);
    expect(opts.setStatus).toBe(setStatus);
    expect(opts.getSize()).toEqual({ w: glc.width, h: glc.height });
    expect(opts.getCanvas()).toBe(glc.canvas);
  });

  it('drawComposite() calls p.redraw()', () => {
    const { api, p } = fakeApi();
    const exportMP4 = vi.fn();
    startMp4Export(api, fakeState(), { active: false, seconds: 4 }, vi.fn(), { exportMP4 });
    const opts = exportMP4.mock.calls[0][0];
    opts.drawComposite();
    expect(p.redraw).toHaveBeenCalledTimes(1);
  });

  it('onDone() restores the pre-export animation state and requests a render', () => {
    const { api, setAnimating } = fakeApi({ animating: false });
    const exportMP4 = vi.fn();
    startMp4Export(api, fakeState(), { active: false, seconds: 4 }, vi.fn(), { exportMP4 });
    const opts = exportMP4.mock.calls[0][0];

    // Simulate exportMP4 having flipped animation off during encoding, then done.
    opts.onDone();

    expect(setAnimating).toHaveBeenCalledWith(false); // restores wasAnimating captured at call time
    expect(api.scheduler.requestRender).toHaveBeenCalledTimes(1);
  });

  it('onDone() restores animating=true when it was on before export', () => {
    const { api, setAnimating } = fakeApi({ animating: true });
    const exportMP4 = vi.fn();
    startMp4Export(api, fakeState(), { active: false, seconds: 4 }, vi.fn(), { exportMP4 });
    const opts = exportMP4.mock.calls[0][0];
    opts.onDone();
    expect(setAnimating).toHaveBeenCalledWith(true);
  });
});
