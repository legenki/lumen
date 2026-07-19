import { ensureHME } from './lazyLibs.js';
import { timestamp } from './datetime.js';

const yieldToMain = () => new Promise((r) => setTimeout(r, 0));

function evenSize(w, h) {
  return {
    w: w % 2 === 0 ? w : w - 1,
    h: h % 2 === 0 ? h : h - 1,
  };
}

function durationSeconds(rec, recVideo) {
  if (Number.isFinite(recVideo?.seconds) && recVideo.seconds > 0) return recVideo.seconds;
  const len = rec?.length;
  if (typeof len === 'object' && len && Number.isFinite(len.value)) return len.value;
  if (Number.isFinite(len)) return len;
  return 4;
}

function cycleLengthFrames(rec, fps) {
  const len = rec?.length;
  const seconds = typeof len === 'object' && len ? len.value : (len || 0);
  return Math.max(1, Math.round((seconds || durationSeconds(rec, { seconds: 4 })) * fps));
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function mapQualityToBitrate(rec, w, h, fps) {
  // bitrate in Mbps (filtr default 50) or derive from quality 0..100
  if (Number.isFinite(rec.bitrate) && rec.bitrate > 0) {
    return Math.round(rec.bitrate * 1e6);
  }
  const q = (rec.quality ?? 80) / 100;
  // ~0.1–0.25 bit per pixel per frame scaled by quality
  const bpp = 0.08 + q * 0.17;
  return Math.max(1_000_000, Math.round(w * h * fps * bpp));
}

/**
 * Capture RGBA pixels from a canvas (WebGL or 2D) into a reusable ImageData buffer.
 * Prefer drawImage → getImageData (works for WebGL without preserveDrawingBuffer quirks
 * when the canvas was just drawn). Reuses `scratch` { canvas, ctx, imageData }.
 */
function captureRgba(targetCanvas, w, h, scratch) {
  if (!scratch.canvas) {
    scratch.canvas = document.createElement('canvas');
    scratch.ctx = scratch.canvas.getContext('2d', { willReadFrequently: true });
  }
  if (scratch.canvas.width !== w || scratch.canvas.height !== h) {
    scratch.canvas.width = w;
    scratch.canvas.height = h;
    scratch.imageData = null;
  }
  const gl = targetCanvas.getContext?.('webgl2') || targetCanvas.getContext?.('webgl');
  if (gl) gl.finish();
  scratch.ctx.clearRect(0, 0, w, h);
  scratch.ctx.drawImage(targetCanvas, 0, 0, w, h);
  scratch.imageData = scratch.ctx.getImageData(0, 0, w, h);
  return scratch.imageData.data;
}

function webCodecsSupported() {
  return typeof VideoEncoder === 'function' && typeof VideoFrame === 'function';
}

/**
 * WebCodecs H.264 + mp4-muxer path. Returns Blob or throws.
 */
async function encodeWithWebCodecs({
  totalFrames,
  fps,
  w,
  h,
  rec,
  setFrame,
  beforeDraw,
  drawComposite,
  getCanvas,
  setStatus,
  shouldCancel,
}) {
  const { Muxer, ArrayBufferTarget } = await import('mp4-muxer');
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: {
      codec: 'avc',
      width: w,
      height: h,
    },
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  });

  const bitrate = mapQualityToBitrate(rec, w, h, fps);
  // Prefer High profile when possible; fall back via isConfigSupported.
  const codecCandidates = ['avc1.640028', 'avc1.4d0028', 'avc1.42001f'];
  let configured = null;
  let encoder;

  const errorRef = { err: null };
  for (const codec of codecCandidates) {
    const config = {
      codec,
      width: w,
      height: h,
      bitrate,
      framerate: fps,
      latencyMode: 'quality',
      avc: { format: 'avc' },
    };
    try {
      const support = await VideoEncoder.isConfigSupported(config);
      if (!support.supported) continue;
    } catch {
      continue;
    }
    encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => { errorRef.err = e; },
    });
    encoder.configure(config);
    configured = config;
    break;
  }
  if (!encoder || !configured) {
    throw new Error('WebCodecs H.264 not supported');
  }

  const targetCanvas = () => (getCanvas ? getCanvas() : null);
  const cycle = cycleLengthFrames(rec, fps);

  try {
    for (let f = 0; f < totalFrames; f++) {
      if (shouldCancel()) throw new Error('export-cancelled');
      const frameNum = f % cycle;
      setFrame?.(frameNum);
      if (beforeDraw) await beforeDraw(frameNum);
      drawComposite(frameNum);

      const canvas = targetCanvas();
      if (!canvas) throw new Error('No export canvas');
      const gl = canvas.getContext?.('webgl2') || canvas.getContext?.('webgl');
      if (gl) gl.finish();

      const timestamp = Math.round((f * 1e6) / fps);
      const frame = new VideoFrame(canvas, {
        timestamp,
        duration: Math.round(1e6 / fps),
      });
      const keyFrame = f % Math.max(1, Math.round(fps)) === 0;
      encoder.encode(frame, { keyFrame });
      frame.close();

      // Backpressure: don't flood the encoder queue.
      while (encoder.encodeQueueSize > 4) {
        await yieldToMain();
        if (errorRef.err) throw errorRef.err;
      }

      if (f % 5 === 0 || f === totalFrames - 1) {
        setStatus(`Encoding ${f + 1}/${totalFrames}`);
      }
      await yieldToMain();
    }

    await encoder.flush();
    if (errorRef.err) throw errorRef.err;
    muxer.finalize();
    return new Blob([target.buffer], { type: 'video/mp4' });
  } finally {
    try { encoder.close(); } catch { /* already closed */ }
  }
}

