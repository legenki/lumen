// Транскрипция пасса gradientMap (bundle-pretty.js:47328-47348).
import { packGradient, GRADIENT_MAX } from './uniformUtils.js';
import { BLEND_MODES, ALPHA_MODES } from './optionTables.js';

const DITHER_STRENGTH = 10 / 255; // fF, bundle-pretty.js:39180

const times = new Array(GRADIENT_MAX).fill(0);
const colors = new Array(GRADIENT_MAX * 4).fill(0);
const U = {
  u_resolution: [0, 0], u_mix: 1, u_blendMode: 0, u_ditherStrength: DITHER_STRENGTH,
  u_mapMode: 0, u_mapReverse: false, u_mapGamma: 1, u_mapRange: [0, 1],
  u_alphaMode: 0, u_gradStopCount: 2, u_gradTime: times, u_gradColor: colors,
};

export const gradientMap = {
  key: 'gradientMap',
  label: 'Gradient Map',
  type: 'pass',
  defaults: {
    mix: 1,
    blendMode: 0,
    mapMode: 0,
    gradient: [
      { time: 0, value: { r: 0, g: 0, b: 0, a: 1 } },
      { time: 1, value: { r: 255, g: 255, b: 255, a: 1 } },
    ],
    mapReverse: false,
    mapGamma: 1,
    mapRange: { min: 0, max: 1 },
    alphaMode: 0,
  },
  controls: [
    { type: 'select', path: 'blendMode', label: 'Blending Mode', options: BLEND_MODES },
    { type: 'slider', path: 'mix', label: 'Pass Mix', min: 0, max: 1, step: 0.01 },
    { type: 'separator' },
    { type: 'slider', path: 'mapGamma', label: 'Input Gamma', min: 0.01, max: 5, step: 0.01 },
    { type: 'slider', path: 'mapRange.min', label: 'Input Range Min', min: 0, max: 1, step: 0.01 },
    { type: 'slider', path: 'mapRange.max', label: 'Input Range Max', min: 0, max: 1, step: 0.01 },
    { type: 'check', path: 'mapReverse', label: 'Reverse Map' },
    { type: 'separator' },
    { type: 'gradientMapper', path: 'gradient', label: 'Gradient' },
    { type: 'separator' },
    { type: 'select', path: 'alphaMode', label: 'Alpha Mode', options: ALPHA_MODES },
  ],
  uniforms(p, env) {
    U.u_resolution[0] = env.width;
    U.u_resolution[1] = env.height;
    U.u_mix = p.mix;
    U.u_blendMode = p.blendMode;
    U.u_mapMode = p.mapMode;
    U.u_mapReverse = p.mapReverse;
    U.u_mapGamma = p.mapGamma;
    U.u_mapRange[0] = p.mapRange.min;
    U.u_mapRange[1] = p.mapRange.max;
    U.u_alphaMode = p.alphaMode;
    U.u_gradStopCount = packGradient(p.gradient, times, colors);
    return U;
  },
};
