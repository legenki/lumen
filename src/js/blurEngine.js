// LUMEN — блюр-движок: дословная транскрипция класса iIA
// (bundle-pretty.js:88737-88846). Двухпроходный сепарабельный Gaussian
// с curved-даунсемплингом (anti-overflow), motion-блюр (однопроходный
// направленный) и copy/композит через blurComp.frag.
//
// HALF_FLOAT — через КОРНЕВОЙ p5-инстанс `p` (НЕ glc.HALF_FLOAT: константы
// на p5.Graphics не определены — тот же нюанс, что в pipeline.js/graphicsModes.js).

const FASTKERNEL_SIGMA_PCT = 0.015;
const AUTO_MIN_SCALE_DEFAULT = 1;
const SCALE_CURVE_EXP_DEFAULT = 0.001;
const SHADER_MAX_RADIUS_PX = 480;

/** Аналог Ii(p5) бандла: 1×1 непрозрачно-белая заглушка для u_mask, когда маска не используется. */
function createMaskPlaceholder(glc) {
  const fbo = glc.createFramebuffer({ width: 1, height: 1, depth: false });
  fbo.draw(() => glc.clear(1, 1, 1, 1));
  return fbo.color;
}

export function createBlurEngine(glc, p, shaders) {
  const shCopy = shaders.blurComp;
  const shBlur = shaders.blurGaussianDir;
  const maskPlaceholder = createMaskPlaceholder(glc);

  let w = glc.width;
  let h = glc.height;
  const stage = glc.createFramebuffer({
    width: w,
    height: h,
    format: p.HALF_FLOAT,
    depth: false,
    antialias: false,
  });

  function sigmaToPx(sigma, minDim) {
    return Math.max(0, Math.min(1, sigma)) * minDim;
  }

  function scaleBySigmaPxCurved(sigmaPx, minDim, minScaleOpt) {
    const minScale =
      typeof minScaleOpt === 'number'
        ? Math.max(0.001, Math.min(1, minScaleOpt))
        : AUTO_MIN_SCALE_DEFAULT;
    const r = Math.max(0, Math.min(1, sigmaPx / Math.max(1, minDim)));
    return 1 - (1 - minScale) * Math.pow(r, SCALE_CURVE_EXP_DEFAULT);
  }

  const tempFbos = { tmpH: null, tmpHV: null };
  function ensureTempFbo(name, tw, th) {
    const nw = Math.max(1, Math.round(tw));
    const nh = Math.max(1, Math.round(th));
    const existing = tempFbos[name];
    if (existing) {
      if (existing.width !== nw || existing.height !== nh) existing.resize(nw, nh);
      return existing;
    }
    const fbo = glc.createFramebuffer({
      width: nw,
      height: nh,
      format: p.HALF_FLOAT,
      depth: false,
      antialias: false,
    });
    tempFbos[name] = fbo;
    return fbo;
  }

  function blurResampled(tex, srcW, srcH, target, dstW, dstH, dir, sigmaPx, radiusPx, inputIsPremult, fastKernel, maskTex) {
    const hasMask = !!maskTex;
    target.begin();
    glc.clear();
    glc.textureWrap(p.CLAMP);
    glc.shader(shBlur);
    if (tex && typeof tex !== 'number') shBlur.setUniform('u_tex', tex);
    shBlur.setUniform('u_res', [srcW, srcH]);
    shBlur.setUniform('u_dir', dir);
    shBlur.setUniform('u_sigmaPx', sigmaPx);
    shBlur.setUniform('u_radiusPx', Math.ceil(radiusPx));
    shBlur.setUniform('u_inputIsPremult', !!inputIsPremult);
    shBlur.setUniform('u_fastKernel', !!fastKernel);
    shBlur.setUniform('u_maskUse', hasMask);
    const mtex = hasMask ? maskTex : maskPlaceholder;
    if (mtex && typeof mtex !== 'number') shBlur.setUniform('u_mask', mtex);
    glc.rect(-dstW / 2, -dstH / 2, dstW, dstH);
    target.end();
  }

  function copy(tex, target, dstW = w, dstH = h, opts = {}) {
    const baseTex = opts.baseTex ?? null;
    const mix = Math.max(0, Math.min(1, opts.mix ?? 1));
    const blendMode = opts.blendMode ?? 0;
    const useSrc = !!baseTex;
    target.begin();
    glc.clear();
    glc.textureWrap(p.CLAMP);
    glc.shader(shCopy);
    if (tex && typeof tex !== 'number') shCopy.setUniform('u_tex', tex);
    shCopy.setUniform('u_useSrc', useSrc);
    shCopy.setUniform('u_mix', mix);
    shCopy.setUniform('u_blendMode', blendMode | 0);
    if (useSrc && baseTex && typeof baseTex !== 'number') shCopy.setUniform('u_src', baseTex);
    glc.rect(-dstW / 2, -dstH / 2, dstW, dstH);
    target.end();
  }

  function resize(nw, nh) {
    w = nw;
    h = nh;
    stage.resize(nw, nh);
    tempFbos.tmpH = null;
    tempFbos.tmpHV = null;
  }

  function gaussian(inputTex, target, opts = {}) {
    const srcW = opts.srcW ?? w;
    const srcH = opts.srcH ?? h;
    const minDim = typeof opts.minDimOverride === 'number' ? opts.minDimOverride : Math.max(1, (srcW + srcH) / 2);
    const inputIsPremult = !!opts.inputIsPremult;
    const maskTex = opts.mask ?? null;
    const sigmaPx = sigmaToPx(opts.sigma, minDim);
    const aspect = Math.max(-1, Math.min(1, opts.aspect ?? 0));
    const aspectScale = Math.pow(2, aspect * 2);
    const sigmaPxH = sigmaPx * aspectScale;
    const sigmaPxV = sigmaPx / aspectScale;
    const fastKernel =
      sigmaPxH >= FASTKERNEL_SIGMA_PCT * minDim || sigmaPxV >= FASTKERNEL_SIGMA_PCT * minDim;
    const mix = Math.max(0, Math.min(1, opts.mix ?? 1));
    const blendMode = opts.blendMode ?? 0;
    const needsComposite = mix < 1 || blendMode !== 0;
    const scaleH = scaleBySigmaPxCurved(sigmaPxH, minDim, opts.minScale);
    const scaleV = scaleBySigmaPxCurved(sigmaPxV, minDim, opts.minScale);
    const maxRadiusScale = (SHADER_MAX_RADIUS_PX - 0.5) / 3;
    const antiOverflow = (sigmaPxDir, scale) => {
      if (sigmaPxDir <= 0) return scale;
      const limit = maxRadiusScale / (sigmaPxDir * scale);
      return limit < 1 ? scale * Math.max(limit, 1e-4) : scale;
    };
    const finalScaleH = antiOverflow(sigmaPxH, scaleH);
    const finalScaleV = antiOverflow(sigmaPxV, scaleV);
    // tmpH: downsampled только по X (F×this.h); tmpHV: тот же F по X, downsampled по Y (F×N).
    const tmpHW = Math.max(1, Math.round(w * finalScaleH));
    const tmpHH = h;
    const tmpHVW = tmpHW;
    const tmpHVH = Math.max(1, Math.round(h * finalScaleV));

    const bufH = ensureTempFbo('tmpH', tmpHW, tmpHH);
    const bufHV = ensureTempFbo('tmpHV', tmpHVW, tmpHVH);

    const sigmaPxHScaled = sigmaPxH * finalScaleH;
    const sigmaPxVScaled = sigmaPxV * finalScaleV;

    blurResampled(inputTex, srcW, srcH, bufH, tmpHW, tmpHH, [1, 0], sigmaPxHScaled, 3 * sigmaPxHScaled, inputIsPremult, fastKernel, maskTex);
    blurResampled(bufH.color, tmpHW, tmpHH, bufHV, tmpHVW, tmpHVH, [0, 1], sigmaPxVScaled, 3 * sigmaPxVScaled, inputIsPremult, fastKernel, maskTex);

    const selfTarget = target.color === inputTex;
    const dest = selfTarget ? stage : target;
    if (needsComposite) {
      copy(bufHV.color, dest, w, h, { baseTex: inputTex, mix, blendMode });
    } else {
      copy(bufHV.color, dest, w, h);
    }
    if (selfTarget) copy(stage.color, target, w, h);
  }

  function motion(inputTex, target, opts = {}) {
    const srcW = opts.srcW ?? w;
    const srcH = opts.srcH ?? h;
    const minDim = Math.max(1, (srcW + srcH) / 2);
    const inputIsPremult = !!opts.inputIsPremult;
    const sigmaPx = sigmaToPx(opts.sigma, minDim);
    const fastKernel = sigmaPx >= FASTKERNEL_SIGMA_PCT * minDim;
    const angleRad = ((opts.angleDeg ?? 0) * Math.PI) / 180;
    const dir = [Math.cos(angleRad), Math.sin(angleRad)];
    const selfTarget = target.color === inputTex;
    const mix = Math.max(0, Math.min(1, opts.mix ?? 1));
    const blendMode = opts.blendMode ?? 0;
    const needsComposite = mix < 1 || blendMode !== 0;
    const dest = selfTarget || needsComposite ? stage : target;
    const finalDest = selfTarget ? ensureTempFbo('tmpHV', w, h) : target;
    const maskTex = opts.mask ?? null;

    blurResampled(inputTex, srcW, srcH, dest, w, h, dir, sigmaPx, 3 * sigmaPx, inputIsPremult, fastKernel, maskTex);
    if (needsComposite) {
      copy(dest.color, finalDest, w, h, { baseTex: inputTex, mix, blendMode });
    } else if (dest !== finalDest) {
      copy(dest.color, finalDest, w, h);
    }
    if (selfTarget) copy(finalDest.color, target, w, h);
  }

  return { gaussian, motion, copy, resize };
}
