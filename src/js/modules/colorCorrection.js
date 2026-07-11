// Транскрипция пасса colorCorrection (bundle-pretty.js:47371-47387).

const U = {
  u_mix: 1,
  u_brightness: 0,
  u_contrast: 0,
  u_saturation: 1,
};

export const colorCorrection = {
  key: 'colorCorrection',
  label: 'Color Adjust',
  type: 'pass',
  defaults: {
    mix: 1,
    brightness: 0,
    contrast: 0,
    saturation: 1,
  },
  controls: [
    { type: 'slider', path: 'mix', label: 'Pass Mix', min: 0, max: 1, step: 0.01 },
    { type: 'slider', path: 'brightness', label: 'Brightness', min: -1, max: 1, step: 0.01 },
    { type: 'slider', path: 'contrast', label: 'Contrast', min: -1, max: 5, step: 0.01 },
    { type: 'slider', path: 'saturation', label: 'Saturation', min: 0, max: 5, step: 0.01 },
  ],
  uniforms(p) {
    U.u_mix = p.mix;
    U.u_brightness = p.brightness;
    U.u_contrast = p.contrast;
    U.u_saturation = p.saturation;
    return U;
  },
};
