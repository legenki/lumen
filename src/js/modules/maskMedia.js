// Транскрипция пасса maskMedia (bundle-pretty.js:47498-47522).
// type: 'mask' — рисует маску-текстуру в именованный буфер ctx.getBuffer(inst.id)
// и (если у инстанса есть члены) кладёт её на mask-стек через pushMask на N
// следующих пассов (N = inst.maskMembers.length). Сам он не меняет входную
// текстуру цветовой цепочки — маска возвращает inputTex как есть.
import { radians } from './uniformUtils.js';
import { pushMask } from '../maskStack.js';
import { MASK_CHANNELS, WRAP_MODES } from './optionTables.js';

export const maskMedia = {
  key: 'maskMedia',
  label: 'MASK: Media File',
  type: 'mask',
  defaults: {
    image: 'gradient-linear',
    maskRange: { min: 0, max: 100 },
    useChannel: 0,
    invert: false,
    contrast: { min: 0, max: 100 },
    scale: 100,
    rotate: 0,
    position: { x: 0, y: 0 },
    wrapMode: 0,
  },
  controls: [
    { type: 'media', path: 'image', label: 'Texture' },
    { type: 'slider', path: 'maskRange.min', label: 'Mask Threshold Min', min: 0, max: 100, step: 0.1 },
    { type: 'slider', path: 'maskRange.max', label: 'Mask Threshold Max', min: 0, max: 100, step: 0.1 },
    { type: 'select', path: 'useChannel', label: 'Use Channel', options: MASK_CHANNELS },
    { type: 'check', path: 'invert', label: 'Invert Colors' },
    { type: 'slider', path: 'contrast.min', label: 'Contrast Min', min: 0, max: 100, step: 0.1 },
    { type: 'slider', path: 'contrast.max', label: 'Contrast Max', min: 0, max: 100, step: 0.1 },
    { type: 'slider', path: 'scale', label: 'Scale Image', min: 1, max: 250, step: 0.1 },
    { type: 'slider', path: 'rotate', label: 'Rotate Image', min: -180, max: 180, step: 1 },
    {
      type: 'centerPoint',
      path: 'position',
      label: 'Position Offset',
      axes: { x: { min: -50, max: 50, step: 0.1 }, y: { min: -50, max: 50, step: 0.1 } },
    },
    { type: 'select', path: 'wrapMode', label: 'Wrapping Mode', options: WRAP_MODES },
  ],
  run({ ctx, inst, inputTex, env }) {
    const p = inst.params;
    const media = env.media.get(p.image);
    if (!media || !media.ready) return inputTex; // медиа нет/не готово — маска не пушится

    const w = ctx.glc.width;
    const h = ctx.glc.height;
    const buf = ctx.getBuffer(inst.id);

    buf.draw(() => {
      ctx.glc.clear();
      const shader = ctx.shaders.maskMedia;
      ctx.glc.shader(shader);
      shader.setUniform('u_mask', media.tex);
      shader.setUniform('u_maskRes', media.res);
      shader.setUniform('u_compRes', [w, h]);
      shader.setUniform('u_channel', p.useChannel);
      shader.setUniform('u_maskRange', [p.maskRange.min / 100, p.maskRange.max / 100]);
      shader.setUniform('u_wrapMode', p.wrapMode);
      shader.setUniform('u_scale', p.scale / 100);
      shader.setUniform('u_rotate', radians(p.rotate));
      shader.setUniform('u_offset', [p.position.x / 100, p.position.y / 100]);
      shader.setUniform('u_invert', p.invert);
      shader.setUniform('u_contrast', [p.contrast.min / 100, p.contrast.max / 100]);
      ctx.glc.rect(-w / 2, -h / 2, w, h);
    });

    const n = Array.isArray(inst.maskMembers) ? inst.maskMembers.length : 0;
    if (n > 0) {
      pushMask(ctx, { id: inst.id, bufName: inst.id, left: n, tex: buf.color });
    }

    return inputTex; // маска не меняет цепочку цвета
  },
};
