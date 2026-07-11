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
      label: 'Height Source',
      options: EMBOSS_HEIGHT_SOURCE_MODES,
    },
    {
      type: 'slider',
      path: 'depthSize',
      label: 'Depth',
      min: 0,
      max: 100,
      step: 1,
    },
    {
      type: 'slider',
      path: 'heightSize',
      label: 'Height Size',
      min: 0,
      max: 2,
      step: 0.01,
    },
    {
      type: 'slider',
      path: 'softness',
      label: 'Softness',
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      type: 'select',
      path: 'contourMode',
      label: 'Contour Mode',
      options: EMBOSS_CONTOUR_MODES,
    },
    {
      type: 'slider',
      path: 'lightAlt',
      label: 'Light Altitude',
      min: -90,
      max: 90,
      step: 1,
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
      label: 'Highlight Color',
    },
    {
      type: 'slider',
      path: 'highOpacity',
      label: 'Highlight Opacity',
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      type: 'select',
      path: 'highMode',
      label: 'Highlight Blend Mode',
      options: BLEND_MODES,
    },
    {
      type: 'color',
      path: 'shadColor',
      label: 'Shadow Color',
    },
    {
      type: 'slider',
      path: 'shadOpacity',
      label: 'Shadow Opacity',
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      type: 'select',
      path: 'shadMode',
      label: 'Shadow Blend Mode',
      options: BLEND_MODES,
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
      ctx.blur.gaussian(inputTex, heightSrc, {
        sigma: preBlurPx / minDim,
        minDimOverride: minDim,
        minScale: 1,
        inputIsPremult: true,
        mask: maskTex,
      });
      heightTex = heightSrc.color;
    }

    // Main emboss pass
    const target = ctx.nextTarget();
    target.begin();
    ctx.glc.clear();
    const shader = ctx.shaders.embossEffect;
    ctx.p.shader(shader);
    shader.setUniform('u_src', inputTex);
    shader.setUniform('u_heightTex', heightTex);
    shader.setUniform('u_heightUseTex', true);
    shader.setUniform('u_srcRes', [w, h]);
    shader.setUniform('u_mask', maskTex ? maskTex : ctx.maskPlaceholder.color);
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
    ctx.p.rect(-w / 2, -h / 2, w, h);
    target.end();

    return target.color;
  },
};
