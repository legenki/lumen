// LUMEN — реестр модулей (фаза 3: четыре Fill; фаза 5: Color-группа ×4 + Displace-группа ×4 + остальные 7).
import { fillColor } from './fillColor.js';
import { fillGradient } from './fillGradient.js';
import { fillMedia } from './fillMedia.js';
import { fillNoise } from './fillNoise.js';

import { colorCorrection } from './colorCorrection.js';
import { gradientMap } from './gradientMap.js';
import { lumaBands } from './lumaBands.js';
import { rgbShift } from './rgbShift.js';

import { displaceSine } from './displaceSine.js';
import { displaceCubic } from './displaceCubic.js';
import { displaceSimplex } from './displaceSimplex.js';
import { displaceTexture } from './displaceTexture.js';

export const MODULES = {
  fillColor,
  fillGradient,
  fillMedia,
  fillNoise,

  colorCorrection,
  gradientMap,
  lumaBands,
  rgbShift,

  displaceSine,
  displaceCubic,
  displaceSimplex,
  displaceTexture,
};
