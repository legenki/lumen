// Транскрипция пасса displaceTexture (bundle-pretty.js:47254-47269).
// Модуль с run()-хуком для работы с двумя медиа-текстурами (карта смещения + исходник).
import { radians } from './uniformUtils.js';
import { DISPLACE_TEXTURE_SOURCE_MODES, WRAP_MODES } from './optionTables.js';

export const displaceTexture = {
  key: 'displaceTexture',
  label: 'Displace: Texture Map',
  type: 'pass',
  defaults: {
    texture: 'img0',
    weight: { x: 0.5, y: 0.5 },
    scale: 100,
    position: { x: 0, y: 0 },
    wrapMode: 3,
    mode: 0, // 0 = Previous Pass, 1 = Media File
    source: 'img1',
    scaleSrc: 100,
    rotateSrc: 0,
    positionSrc: { x: 0, y: 0 },
    wrapModeSrc: 2,
  },
  controls: [
    { type: 'media', path: 'texture', label: 'Texture' },
    {
      type: 'slider',
      path: 'weight.x',
      label: 'Weight X',
      min: -5,
      max: 5,
      step: 0.01,
    },
    {
      type: 'slider',
      path: 'weight.y',
      label: 'Weight Y',
      min: -5,
      max: 5,
      step: 0.01,
    },
    { type: 'slider', path: 'scale', label: 'Texture Scale', min: 1, max: 250, step: 0.1 },
    {
      type: 'centerPoint',
      path: 'position',
      label: 'Position Offset',
      axes: { x: { min: -50, max: 50, step: 0.1 }, y: { min: -50, max: 50, step: 0.1 } },
    },
    { type: 'select', path: 'wrapMode', label: 'Wrapping Mode', options: WRAP_MODES },
    {
      type: 'select',
      path: 'mode',
      label: 'Source',
      options: DISPLACE_TEXTURE_SOURCE_MODES,
    },
    {
      type: 'media',
      path: 'source',
      label: 'Texture',
      showIf: { path: 'mode', equals: 1 },
    },
    { type: 'slider', path: 'scaleSrc', label: 'Source Scale', min: 1, max: 250, step: 0.1 },
    {
      type: 'slider',
      path: 'rotateSrc',
      label: 'Source Rotate',
      min: -180,
      max: 180,
      step: 1,
    },
    {
      type: 'centerPoint',
      path: 'positionSrc',
      label: 'Source Offset',
      axes: { x: { min: -50, max: 50, step: 0.1 }, y: { min: -50, max: 50, step: 0.1 } },
    },
    { type: 'select', path: 'wrapModeSrc', label: 'Wrapping Mode', options: WRAP_MODES },
  ],
  run({ ctx, inst, inputTex, env, maskTex }) {
    const p = inst.params;

    // Lookup texture (displacement map)
    const dispEntry = env.media.get(p.texture) || {};
    if (!dispEntry.ready) return inputTex; // texture not ready → pass transparent

    // Lookup source (what to sample for displacement: Previous Pass or Media)
    // Semantics: B(p, "source") ?? L
    // If mode === 0 (Previous Pass), source is ignored; use inputTex
    // If mode === 1 (Media File), use p.source; if not ready, return inputTex
    const useSourceMedia = p.mode === 1;
    let srcEntry = {};
    if (useSourceMedia) {
      srcEntry = env.media.get(p.source) || {};
      if (!srcEntry.ready) return inputTex; // source not ready → pass transparent
    }

    const fbo = ctx.nextTarget();
    const sh = ctx.shaders.displaceTexture;

    fbo.begin();
    ctx.glc.clear();
    ctx.glc.shader(sh);

    // Input and mask
    sh.setUniform('u_src', inputTex);
    sh.setUniform('u_srcRes', [ctx.glc.width, ctx.glc.height]);
    sh.setUniform('u_mask', maskTex ?? ctx.maskPlaceholder.color);
    sh.setUniform('u_maskUse', !!maskTex);

    // Displacement map (карта смещения)
    sh.setUniform('u_disp', dispEntry.tex);
    sh.setUniform('u_dispRes', dispEntry.res);

    // Image to sample from displacement (исходник)
    const imgTex = useSourceMedia ? srcEntry.tex : inputTex;
    const imgRes = useSourceMedia ? srcEntry.res : [ctx.glc.width, ctx.glc.height];
    sh.setUniform('u_img', imgTex);
    sh.setUniform('u_imgRes', imgRes);

    // Displacement mode and weight
    sh.setUniform('u_dispMode', 1);
    sh.setUniform('u_weight', [p.weight.x, p.weight.y]);
    sh.setUniform('u_mode', p.mode);

    // Displacement texture transform
    sh.setUniform('u_scale', p.scale / 100);
    sh.setUniform('u_angle', radians(0));
    sh.setUniform('u_offset', [p.position.x / 100, p.position.y / 100]);
    sh.setUniform('u_wrapMode', p.wrapMode);

    // Source texture transform
    sh.setUniform('u_srcScale', p.scaleSrc / 100);
    sh.setUniform('u_srcAngle', radians(p.rotateSrc));
    sh.setUniform('u_srcOffset', [p.positionSrc.x / 100, p.positionSrc.y / 100]);
    sh.setUniform('u_srcWrapMode', p.wrapModeSrc);

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
