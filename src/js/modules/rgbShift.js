// Транскрипция пасса rgbShift (bundle-pretty.js:47388-47404).
import { radians } from './uniformUtils.js';
import { RGB_SHIFT_MODES, WRAP_MODES } from './optionTables.js';

const U = {
  u_mix: 1,
  u_texelSize: [0, 0],
  u_abStrength: 0,
  u_maxStrength: 0,
  u_abMode: 0,
  u_abAngle: 0,
  u_abFocus: [0.5, 0.5],
  u_abChannel: [0.3, 0.18, 0.06],
  u_abHueShift: 0,
  u_wrapMode: 2,
};

export const rgbShift = {
  key: 'rgbShift',
  label: 'RGB Shift',
  type: 'pass',
  defaults: {
    mix: 1,
    abStrength: 10,
    abMode: 0,
    abAngle: 45,
    abFocus: { x: 0, y: 0 },
    abChannel: { x: 0.1, y: 0.06, z: 0.02 },
    hueShift: 0,
    wrapMode: 2,
  },
  controls: [
    { type: 'slider', path: 'mix', label: 'Pass Mix', min: 0, max: 1, step: 0.01 },
    { type: 'select', path: 'abMode', label: 'Aberration Mode', options: RGB_SHIFT_MODES },
    { type: 'slider', path: 'abStrength', label: 'Shift Strength', min: -50, max: 50, step: 0.1 },
    {
      type: 'slider',
      path: 'abAngle',
      label: 'Shift Angle',
      min: -180,
      max: 180,
      step: 1,
      showIf: { path: 'abMode', equals: 0 },
    },
    {
      type: 'centerPoint',
      path: 'abFocus',
      label: 'Focus Center',
      axes: { x: { min: -0.5, max: 0.5, step: 0.01 }, y: { min: -0.5, max: 0.5, step: 0.01 } },
      showIf: { path: 'abMode', notEquals: 0 },
    },
    { type: 'slider', path: 'abChannel.x', label: 'Channel R', min: 0, max: 1, step: 0.01 },
    { type: 'slider', path: 'abChannel.y', label: 'Channel G', min: 0, max: 1, step: 0.01 },
    { type: 'slider', path: 'abChannel.z', label: 'Channel B', min: 0, max: 1, step: 0.01 },
    { type: 'slider', path: 'hueShift', label: 'Hue Shift', min: -1, max: 1, step: 0.01 },
    { type: 'select', path: 'wrapMode', label: 'Wrapping Mode', options: WRAP_MODES },
  ],
  uniforms(p, env) {
    U.u_mix = p.mix;
    U.u_texelSize[0] = 1 / env.width;
    U.u_texelSize[1] = 1 / env.height;
    U.u_abStrength = p.abStrength * env.scaleValue;
    U.u_maxStrength = 50 * env.scaleValue;
    U.u_abMode = p.abMode;
    U.u_abAngle = radians(p.abAngle);
    U.u_abFocus[0] = p.abFocus.x + 0.5;
    U.u_abFocus[1] = p.abFocus.y + 0.5;
    U.u_abChannel[0] = p.abChannel.x * 3;
    U.u_abChannel[1] = p.abChannel.y * 3;
    U.u_abChannel[2] = p.abChannel.z * 3;
    U.u_abHueShift = p.hueShift;
    U.u_wrapMode = p.wrapMode;
    return U;
  },
};
