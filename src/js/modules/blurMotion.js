// Транскрипция пасса blurMotion (bundle-pretty.js:47167-47181).
// Модуль с run()-хуком: вызывает ctx.blur.motion с рассчитанной sigma.
import { map, EASE } from './uniformUtils.js';
import { BLEND_MODES } from './optionTables.js';

export function motionSigma(p) {
  // sigma = map(EASE.sineIn(p.radius/100), 0,1, 0, 0.2)
  return map(EASE.sineIn(p.radius / 100), 0, 1, 0, 0.2);
}

export const blurMotion = {
  key: 'blurMotion',
  label: 'Blur: Motion',
  type: 'pass',
  defaults: {
    mix: 1,
    blendMode: 0,
    radius: 15,
    angle: 0,
  },
  controls: [
    {
      type: 'select',
      path: 'blendMode',
      label: 'Blending Mode',
      options: BLEND_MODES,
    },
    {
      type: 'slider',
      path: 'mix',
      label: 'Pass Mix',
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      type: 'slider',
      path: 'radius',
      label: 'Blur Radius',
      min: 0,
      max: 50,
      step: 1,
    },
    {
      type: 'slider',
      path: 'angle',
      label: 'Blur Angle',
      min: -180,
      max: 180,
      step: 1,
    },
  ],
  motionSigma,
  run({ ctx, inst, inputTex, env, maskTex }) {
    const p = inst.params;
    const sigma = motionSigma(p);
    const target = ctx.nextTarget();
    const mix = p.mix ?? 1;
    const blendMode = p.blendMode ?? 0;
    ctx.blur.motion(inputTex, target, {
      sigma,
      angleDeg: p.angle,
      inputIsPremult: true,
      mask: maskTex,
      mix,
      blendMode,
      draft: !!env?.draft,
    });
    return target.color;
  },
};
