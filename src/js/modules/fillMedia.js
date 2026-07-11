// Транскрипция пасса fillMedia (bundle-pretty.js:47350-47370).
// Текстуру u_img/u_imgRes ставит пайплайн (media-lookup — его зона, см. pipeline.js);
// здесь только числовые параметры.
import { radians } from './uniformUtils.js';
import { BLEND_MODES, WRAP_MODES } from './optionTables.js';
import { DEFAULT_MEDIA } from '../assets.js';

const MEDIA_OPTIONS = Object.fromEntries(Object.keys(DEFAULT_MEDIA).map((k) => [k, k]));

const U = {
  u_srcRes: [0, 0], u_blendMode: 0, u_mix: 1,
  u_scale: 1, u_rotate: 0, u_offset: [0, 0], u_wrapMode: 3,
};

export const fillMedia = {
  key: 'fillMedia',
  label: 'Fill: Media File',
  type: 'pass',
  defaults: {
    image: 'text0', blendMode: 0, mix: 1, scale: 100, rotate: 0,
    position: { x: 0, y: 0 }, wrapMode: 3,
  },
  controls: [
    { type: 'select', path: 'blendMode', label: 'Blending Mode', options: BLEND_MODES },
    { type: 'slider', path: 'mix', label: 'Pass Mix', min: 0, max: 1, step: 0.01 },
    { type: 'select', path: 'image', label: 'Texture', options: MEDIA_OPTIONS },
    { type: 'slider', path: 'scale', label: 'Scale Image', min: 1, max: 250, step: 0.1 },
    { type: 'slider', path: 'rotate', label: 'Rotate Image', min: -180, max: 180, step: 1 },
    {
      type: 'centerPoint', path: 'position', label: 'Position Offset',
      axes: { x: { min: -50, max: 50, step: 0.1 }, y: { min: -50, max: 50, step: 0.1 } },
    },
    { type: 'select', path: 'wrapMode', label: 'Wrapping Mode', options: WRAP_MODES },
  ],
  uniforms(p, env) {
    U.u_srcRes[0] = env.width;
    U.u_srcRes[1] = env.height;
    U.u_blendMode = p.blendMode;
    U.u_mix = p.mix;
    U.u_scale = p.scale / 100;
    U.u_rotate = radians(p.rotate);
    U.u_offset[0] = p.position.x / 100;
    U.u_offset[1] = p.position.y / 100;
    U.u_wrapMode = p.wrapMode;
    return U;
  },
};
