// LUMEN — декларативное описание панелей (спека §3: controls.js).
// Фаза 2: только секция Canvas. Presets/Media/Layers добавляются в фазах 4-6.
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
        path: 'cnv.scale.value', min: 2, max: 8, step: 0.25, regen: 'buffer',
      },
      {
        type: 'check', id: 'lm-cnv-animation', label: 'Animation',
        path: 'cnv.animation', regen: 'animation',
      },
    ],
  },
];