/**
 * H.264 WASM encoder (h264-mp4-encoder) fallback.
 */
async function encodeWithHME({
  p,
  prefix,
  totalFrames,
  fps,
  w,
  h,
  rec,
  setFrame,
  beforeDraw,
  drawComposite,
  getCanvas,
  setStatus,
  shouldCancel,
}) {
  const HME = await ensureHME();
  const encoder = await HME.createH264MP4Encoder();
  const filename = `${prefix}-${timestamp()}.mp4`;
  encoder.outputFilename = filename;
  encoder.width = w;
  encoder.height = h;
  encoder.frameRate = fps;
  // quality 0..100 → QP 51..10; prefer rec.h264 (filtr QP) when set
  if (Number.isFinite(rec.h264)) {
    encoder.quantizationParameter = Math.max(10, Math.min(51, Math.round(rec.h264)));
  } else {
    const q = rec.quality ?? 80;
    const mapped = typeof p?.map === 'function'
      ? p.map(q, 0, 100, 51, 10)
      : 51 - (q / 100) * 41;
    encoder.quantizationParameter = Math.round(mapped);
  }
  encoder.groupOfPictures = Math.max(1, Math.round(fps / 3));
  encoder.initialize();

  const scratch = {};
  const cycle = cycleLengthFrames(rec, fps);

  try {
    for (let f = 0; f < totalFrames; f++) {
      if (shouldCancel()) throw new Error('export-cancelled');
      const frameNum = f % cycle;
      setFrame?.(frameNum);
      if (beforeDraw) await beforeDraw(frameNum);
      drawComposite(frameNum);

      const targetCanvas = getCanvas ? getCanvas() : p?.canvas;
      const rgba = captureRgba(targetCanvas, w, h, scratch);
      encoder.addFrameRgba(rgba);

      if (f % 5 === 0 || f === totalFrames - 1) {
        setStatus(`Encoding ${f + 1}/${totalFrames}`);
      }
      await yieldToMain();
    }

    setStatus('Finalizing…');
    encoder.finalize();
    const uint8 = encoder.FS.readFile(filename);
    return new Blob([uint8], { type: 'video/mp4' });
  } finally {
    try { encoder.delete(); } catch { /* encoder may already be gone */ }
  }
}

