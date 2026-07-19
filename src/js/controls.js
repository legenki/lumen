// LUMEN — декларативное описание панелей (спека §3: controls.js).
import { RATIO_TYPES } from './state.js';

export const LEFT_SECTIONS = [
  {
    title: 'Canvas',
    controls: [
      {
        type: 'select', id: 'lm-cnv-ratio', label: 'Canvas Ratio',
        path: 'cnv.ratio', options: RATIO_TYPES, regen: 'buffer',
      },
      {
        type: 'slider', id: 'lm-cnv-scale', label: 'Resolution Scale',
        path: 'cnv.scale.value', min: 2, max: 8, step: 0.25, regen: 'buffer', deferRegen: true,
      },
      {
        type: 'check', id: 'lm-cnv-animation', label: 'Animation',
        path: 'cnv.animation', regen: 'animation',
      },
    ],
  },
  {
    title: 'Timeline & Export',
    controls: [
      {
        type: 'slider', id: 'lm-rec-fps', label: 'Frame Rate (FPS)',
        path: 'rec.frameRate', min: 12, max: 60, step: 1, regen: 'timeline',
      },
      {
        type: 'slider', id: 'lm-rec-length', label: 'Animation Length (s)',
        path: 'rec.length.value', min: 1, max: 60, step: 1, regen: 'timeline',
      },
      {
        type: 'slider', id: 'lm-rec-quality', label: 'Export Quality',
        path: 'rec.quality', min: 0.1, max: 1, step: 0.05, regen: 'none',
      },
      {
        type: 'slider', id: 'lm-rec-bitrate', label: 'Bitrate (Mbps)',
        path: 'rec.bitrate', min: 5, max: 100, step: 1, regen: 'none',
      },
      {
        type: 'slider', id: 'lm-timeline-frame', label: 'Timeline Frame',
        path: 'runtime.frame', min: 0, max: 299, step: 1, regen: 'frame',
      },
    ],
  },
];

/** Max frame index for the timeline scrubber (totalFrames - 1). */
export function timelineFrameMax(rec) {
  const fps = Math.max(1, rec.frameRate || 30);
  const sec = Math.max(1, rec.length?.value ?? 10);
  return Math.max(0, Math.round(sec * fps) - 1);
}

/** Total frames in the animation cycle. */
export function timelineTotalFrames(rec) {
  return timelineFrameMax(rec) + 1;
}
