// Транскрипция пасса fillGradient (bundle-pretty.js:47305-47327).
import { radians, packGradient, GRADIENT_MAX } from './uniformUtils.js';

const DITHER_STRENGTH = 10 / 255; // fF, bundle-pretty.js:39180

const times = new Array(GRADIENT_MAX).fill(0);
const colors = new Array(GRADIENT_MAX * 4).fill(0);
const U = {
  u_aspect: 1, u_resolution: [0, 0], u_mix: 1, u_blendMode: 0,
  u_ditherStrength: DITHER_STRENGTH, u_gradMode: 0, u_gradCenter: [0, 0],
  u_gradAngle: 0, u_gradScale: [1, 1], u_gradReverse: false, u_wrapMode: 0,
  u_alphaMode: 0, u_gradStopCount: 2, u_gradTime: times, u_gradColor: colors,
};

export const fillGradient = {
  key: 'fillGradient',
  label: 'Fill: Gradient',
  type: 'pass',
  defaults: {
    mix: 1,
    gradient: [
      { time: 0, value: { r: 255, g: 255, b: 255, a: 1 } },
      { time: 1, value: { r: 0, g: 0, b: 0, a: 1 } },
    ],
    gradMode: 0, alphaMode: 0, blendMode: 0, gradScale: 1,
    gradCenter: { x: 0, y: 0 }, gradAngle: 0, gradReverse: false, wrapMode: 0,
  },
  uniforms(p, env) {
    U.u_aspect = env.width / env.height;
    U.u_resolution[0] = env.width;
    U.u_resolution[1] = env.height;
    U.u_mix = p.mix;
    U.u_blendMode = p.blendMode;
    U.u_gradMode = p.gradMode;
    U.u_gradCenter[0] = p.gradCenter.x;
    U.u_gradCenter[1] = p.gradCenter.y;
    U.u_gradAngle = radians(p.gradAngle);
    U.u_gradScale[0] = p.gradScale; // скаляр в обе оси, как в старом коде
    U.u_gradScale[1] = p.gradScale;
    U.u_gradReverse = p.gradReverse;
    U.u_wrapMode = p.wrapMode;
    U.u_alphaMode = p.alphaMode;
    U.u_gradStopCount = packGradient(p.gradient, times, colors);
    return U;
  },
};
