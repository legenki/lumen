// Транскрипция пасса blurNoise (bundle-pretty.js:47182-47197).
// Модуль с run()-хуком: использует blueNoise текстуру (env.textures.blueNoise).
// Если текстура не загружена → пасс прозрачен (возврат inputTex).
import { map, EASE } from './uniformUtils.js';
import { BLEND_MODES } from './optionTables.js';

export function noiseUniforms(p, env) {
  return {
    u_noise: env.textures.blueNoise,
    u_mix: p.mix ?? 1,
    u_blendMode: p.blendMode ?? 0,
    u_resolution: [env.width, env.height],
    u_radius: p.radius * env.scaleValue,
    u_noiseIndependence: 0.15,
    u_noiseScale: map(EASE.quadIn(p.scale), 0, 1, 0.01, 5),
    u_samples: p.samples,
  };
}

export const blurNoise = {
  key: 'blurNoise',
  label: 'Blur: Blue-Noise',
  type: 'pass',
  defaults: {
    mix: 1,
    blendMode: 0,
    radius: 8,
    samples: 16,
    scale: 5,
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
      step: 0.1,
    },
    {
      type: 'slider',
      path: 'samples',
      label: 'Noise Samples',
      min: 1,
      max: 24,
      step: 1,
    },
    {
      type: 'slider',
      path: 'scale',
      label: 'Noise Scale',
      min: 0,
      max: 1,
      step: 0.01,
    },
  ],
  noiseUniforms,
  run({ ctx, inst, inputTex, env, maskTex }) {
    const p = inst.params;

    // Guard: blueNoise texture not loaded → pass transparent
    if (!env.textures.blueNoise) return inputTex;

    const fbo = ctx.nextTarget();
    const sh = ctx.shaders.blurNoise;

    fbo.begin();
    ctx.glc.clear();
    ctx.glc.shader(sh);

    const u = noiseUniforms(p, env);
    sh.setUniform('u_src', inputTex);
    sh.setUniform('u_srcRes', [ctx.glc.width, ctx.glc.height]);
    sh.setUniform('u_mask', maskTex ?? ctx.maskPlaceholder.color);
    sh.setUniform('u_maskUse', !!maskTex);

    sh.setUniform('u_noise', u.u_noise);
    sh.setUniform('u_mix', u.u_mix);
    sh.setUniform('u_blendMode', u.u_blendMode);
    sh.setUniform('u_resolution', u.u_resolution);
    sh.setUniform('u_radius', u.u_radius);
    sh.setUniform('u_noiseIndependence', u.u_noiseIndependence);
    sh.setUniform('u_noiseScale', u.u_noiseScale);
    sh.setUniform('u_samples', u.u_samples);

    ctx.glc.rect(
      -ctx.glc.width / 2,
      -ctx.glc.height / 2,
      ctx.glc.width,
      ctx.glc.height,
    );
    fbo.end();
    return fbo.color;
  },
};
