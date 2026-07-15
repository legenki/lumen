// Транскрипция пасса displaceSimplex (bundle-pretty.js:47234-47253).
import { radians, map } from './uniformUtils.js';
import { FREQ_MODES, SIMPLEX_NOISE_MODES, WRAP_MODES } from './optionTables.js';

const U = {
  u_srcRes: [0, 0],
  u_time: 0,
  u_mode: 0,
  u_aspect: 0,
  u_angleDomain: 0,
  u_angleVector: 0,
  u_amp: [0, 0],
  u_freq: [0, 0],
  u_speed: [0, 0],
  u_seed: 0,
  u_octaves: 1,
  u_wrapMode: 0,
};

export const displaceSimplex = {
  key: 'displaceSimplex',
  label: 'Displace: Simplex Noise',
  type: 'pass',
  defaults: {
    noiseMode: 0,
    amp: 10,
    octaves: 1,
    aspect: 0,
    angleDomain: 0,
    angleVector: 0,
    freqMode: 0,
    freqLow: 10,
    freqHigh: 100,
    speed: 0,
    seed: 0,
    wrapMode: 0,
  },
  controls: [
    { type: 'select', path: 'noiseMode', label: 'Noise Mode', options: SIMPLEX_NOISE_MODES },
    { type: 'slider', path: 'amp', label: 'Amplify', min: 0, max: 100, step: 0.1 },
    { type: 'slider', path: 'octaves', label: 'Noise Octaves', min: 1, max: 5, step: 1 },
    { type: 'slider', path: 'aspect', label: 'Axis Aspect', min: -1, max: 1, step: 0.01 },
    { type: 'slider', path: 'angleDomain', label: 'Domain Rotate', min: -180, max: 180, step: 1 },
    { type: 'select', path: 'freqMode', label: 'Frequency Mode', options: FREQ_MODES },
    {
      type: 'slider',
      path: 'freqLow',
      label: 'Frequency Scale',
      min: 0,
      max: 25,
      step: 0.1,
      showIf: { path: 'freqMode', equals: 0 },
    },
    {
      type: 'slider',
      path: 'freqHigh',
      label: 'Frequency Scale',
      min: 25,
      max: 1000,
      step: 1,
      showIf: { path: 'freqMode', equals: 1 },
    },
    { type: 'slider', path: 'angleVector', label: 'Vector Angle', min: -180, max: 180, step: 1 },
    { type: 'slider', path: 'speed', label: 'Noise Speed', min: 0, max: 100, step: 1 },
    { type: 'slider', path: 'seed', label: 'Noise Seed', min: 0, max: 1000, step: 1 },
    { type: 'select', path: 'wrapMode', label: 'Wrapping Mode', options: WRAP_MODES },
  ],
  uniforms(p, env) {
    const amp = map(p.amp, 0, 100, 0, 1);
    const freq = p.freqMode === 0 ? p.freqLow : p.freqHigh;
    const speed = map(p.speed, 0, 100, 0, 0.01) * env.totalFrames;
    U.u_srcRes[0] = env.width;
    U.u_srcRes[1] = env.height;
    U.u_time = env.time;
    U.u_mode = p.noiseMode;
    U.u_aspect = p.aspect;
    U.u_angleDomain = radians(p.angleDomain);
    U.u_angleVector = radians(p.angleVector);
    U.u_amp[0] = amp;
    U.u_amp[1] = amp;
    U.u_freq[0] = freq;
    U.u_freq[1] = freq;
    U.u_speed[0] = speed;
    U.u_speed[1] = speed;
    U.u_seed = p.seed;
    U.u_octaves = p.octaves;
    U.u_wrapMode = p.wrapMode;
    return U;
  },
};
