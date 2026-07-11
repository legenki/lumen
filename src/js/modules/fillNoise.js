// Транскрипция пасса fillNoise (bundle-pretty.js:47271-47287).
import { BLEND_MODES, ALPHA_MODES } from './optionTables.js';

const U = {
  u_srcRes: [0, 0], u_mix: 0.2, u_blendMode: 0, u_contrast: 1, u_grainPx: 1,
  u_colorNoise: false, u_alphaMode: 0, u_threshRange: [0, 1],
  u_threshSoft: 0.25, // константа старого кода (47286)
  u_fps: 0, u_time: 0, u_clipFps: 60, u_totalFrames: 1,
  u_seed: 0, // константа старого кода (47286)
};

export const fillNoise = {
  key: 'fillNoise',
  label: 'Fill: Noise Grain',
  type: 'pass',
  defaults: {
    mix: 0.2, blendMode: 0, threshold: { min: 0, max: 1 }, alphaMode: 0,
    contrast: 1, colorNoise: false, size: 1, fps: 0,
  },
  controls: [
    { type: 'select', path: 'blendMode', label: 'Blending Mode', options: BLEND_MODES },
    { type: 'slider', path: 'mix', label: 'Pass Mix', min: 0, max: 1, step: 0.01 },
    { type: 'slider', path: 'threshold.min', label: 'Luma Threshold Min', min: 0, max: 1, step: 0.01 },
    { type: 'slider', path: 'threshold.max', label: 'Luma Threshold Max', min: 0, max: 1, step: 0.01 },
    { type: 'slider', path: 'contrast', label: 'Grain Contrast', min: 0.5, max: 5, step: 0.01 },
    { type: 'check', path: 'colorNoise', label: 'Color Noise' },
    { type: 'slider', path: 'size', label: 'Grain Size', min: 1, max: 10, step: 0.1 },
    { type: 'select', path: 'alphaMode', label: 'Alpha Mode', options: ALPHA_MODES },
    { type: 'slider', path: 'fps', label: 'Animation (FPS)', min: 0, max: 60, step: 1 },
  ],
  uniforms(p, env) {
    U.u_srcRes[0] = env.width;
    U.u_srcRes[1] = env.height;
    U.u_mix = p.mix;
    U.u_blendMode = p.blendMode;
    U.u_contrast = p.contrast;
    U.u_grainPx = p.size;
    U.u_colorNoise = p.colorNoise;
    U.u_alphaMode = p.alphaMode;
    U.u_threshRange[0] = p.threshold.min;
    U.u_threshRange[1] = p.threshold.max;
    U.u_fps = p.fps;
    U.u_time = env.time;
    U.u_clipFps = env.frameRate;
    U.u_totalFrames = env.totalFrames;
    return U;
  },
};
