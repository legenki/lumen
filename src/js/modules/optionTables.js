// LUMEN — option-таблицы контролов (дословно из reference/filtr/modules.js).

export const BLEND_MODES = {
  Normal: 0,
  Darken: 1,
  Multiply: 2,
  'Color Burn': 3,
  'Linear Burn': 4,
  'Darker Color': 5,
  Lighten: 6,
  Screen: 7,
  'Color Dodge': 8,
  'Linear Dodge (Add)': 9,
  'Lighter Color': 10,
  Overlay: 11,
  'Soft Light': 12,
  'Hard Light': 13,
  'Vivid Light': 14,
  'Linear Light': 15,
  'Pin Light': 16,
  'Hard Mix': 17,
  Difference: 18,
  Exclusion: 19,
  Subtract: 20,
  Divide: 21,
  Hue: 22,
  Saturation: 23,
  Color: 24,
  Luminosity: 25,
};

export const WRAP_MODES = {
  CLAMP: 0,
  REPEAT: 1,
  MIRROR: 2,
  TRANSPARENT: 3,
};

export const ALPHA_MODES = {
  'Ignore Source Alpha': 0,
  'Fade by Source Alpha': 1,
};

export const GRADIENT_MODES = {
  Linear: 0,
  Radial: 1,
  Angular: 2,
  Box: 3,
  Triangle: 4,
};

export const SINE_MODES = {
  'Flow (2D)': 0,
  'Radial (2D)': 1,
  'Radial (Center)': 2,
};

export const FREQ_MODES = {
  'Low Frequency': 0,
  'High Frequency': 1,
};

export const SIMPLEX_NOISE_MODES = {
  '1D Noise': 0,
  '2D Noise': 1,
};

export const DISPLACE_TEXTURE_SOURCE_MODES = {
  'Previous Pass': 0,
  'Media File': 1,
};

export const RGB_SHIFT_MODES = {
  Directional: 0,
  Center: 1,
  Edges: 2,
};

export const EMBOSS_HEIGHT_SOURCE_MODES = {
  Luma: 0,
  Alpha: 1,
};

export const EMBOSS_COLOR_MODES = {
  'Grayscale': 0,
  'Colored Lighting': 1,
};

export const EMBOSS_CONTOUR_MODES = {
  'Linear': 0,
  'Cone': 1,
  'Cone Inverted': 2,
  'Cove Deep': 3,
  'Cove Shallow': 4,
  'Ring Double': 5,
  'Ring Triple': 6,
  'Arch': 7,
  'Bump': 8,
  'Half Round': 9,
  'Notch': 10,
  'Triangle': 11,
};

export const WARP_GRID_MODES = {
  '1D': 0,
  '2D Unified': 1,
  '2D Separate': 2,
};

export const WARP_GRID_FALLOFF_MODES = {
  'Off': 0,
  'Center': 1,
  'Edges': 2,
};

export const MASK_CHANNELS = {
  Luma: 0,
  Alpha: 1,
  'R Channel': 2,
  'G Channel': 3,
  'B Channel': 4,
};
