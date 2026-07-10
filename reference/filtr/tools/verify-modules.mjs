// Verifies reference/filtr/modules.js: complete, self-contained, well-formed.
import { MODULES } from '../modules.js';

const EXPECTED = [
  'fillMedia', 'fillColor', 'fillGradient', 'fillNoise',
  'displaceSine', 'displaceCubic', 'displaceSimplex', 'displaceTexture',
  'blurGaussian', 'blurMotion', 'blurNoise',
  'gradientMap', 'colorCorrection', 'rgbShift', 'lumaBands',
  'embossEffect', 'lensGrid', 'warpGrid', 'maskMedia',
];

const keys = Object.keys(MODULES);
const missing = EXPECTED.filter((k) => !keys.includes(k));
const extra = keys.filter((k) => !EXPECTED.includes(k));
if (missing.length || extra.length) {
  throw new Error(`Registry mismatch. Missing: ${missing} Extra: ${extra}`);
}
for (const [key, def] of Object.entries(MODULES)) {
  for (const field of ['label', 'type', 'module', 'defaults', 'panels']) {
    if (!(field in def)) throw new Error(`${key}: missing "${field}"`);
  }
  if (def.module !== key) throw new Error(`${key}: module field mismatch`);
  if (!Array.isArray(def.panels) || !def.panels.length) {
    throw new Error(`${key}: panels must be a non-empty array`);
  }
}
if (MODULES.maskMedia.type !== 'mask') throw new Error('maskMedia.type !== "mask"');
if (!Array.isArray(MODULES.maskMedia.defaults.__maskMembers)) {
  throw new Error('maskMedia.defaults.__maskMembers missing');
}
console.log(`OK: ${keys.length} modules verified`);
