// Транскрипция пасса blurGaussian (bundle-pretty.js:47150-47166).
// Модуль с run()-хуком: вызывает ctx.blur.gaussian с рассчитанной sigma.
import { map, EASE, QUALITY_SCALE } from './uniformUtils.js';

export function gaussianSigma(p) {
  // sigma = map(EASE.quadIn(p.radius/100), 0,1, 0, 0.1×QUALITY_SCALE[p.quality])
  // quality defaults to 0 if undefined (matches p4(i=0) in bundle)
  const quality = Math.max(0, Math.min(3, p.quality ?? 0));
  const maxSigma = 0.1 * QUALITY_SCALE[quality];
  return map(EASE.quadIn(p.radius / 100), 0, 1, 0, maxSigma);
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
    quality: 0,
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
    { type: 'separator' },
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
