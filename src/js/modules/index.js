// LUMEN — реестр модулей (фаза 3: четыре Fill; фаза 5: Color-группа ×4 + остальные 11).
import { fillColor } from './fillColor.js';
import { fillGradient } from './fillGradient.js';
import { fillMedia } from './fillMedia.js';
import { fillNoise } from './fillNoise.js';

import { colorCorrection } from './colorCorrection.js';
import { gradientMap } from './gradientMap.js';
import { lumaBands } from './lumaBands.js';
import { rgbShift } from './rgbShift.js';

export const MODULES = {
  fillColor,
  fillGradient,
  fillMedia,
  fillNoise,

  colorCorrection,
  gradientMap,
  lumaBands,
  rgbShift,
};
