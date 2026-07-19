// Транскрипция пасса embossEffect (bundle-pretty.js:47421-47446).
// Модуль с run()-хуком: пре-блюр heightMap и основной emboss-пасс.
import { hexToRgb } from './uniformUtils.js';
import { BLEND_MODES, EMBOSS_HEIGHT_SOURCE_MODES, EMBOSS_COLOR_MODES, EMBOSS_CONTOUR_MODES } from './optionTables.js';

// Module-level scratch buffers (zero-alloc)
const scratch3High = new Float32Array(3);
const scratch3Shad = new Float32Array(3);

export function embossSigma(p, env) {
  // preBlurPx = p.heightSize × p.softness × env.scaleValue
  return p.heightSize * p.softness * env.scaleValue;
}

export const embossEffect = {
  key: 'embossEffect',
  label: 'Emboss Effect',
  type: 'pass',
  defaults: {
    mix: 1,
    blendMode: 0,
    heightSource: 0,
    depthSize: 20,
    heightSize: 0.5,
    softness: 0.5,
    contourMode: 0,
    lightAlt: 30,
    lightAngle: 235,
    colorMode: 0,
    highColor: '#FFFFFF',
    highMode: 7,
    highOpacity: 0.9,
    shadColor: '#CCCCCC',
    shadMode: 7,
    shadOpacity: 0.9,
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
      type: 'select',
      path: 'heightSource',
      label: 'Height From',
      options: EMBOSS_HEIGHT_SOURCE_MODES,
    },
    {
      type: 'slider',
      path: 'depthSize',
      label: 'Depth Size',
      min: 0,
      max: 100,
      step: 0.1,
    },
    {
      type: 'slider',
      path: 'heightSize',
      label: 'Offset Size',
      min: 0.01,
      max: 10,
      step: 0.01,
    },
    {
      type: 'slider',
      path: 'softness',
      label: 'Blur Softness',
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      type: 'select',
      path: 'contourMode',
      label: 'Gloss Contour',
      options: EMBOSS_CONTOUR_MODES,
    },
    {
      type: 'slider',
      path: 'lightAlt',
      label: 'Light Altitude',
      min: 0,
      max: 90,
      step: 0.1,
    },
    {
      type: 'slider',
      path: 'lightAngle',
      label: 'Light Angle',
      min: 0,
      max: 360,
      step: 1,
    },
    {
      type: 'select',
      path: 'colorMode',
      label: 'Color Mode',
      options: EMBOSS_COLOR_MODES,
    },
    {
      type: 'color',
      path: 'highColor',
      label: 'High Color',
      showIf: { path: 'colorMode', in: [1] },
    },
    {
      type: 'slider',
      path: 'highOpacity',
      label: 'Opacity',
      min: 0,
      max: 1,
      step: 0.01,
      showIf: { path: 'colorMode', in: [1] },
    },
    {
      type: 'select',
      path: 'highMode',
      label: 'Blending Mode',
      options: BLEND_MODES,
      showIf: { path: 'colorMode', in: [1] },
    },
    {
      type: 'color',
      path: 'shadColor',
      label: 'Shadow Color',
      showIf: { path: 'colorMode', in: [1] },
    },
    {
      type: 'slider',
      path: 'shadOpacity',
      label: 'Opacity',
      min: 0,
      max: 1,
      step: 0.01,
      showIf: { path: 'colorMode', in: [1] },
    },
    {
      type: 'select',
      path: 'shadMode',
      label: 'Blending Mode',
      options: BLEND_MODES,
      showIf: { path: 'colorMode', in: [1] },
    },
  ],
  testHexToRgb: hexToRgb,
  embossSigma,
  run({ ctx, inst, inputTex, env, maskTex }) {
    const p = inst.params;
    const w = ctx.glc.width;
    const h = ctx.glc.height;

    // Pré-blur calculation
    const preBlurPx = embossSigma(p, env);
    const minDim = Math.max(1, (w + h) / 2);

    let heightTex = inputTex;
    if (preBlurPx > 0) {
      const heightSrc = ctx.nextTarget();
      // Draft: slightly softer sigma + downscale (still readable, cheaper).
      const sigma = (env?.draft ? preBlurPx * 0.75 : preBlurPx) / minDim;
      ctx.blur.gaussian(inputTex, heightSrc, {
        sigma,
        minDimOverride: minDim,
        minScale: 1,
        inputIsPremult: true,
        mask: maskTex,
        draft: !!env?.draft,
      });
      heightTex = heightSrc.color;
    }

    // Main emboss pass
    const target = ctx.nextTarget();
    target.begin();
    ctx.glc.clear();
    const shader = ctx.shaders.embossEffect;
    ctx.glc.shader(shader);
    // Guard samplers: p5 errors if a number is passed to sampler2D uniforms.
    const mask = maskTex || ctx.maskPlaceholder.color;
    if (inputTex && typeof inputTex !== 'number') shader.setUniform('u_src', inputTex);
    if (heightTex && typeof heightTex !== 'number') shader.setUniform('u_heightTex', heightTex);
    shader.setUniform('u_heightUseTex', true);
    shader.setUniform('u_srcRes', [w, h]);
    if (mask && typeof mask !== 'number') shader.setUniform('u_mask', mask);
    shader.setUniform('u_maskUse', !!maskTex);
    shader.setUniform('u_mix', p.mix);
    shader.setUniform('u_glossContourMode', p.contourMode);
    shader.setUniform('u_heightSource', p.heightSource);
    shader.setUniform('u_depth', p.depthSize * 0.1);
    shader.setUniform('u_sizePx', p.heightSize * env.scaleValue);
    shader.setUniform('u_heightDeg', p.lightAlt);
    shader.setUniform('u_angleDeg', p.lightAngle);
    shader.setUniform('u_blendMode', p.blendMode);
    shader.setUniform('u_colorMode', p.colorMode);
    shader.setUniform('u_highlightColor', hexToRgb(p.highColor, scratch3High));
    shader.setUniform('u_highlightBlendMode', p.highMode);
    shader.setUniform('u_highlightOpacity', p.highOpacity);
    shader.setUniform('u_shadowColor', hexToRgb(p.shadColor, scratch3Shad));
    shader.setUniform('u_shadowBlendMode', p.shadMode);
    shader.setUniform('u_shadowOpacity', p.shadOpacity);
    ctx.glc.rect(-w / 2, -h / 2, w, h);
    target.end();

    return target.color;
  },
};
