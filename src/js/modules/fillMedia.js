// Транскрипция пасса fillMedia (bundle-pretty.js:47350-47370).
// Текстуру u_img/u_imgRes ставит пайплайн (media-lookup — его зона, см. pipeline.js);
// здесь только числовые параметры.
import { radians } from './uniformUtils.js';

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
