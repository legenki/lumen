// LUMEN — обвязка кнопки Export as MP4 поверх exportMedia.exportMP4.
import { exportMP4, cancelExportMP4 } from '../shared/utils/exportMedia.js';

/**
 * MP4 export at full resolution (withFinalQuality), frame-accurate via renderFrame.
 */
export function startMp4Export(api, state, recVideoState, setStatus, deps = { exportMP4 }) {
  if (!api) return undefined;

  const p = api.getP();
  const savedFrame = state.runtime?.frame ?? 0;

  if (!Number.isFinite(recVideoState.seconds) || recVideoState.seconds <= 0) {
    recVideoState.seconds = state.rec.length?.value ?? 10;
  }

  const rec = {
    ...state.rec,
    quality: Math.round((state.rec.quality ?? 0.95) * 100),
    h264: state.rec.h264,
    bitrate: state.rec.bitrate,
  };

  const media = api.getMedia?.();
  const fps = Math.max(1, state.rec.frameRate || 30);

  const encode = () => deps.exportMP4({
    p,
    prefix: 'lumen',
    cnv: state.cnv,
    rec,
    recVideo: recVideoState,
    setFrame: (frameNum) => {
      api.setFrame?.(frameNum);
      if (state.runtime) state.runtime.frame = frameNum;
    },
    beforeDraw: media?.seekAllVideosToFrame
      ? (frameNum) => media.seekAllVideosToFrame(frameNum, fps)
      : undefined,
    drawComposite: (frameNum) => {
      if (typeof api.renderFrame === 'function') {
        api.renderFrame(frameNum, { blitScreen: false });
      } else {
        p.redraw();
      }
    },
    getSize: () => {
      const g = api.getBuffer();
      return { w: g.width, h: g.height };
    },
    getCanvas: () => {
      const g = api.getBuffer();
      return g.canvas ?? g.elt;
    },
    setStatus,
    onDone: () => {
      // Frame + preview buffer + animation restored by withFinalQuality finally.
      if (state.runtime) state.runtime.frame = savedFrame;
      api.setFrame?.(savedFrame);
    },
  });

  if (typeof api.withFinalQuality === 'function') {
    return api.withFinalQuality(encode);
  }

  // Fallback without quality switch (tests / older api)
  const wasAnimating = api.scheduler.isAnimating();
  api.setExporting?.(true);
  api.scheduler.setAnimating(false);
  return Promise.resolve(encode()).finally(() => {
    api.setFrame?.(savedFrame);
    if (state.runtime) state.runtime.frame = savedFrame;
    api.setExporting?.(false);
    api.scheduler.setAnimating(wasAnimating);
    api.scheduler.requestRender();
  });
}

export function cancelMp4Export(recVideoState) {
  cancelExportMP4(recVideoState);
}
