// LUMEN — обвязка кнопки Export as MP4 поверх exportMedia.exportMP4.
// Вынесено в отдельный модуль, чтобы main.js (с side-effect импортами) не
// мешал юнит-тестировать обвязку напрямую.
import { exportMP4, cancelExportMP4 } from '../shared/utils/exportMedia.js';

/**
 * Pure helper for the MP4-export button: wires api/state/recVideo into
 * exportMedia.exportMP4 with lumen's buffer as the render target.
 *
 * Critical: pauses the scheduler, locks export mode, and drives frames via
 * api.renderFrame(frameNum, { blitScreen: false }) so env.time tracks the
 * absolute export cursor (not a racing RAF loop).
 *
 * @param {object} api - onReady API: { getP, getBuffer, scheduler, renderFrame, setExporting, setFrame }
 * @param {object} state - app state: { cnv, rec, runtime }
 * @param {object} recVideoState - { active, seconds?, cancel? }
 * @param {Function} setStatus - (msg: string) => void, footer status line
 * @param {object} [deps] - injectable deps
 */
export function startMp4Export(api, state, recVideoState, setStatus, deps = { exportMP4 }) {
  if (!api) return undefined;

  const p = api.getP();
  const glc = api.getBuffer();
  const wasAnimating = api.scheduler.isAnimating();
  const savedFrame = state.runtime?.frame ?? 0;

  // Pause preview loop immediately — prevent RAF from racing the encoder.
  api.setExporting?.(true);
  api.scheduler.setAnimating(false);

  // SSOT: export duration = rec.length.value (seconds). recVideo.seconds may override.
  if (!Number.isFinite(recVideoState.seconds) || recVideoState.seconds <= 0) {
    recVideoState.seconds = state.rec.length?.value ?? 10;
  }

  // quality 0..1 (filtr) → 0..100 for HME QP mapping; keep bitrate/h264 as-is.
  const rec = {
    ...state.rec,
    quality: Math.round((state.rec.quality ?? 0.95) * 100),
    // h264 QP for HME: use rec.h264 if present, else derive later from quality
    h264: state.rec.h264,
    bitrate: state.rec.bitrate,
  };

  const media = api.getMedia?.();
  const fps = Math.max(1, state.rec.frameRate || 30);

  return deps.exportMP4({
    p,
    prefix: 'lumen',
    cnv: state.cnv,
    rec,
    recVideo: recVideoState,
    setFrame: (frameNum) => {
      api.setFrame?.(frameNum);
      if (state.runtime) state.runtime.frame = frameNum;
    },
    // Video slots: seek HTMLVideoElement before sampling texture (async).
    beforeDraw: media?.seekAllVideosToFrame
      ? (frameNum) => media.seekAllVideosToFrame(frameNum, fps)
      : undefined,
    drawComposite: (frameNum) => {
      if (typeof api.renderFrame === 'function') {
        api.renderFrame(frameNum, { blitScreen: false });
      } else {
        // Legacy fallback
        p.redraw();
      }
    },
    getSize: () => ({ w: glc.width, h: glc.height }),
    getCanvas: () => glc.canvas ?? glc.elt,
    setStatus,
    onDone: () => {
      // Restore timeline cursor & animation
      api.setFrame?.(savedFrame);
      if (state.runtime) state.runtime.frame = savedFrame;
      api.setExporting?.(false);
      api.scheduler.setAnimating(wasAnimating);
      api.scheduler.requestRender();
    },
  });
}

export function cancelMp4Export(recVideoState) {
  cancelExportMP4(recVideoState);
}
