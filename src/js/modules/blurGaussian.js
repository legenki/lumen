// Транскрипция пасса blurGaussian (bundle-pretty.js:47150-47166).
// Модуль с run()-хуком: вызывает ctx.blur.gaussian с рассчитанной sigma.
import { map, EASE } from './uniformUtils.js';

export function gaussianSigma(p) {
  // sigma = map(EASE.quadIn(p.radius/100), 0,1, 0, 0.1)
  // Бандл читает p.quality, которого нет ни в дефолтах, ни в контролах
  // reference/filtr/modules.js → всегда p4(undefined)=0 → QUALITY_SCALE[0]=1.
  // Захардкожено, как maxSigma=0.2 у blurMotion.
  return map(EASE.quadIn(p.radius / 100), 0, 1, 0, 0.1);
}

export const blurGaussian = {
  key: 'blurGaussian',
  label: 'Blur: Gaussian',
  type: 'pass',
  defaults: {
    mix: 1,
    blendMode: 0,
    radius: 15,
    aspect: 0,
  },
  controls: [
    {
      type: 'select',
      path: 'blendMode',
      label: 'Blending Mode',
      options: [
        { value: 0, label: 'Normal' },
        { value: 1, label: 'Add' },
        { value: 2, label: 'Multiply' },
        { value: 3, label: 'Screen' },
        { value: 4, label: 'Overlay' },
        { value: 5, label: 'Darken' },
        { value: 6, label: 'Lighten' },
      ],
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
      path: 'aspect',
      label: 'Aspect Ratio',
      min: -1,
      max: 1,
      step: 0.01,
    },
  ],
  gaussianSigma,
  run({ ctx, inst, inputTex, _env, maskTex }) {
    const p = inst.params;
    const sigma = gaussianSigma(p);
    const target = ctx.nextTarget();
    ctx.blur.gaussian(inputTex, target, {
      sigma,
      aspect: p.aspect,
      minScale: 1,
      inputIsPremult: true,
      mask: maskTex,
      mix: p.mix ?? 1,
      blendMode: p.blendMode ?? 0,
    });
    return target.color;
  },
};
