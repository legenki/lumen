// Транскрипция пасса lensGrid (bundle-pretty.js:47447-47475).
// Модуль с run()-хуком: пре-блюр и основной lens-grid пасс.
import { hexToRgb, radians } from './uniformUtils.js';
import { WRAP_MODES } from './optionTables.js';

// Module-level scratch buffers (zero-alloc)
const scratch3Spec = new Float32Array(3);
const scratch3Shadow = new Float32Array(3);
const scratchLightDir = new Float32Array(3);

export function lensSigma(p, env) {
  // preBlurPx = p.blur × p.strength × env.scaleValue
  return p.blur * p.strength * env.scaleValue;
}

export function lightDirVector(p) {
  // lightAngle = p.lightDir.x × 2π
  // return [sin(lightAngle), cos(lightAngle), p.lightDir.y]
  const angle = p.lightDir.x * 2 * Math.PI;
  scratchLightDir[0] = Math.sin(angle);
  scratchLightDir[1] = Math.cos(angle);
  scratchLightDir[2] = p.lightDir.y;
  return scratchLightDir;
}

export const lensGrid = {
  key: 'lensGrid',
  label: 'Lens Grid',
  type: 'pass',
  defaults: {
    mix: 1,
    strength: 0.5,
    blur: 1,
    gridCells: { x: 6, y: 6 },
    gridScale: 0.9,
    gridAngle: 0,
    squircle: 8,
    lensScale: 1,
    ior: 1.5,
    curvature: 1,
    edgeSoftness: 0.1,
    aberration: 0.015,
    lightDir: { x: 0.66, y: 0.5 },
    specAmount: 0.4,
    specPower: 0.5,
    specColor: '#FFFFFF',
    shadowAmount: 0.2,
    shadowPower: 0.5,
    shadowColor: '#000000',
    wrapMode: 2,
  },
  controls: [
    {
      type: 'slider',
      path: 'strength',
      label: 'Effect Strength',
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      type: 'slider',
      path: 'blur',
      label: 'Blur Radius',
      min: 0,
      max: 5,
      step: 0.1,
    },
    {
      type: 'centerPoint',
      path: 'gridCells',
      label: 'Grid Cells',
      axes: {
        x: { min: 1, max: 64, step: 1 },
        y: { min: 1, max: 64, step: 1 },
      },
    },
    {
      type: 'slider',
      path: 'gridScale',
      label: 'Grid Scale',
      min: 0.5,
      max: 2.5,
      step: 0.01,
    },
    {
      type: 'slider',
      path: 'gridAngle',
      label: 'Grid Rotation',
      min: -180,
      max: 180,
      step: 1,
    },
    {
      type: 'slider',
      path: 'squircle',
      label: 'Lens Squircle',
      min: 1,
      max: 25,
      step: 0.1,
    },
    {
      type: 'slider',
      path: 'lensScale',
      label: 'Lens Scale',
      min: 0.5,
      max: 1.25,
      step: 0.01,
    },
    {
      type: 'slider',
      path: 'edgeSoftness',
      label: 'Edge Softness',
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      type: 'slider',
      path: 'ior',
      label: 'Glass IOR',
      min: 1.05,
      max: 3,
      step: 0.01,
    },
    {
      type: 'slider',
      path: 'curvature',
      label: 'Glass Curvature',
      min: 0.1,
      max: 5,
      step: 0.01,
    },
    {
      type: 'slider',
      path: 'aberration',
      label: 'Aberration',
      min: 0,
      max: 0.2,
      step: 0.001,
    },
    {
      type: 'centerPoint',
      path: 'lightDir',
      label: 'Light Direction',
      axes: {
        x: { min: 0, max: 1, step: 0.01 },
        y: { min: -1, max: 1, step: 0.01 },
      },
    },
    {
      type: 'slider',
      path: 'specAmount',
      label: 'Specular Amount',
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      type: 'slider',
      path: 'specPower',
      label: 'Specular Power',
      min: 0.1,
      max: 1,
      step: 0.01,
    },
    {
      type: 'color',
      path: 'specColor',
      label: 'Color',
    },
    {
      type: 'slider',
      path: 'shadowAmount',
      label: 'Shadow Amount',
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      type: 'slider',
      path: 'shadowPower',
      label: 'Shadow Power',
      min: 0.1,
      max: 1,
      step: 0.01,
    },
    {
      type: 'color',
      path: 'shadowColor',
      label: 'Color',
    },
    {
      type: 'select',
      path: 'wrapMode',
      label: 'Wrapping Mode',
      options: WRAP_MODES,
    },
  ],
  lensSigma,
  lightDirVector,
  run({ ctx, inst, inputTex, env, maskTex }) {
    const p = inst.params;
    const w = ctx.glc.width;
    const h = ctx.glc.height;

    // Pré-blur calculation
    const preBlurPx = lensSigma(p, env);
    const minDim = Math.max(1, (w + h) / 2);

    let blurredTex = inputTex;
    let blurUse = false;
    if (preBlurPx > 0) {
      const blurTarget = ctx.nextTarget();
      ctx.blur.gaussian(inputTex, blurTarget, {
        sigma: preBlurPx / minDim,
        minDimOverride: minDim,
        minScale: 1,
        inputIsPremult: true,
        mask: maskTex,
      });
      blurredTex = blurTarget.color;
      blurUse = true;
    }

    // Main lens grid pass
    const target = ctx.nextTarget();
    target.begin();
    ctx.glc.clear();
    const shader = ctx.shaders.lensGrid;
    ctx.glc.shader(shader);
    shader.setUniform('u_src', inputTex); // NOT blurred!
    shader.setUniform('u_aspect', w / h);
    shader.setUniform('u_maskUse', !!maskTex);
    shader.setUniform('u_mask', maskTex ? maskTex : ctx.maskPlaceholder.color);
    shader.setUniform('u_blurUse', blurUse);
    shader.setUniform('u_blur', blurredTex);
    shader.setUniform('u_mix', p.mix);
    shader.setUniform('u_strength', p.strength);
    shader.setUniform('u_lensScale', p.lensScale);
    shader.setUniform('u_squircle', p.squircle);
    shader.setUniform('u_edgeSoftness', p.edgeSoftness);
    shader.setUniform('u_gridCells', [p.gridCells.x, p.gridCells.y]);
    shader.setUniform('u_gridScale', p.gridScale);
    shader.setUniform('u_gridAngle', radians(p.gridAngle));
    shader.setUniform('u_ior', p.ior);
    shader.setUniform('u_curvature', p.curvature);
    shader.setUniform('u_aberration', p.aberration);
    const lightAngle = p.lightDir.x * 2 * Math.PI;
    shader.setUniform('u_lightDir', [Math.sin(lightAngle), Math.cos(lightAngle), p.lightDir.y]);
    shader.setUniform('u_specColor', hexToRgb(p.specColor, scratch3Spec));
    shader.setUniform('u_specAmount', p.specAmount);
    shader.setUniform('u_specPower', p.specPower * 25);
    shader.setUniform('u_shadowColor', hexToRgb(p.shadowColor, scratch3Shadow));
    shader.setUniform('u_shadowAmount', p.shadowAmount);
    shader.setUniform('u_shadowPower', p.shadowPower * 5);
    shader.setUniform('u_wrapMode', p.wrapMode);
    ctx.glc.rect(-w / 2, -h / 2, w, h);
    target.end();

    return target.color;
  },
};
