// Транскрипция пасса displaceSine (bundle-pretty.js:47215-47233).
import { radians, map } from './uniformUtils.js';
import { SINE_MODES, FREQ_MODES, WRAP_MODES } from './optionTables.js';

const U = {
  u_srcRes: [0, 0],
  u_time: 0,
  u_mode: 0,
  u_amp: [0, 0],
  u_compress: 0,
  u_aspect: 0,
  u_freq: [0, 0],
  u_speed: [0, 0],
  u_phase: [0, 0],
  u_angle: 0,
  u_center: [0, 0],
  u_wrapMode: 0,
};

export const displaceSine = {
  key: 'displaceSine',
  label: 'Displace: Sine',
  type: 'pass',
  defaults: {
    sineMode: 0,
    amp: 10,
    compress: 0,
    aspect: 0,
    center: { x: 0, y: 0 },
    freqMode: 0,
    freqLow: 10,
    freqHigh: 100,
    angle: 0,
    phase: 0,
    cycle: 0,
    wrapMode: 0,
  },
  controls: [
    { type: 'select', path: 'sineMode', label: 'Sine Mode', options: SINE_MODES },
    { type: 'slider', path: 'amp', label: 'Amplify', min: 0, max: 100, step: 0.1 },
    { type: 'slider', path: 'compress', label: 'Peaks Compress', min: 0, max: 0.95, step: 0.01 },
    { type: 'slider', path: 'aspect', label: 'Axis Aspect', min: -1, max: 1, step: 0.01 },
    { type: 'slider', path: 'angle', label: 'Space Rotation', min: -180, max: 180, step: 1 },
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
      max: 250,
      step: 1,
      showIf: { path: 'freqMode', equals: 1 },
    },
    { type: 'slider', path: 'phase', label: 'Phase Shift', min: 0, max: 1, step: 0.01 },
    { type: 'slider', path: 'cycle', label: 'Cycles', min: -10, max: 10, step: 0.1 },
    {
      type: 'centerPoint',
      path: 'center',
      label: 'Center Point',
      axes: { x: { min: -1, max: 1, step: 0.01 }, y: { min: -1, max: 1, step: 0.01 } },
      showIf: { path: 'sineMode', notEquals: 0 },
    },
    { type: 'select', path: 'wrapMode', label: 'Wrapping Mode', options: WRAP_MODES },
  ],
  uniforms(p, env) {
    const amp = map(p.amp, 0, 100, 0, 0.25);
    const freq = p.freqMode === 0 ? p.freqLow : p.freqHigh;
    U.u_srcRes[0] = env.width;
    U.u_srcRes[1] = env.height;
    U.u_time = env.time;
    U.u_mode = p.sineMode;
    U.u_amp[0] = amp;
    U.u_amp[1] = amp;
    U.u_compress = p.compress;
    U.u_aspect = p.aspect;
    U.u_freq[0] = freq;
    U.u_freq[1] = freq;
    U.u_speed[0] = p.cycle;
    U.u_speed[1] = p.cycle;
    U.u_phase[0] = p.phase;
    U.u_phase[1] = p.phase;
    U.u_angle = radians(p.angle);
    U.u_center[0] = p.center.x;
    U.u_center[1] = p.center.y;
    U.u_wrapMode = p.wrapMode;
    return U;
  },
};
