// LUMEN — helpers for preview LOD, draft quality, and soft performance hints.
import { MODULES } from './modules/index.js';
import { bufferSize } from './state.js';

/** Longest edge (px) for live preview buffers. Export/PNG use full scale. */
export const PREVIEW_MAX_EDGE = 1280;

/** Cap blur kernel radius (px after scale) in draft/preview mode. */
export const DRAFT_BLUR_RADIUS_CAP = 48;

/** Soft warning when full export buffer exceeds this many megapixels. */
export const HEAVY_MEGAPIXELS = 2.5;

const HEAVY_MODULES = new Set([
  'blurGaussian', 'blurMotion', 'blurNoise',
  'embossEffect', 'lensGrid', 'warpGrid', 'rgbShift', 'displaceSimplex',
]);

/**
 * Full-resolution buffer size (export / final PNG).
 * @param {object} cnv
 */
export function exportBufferSize(cnv) {
  return bufferSize(cnv, { mode: 'export' });
}

/**
 * Preview buffer size — capped on the long edge for realtime.
 * @param {object} cnv
 */
export function previewBufferSize(cnv) {
  return bufferSize(cnv, { mode: 'preview', maxEdge: PREVIEW_MAX_EDGE });
}

export function isPreviewResolutionCapped(cnv) {
  const full = exportBufferSize(cnv);
  const prev = previewBufferSize(cnv);
  return full.width !== prev.width || full.height !== prev.height;
}

/** Rough cost score for soft UI hints (not a benchmark). */
export function estimateStackCost(stack) {
  let score = 0;
  for (let i = 0; i < stack.length; i++) {
    const inst = stack[i];
    if (!inst.enabled) continue;
    score += 1;
    if (HEAVY_MODULES.has(inst.module)) score += 2;
    if (MODULES[inst.module]?.animated) score += 0.5;
  }
  return score;
}

/**
 * Human-readable perf hint, or '' if fine.
 * @param {object} state
 */
export function perfHintText(state) {
  const full = exportBufferSize(state.cnv);
  const mp = (full.width * full.height) / 1e6;
  const cost = estimateStackCost(state.stack || []);
  const capped = isPreviewResolutionCapped(state.cnv);
  const parts = [];
  if (mp >= HEAVY_MEGAPIXELS) {
    parts.push(`Export ${full.width}×${full.height} (~${mp.toFixed(1)} MP)`);
  }
  if (cost >= 10) {
    parts.push('heavy effect stack');
  }
  if (capped) {
    parts.push(`preview capped @${PREVIEW_MAX_EDGE}px`);
  }
  if (!parts.length) return '';
  return `⚡ ${parts.join(' · ')} — full res on export`;
}