/**
 * Encodes and downloads an MP4 from a sequence of frames.
 *
 * Frame cursor: prefers opts.setFrame(frameNum) (lumen runtime.frame).
 * Falls back to mutating cnv.frame / rec.frame for legacy callers.
 *
 * @param {object} opts
 * @param {object}   [opts.p]           p5 instance (optional if getCanvas+drawComposite provided)
 * @param {string}   opts.prefix        filename prefix
 * @param {object}   [opts.cnv]         shared cnv state (legacy frame cursor)
 * @param {object}   opts.rec           { frameRate, length, quality, bitrate?, h264? }
 * @param {object}   opts.recVideo      { active: bool, seconds?: number, cancel?: bool }
 * @param {Function} opts.drawComposite (frameNum) => void — renders one frame to export canvas
 * @param {Function} opts.setStatus     (msg: string) => void
 * @param {Function} [opts.getSize]     () => { w, h }
 * @param {Function} [opts.getCanvas]   () => HTMLCanvasElement
 * @param {Function} [opts.setFrame]    (frameNum) => void — absolute timeline cursor
 * @param {Function} [opts.beforeDraw]  async (frameNum) => void — e.g. video seek
 * @param {Function} [opts.onDone]      () => void
 * @param {boolean}  [opts.preferWebCodecs=true]
 */
export async function exportMP4({
  p,
  prefix,
  cnv,
  rec,
  recVideo,
  drawComposite,
  setStatus,
  getSize,
  getCanvas,
  setFrame,
  beforeDraw,
  onDone,
  preferWebCodecs = true,
}) {
  if (recVideo.active) return;
  recVideo.active = true;
  recVideo.cancel = false;
  recVideo.error = null;

  const fps = Math.max(1, rec.frameRate || 30);
  const seconds = durationSeconds(rec, recVideo);
  const totalFrames = Math.max(1, Math.round(seconds * fps));

  setStatus('Preparing video…');

  let { w, h } = getSize
    ? getSize()
    : { w: Math.floor(p.width * (cnv?.density?.base ?? 1)), h: Math.floor(p.height * (cnv?.density?.base ?? 1)) };
  ({ w, h } = evenSize(w, h));

  const savedCnvFrame = cnv?.frame;
  const savedRecFrame = rec?.frame;
  const savedAnimation = cnv?.animation;
  if (cnv) cnv.animation = false;

  const applyFrame = (frameNum) => {
    if (setFrame) setFrame(frameNum);
    else {
      if (cnv) cnv.frame = frameNum;
      if (rec) rec.frame = frameNum;
    }
  };

  const shouldCancel = () => !!recVideo.cancel;

  const filename = `${prefix}-${timestamp()}.mp4`;
  let statusFinal = 'Video exported ✓';

  try {
    let blob;
    const common = {
      totalFrames,
      fps,
      w,
      h,
      rec,
      setFrame: applyFrame,
      beforeDraw,
      drawComposite,
      getCanvas,
      setStatus,
      shouldCancel,
    };

    if (preferWebCodecs && webCodecsSupported()) {
      try {
        setStatus('Encoding (WebCodecs)…');
        blob = await encodeWithWebCodecs(common);
      } catch (e) {
        if (e?.message === 'export-cancelled') throw e;
        console.warn('[exportMP4] WebCodecs failed, falling back to HME:', e);
        setStatus('Encoding (H.264 fallback)…');
        blob = await encodeWithHME({ ...common, p, prefix });
      }
    } else {
      setStatus('Encoding…');
      blob = await encodeWithHME({ ...common, p, prefix });
    }

    if (shouldCancel()) throw new Error('export-cancelled');
    downloadBlob(blob, filename);
    setStatus(statusFinal);
  } catch (e) {
    if (e?.message === 'export-cancelled') {
      statusFinal = 'Export cancelled';
      setStatus(statusFinal);
    } else {
      console.error(`[${prefix}] MP4 export failed:`, e);
      recVideo.error = e;
      statusFinal = 'Video export failed';
      setStatus(statusFinal);
    }
  } finally {
    if (cnv && savedCnvFrame !== undefined) cnv.frame = savedCnvFrame;
    if (rec && savedRecFrame !== undefined) rec.frame = savedRecFrame;
    if (cnv && savedAnimation !== undefined) cnv.animation = savedAnimation;
    recVideo.active = false;
    recVideo.cancel = false;
    onDone?.();
    // Leave final status visible briefly, then clear only if unchanged.
    const finalMsg = statusFinal;
    setTimeout(() => {
      try { setStatus('', { clearIf: finalMsg }); } catch { setStatus(''); }
    }, 3000);
  }
}

/** Request cancellation of an in-flight exportMP4 (cooperative). */
export function cancelExportMP4(recVideo) {
  if (recVideo?.active) recVideo.cancel = true;
}
