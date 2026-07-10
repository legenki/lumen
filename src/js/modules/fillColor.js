// Транскрипция пасса fillColor (bundle-pretty.js:47288-47304).
import { hexToRgba } from './uniformUtils.js';

const colorVec = new Float32Array(4);
const U = { u_color: colorVec, u_blendMode: 0, u_alphaMode: 0 };

export const fillColor = {
  key: 'fillColor',
  label: 'Fill: Color',
  type: 'pass',
  defaults: { blendMode: 0, mix: 1, color: '#FFFFFF', alphaMode: 0 },
  uniforms(p, _env) {
    hexToRgba(p.color, p.mix, colorVec); // старый D(): mix уходит в альфу цвета
    U.u_blendMode = p.blendMode;
    U.u_alphaMode = p.alphaMode;
    return U;
  },
};
