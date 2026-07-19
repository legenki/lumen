// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportMP4, cancelExportMP4 } from './exportMedia.js';

vi.mock('./lazyLibs.js', () => ({
  ensureHME: vi.fn(async () => ({
    createH264MP4Encoder: async () => {
      const frames = [];
      return {
        outputFilename: '',
        width: 0,
        height: 0,
        frameRate: 0,
        quantizationParameter: 0,
        groupOfPictures: 0,
        initialize() {},
        addFrameRgba(data) { frames.push(data); },
        finalize() {},
        FS: { readFile: () => new Uint8Array([1, 2, 3, 4]) },
        delete() {},
        _frames: frames,
      };
    },
  })),
}));

function fake2dContext() {
  return {
    fillStyle: '',
    clearRect() {},
    fillRect() {},
    drawImage() {},
    getImageData: (_x, _y, width, height) => ({
      data: new Uint8ClampedArray(width * height * 4),
      width,
      height,
    }),
  };
}

function makeCanvas(w = 4, h = 4) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

describe('exportMP4 frame cursor', () => {
  let anchorClick;
  let getContextSpy;

  beforeEach(() => {
    anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function getContext(type) {
      if (type === '2d' || (typeof type === 'string' && type.startsWith('2d'))) {
        return fake2dContext();
      }
      // no webgl in tests → capture uses 2d path only
      return null;
    });
    vi.stubGlobal('VideoEncoder', undefined);
    vi.stubGlobal('VideoFrame', undefined);
  });

  afterEach(() => {
    anchorClick.mockRestore();
    getContextSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it('calls setFrame with absolute indices 0..N-1 and drawComposite for each', async () => {
    const canvas = makeCanvas();
    const frames = [];
    const drawn = [];
    const recVideo = { active: false };
    const rec = { frameRate: 2, length: { value: 2 }, quality: 80 };

    await exportMP4({
      prefix: 'test',
      rec,
      recVideo,
      setFrame: (f) => frames.push(f),
      drawComposite: (f) => drawn.push(f),
      getSize: () => ({ w: 4, h: 4 }),
      getCanvas: () => canvas,
      setStatus: vi.fn(),
      preferWebCodecs: false,
    });

    // 2s * 2fps = 4 frames, cycle length = 4
    expect(frames).toEqual([0, 1, 2, 3]);
    expect(drawn).toEqual([0, 1, 2, 3]);
    expect(recVideo.active).toBe(false);
  });

  it('wraps frame index by animation cycle when export longer than length', async () => {
    const canvas = makeCanvas();
    const frames = [];
    const recVideo = { active: false, seconds: 2 };
    // cycle = 1s * 2fps = 2 frames; export = 2s * 2fps = 4 frames
    const rec = { frameRate: 2, length: { value: 1 }, quality: 80 };

    await exportMP4({
      prefix: 'test',
      rec,
      recVideo,
      setFrame: (f) => frames.push(f),
      drawComposite: () => {},
      getSize: () => ({ w: 4, h: 4 }),
      getCanvas: () => canvas,
      setStatus: vi.fn(),
      preferWebCodecs: false,
    });

    expect(frames).toEqual([0, 1, 0, 1]);
  });

  it('honours cancel between frames', async () => {
    const canvas = makeCanvas();
    const recVideo = { active: false };
    const rec = { frameRate: 10, length: { value: 1 }, quality: 80 };
    let n = 0;

    await exportMP4({
      prefix: 'test',
      rec,
      recVideo,
      setFrame: () => {},
      drawComposite: () => {
        n += 1;
        if (n === 2) cancelExportMP4(recVideo);
      },
      getSize: () => ({ w: 4, h: 4 }),
      getCanvas: () => canvas,
      setStatus: vi.fn(),
      preferWebCodecs: false,
    });

    expect(n).toBeLessThan(10);
    expect(recVideo.active).toBe(false);
  });

  it('awaits beforeDraw before drawComposite (video seek contract)', async () => {
    const canvas = makeCanvas();
    const order = [];
    const recVideo = { active: false, seconds: 1 };
    const rec = { frameRate: 1, length: { value: 1 }, quality: 80 };

    await exportMP4({
      prefix: 'test',
      rec,
      recVideo,
      setFrame: () => order.push('setFrame'),
      beforeDraw: async () => { order.push('beforeDraw'); },
      drawComposite: () => order.push('draw'),
      getSize: () => ({ w: 4, h: 4 }),
      getCanvas: () => canvas,
      setStatus: vi.fn(),
      preferWebCodecs: false,
    });

    expect(order).toEqual(['setFrame', 'beforeDraw', 'draw']);
  });
});
