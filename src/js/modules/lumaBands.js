// Транскрипция пасса lumaBands (bundle-pretty.js:47405-47420).
import { BLEND_MODES } from './optionTables.js';

const U = {
  u_time: 0,
  u_blendMode: 0,
  u_contrast: 1,
  u_weight: 1,
  u_weightAmp: 0,
  u_weightFreq: 1,
  u_mix: 1,
  u_phase: 0,
  u_phaseFreq: 0,
};

export const lumaBands = {
  key: 'lumaBands',
  label: 'Luma Bands',
  type: 'pass',
  defaults: {
    blendMode: 0,
    mix: 1,
    weight: 1,
    weightAmp: 0,
    weightFreq: 1,
    phase: 0,
    phaseFreq: 0,
    contrast: 1,
  },
  controls: [
    { type: 'select', path: 'blendMode', label: 'Blending Mode', options: BLEND_MODES },
    { type: 'slider', path: 'mix', label: 'Pass Mix', min: 0, max: 1, step: 0.01 },
    { type: 'separator' },
    { type: 'slider', path: 'weight', label: 'Luma Weight', min: 0, max: 10, step: 0.01 },
    { type: 'slider', path: 'weightAmp', label: 'Animation Range', min: 0, max: 2, step: 0.01 },
    {
      type: 'slider',
      path: 'weightFreq',
      label: 'Frequency',
      min: 0,
      max: 5,
      step: 0.1,
      showIf: { path: 'weightAmp', notEquals: 0 },
    },
    { type: 'separator' },
    { type: 'slider', path: 'phase', label: 'Phase', min: 0, max: 1, step: 0.01 },
    { type: 'slider', path: 'phaseFreq', label: 'Phase Animation', min: 0, max: 10, step: 0.1 },
    { type: 'separator' },
    { type: 'slider', path: 'contrast', label: 'Bands Contrast', min: 0.25, max: 5, step: 0.01 },
  ],
  uniforms(p, env) {
    U.u_time = env.time;
    U.u_blendMode = p.blendMode;
    U.u_contrast = p.contrast;
    U.u_weight = p.weight;
    U.u_weightAmp = p.weightAmp;
    U.u_weightFreq = p.weightFreq;
    U.u_mix = p.mix;
    U.u_phase = p.phase;
    U.u_phaseFreq = p.phaseFreq;
    return U;
  },
};
