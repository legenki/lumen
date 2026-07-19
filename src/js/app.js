// LUMEN — главный контроллер: fullscreen 2D canvas + WEBGL offscreen pipeline.
// Preview: capped resolution + UNSIGNED_BYTE + draft blur. Export: full res + HALF_FLOAT.
import { bufferSize } from './state.js';
import { PREVIEW_MAX_EDGE } from './perf.js';
import { computeViewport } from './viewport.js';
import { createRenderScheduler } from './scheduler.js';
import { restoreGlModes } from './graphicsModes.js';
import { createPipeline } from './pipeline.js';
import { MODULES } from './modules/index.js';
import { createMediaRegistry } from './media.js';
import { DEFAULT_MEDIA, BLUE_NOISE_URL } from './assets.js';

export function lumenSketch(p, { state, onReady }) {
  let glc = null;
  let pipeline = null;
  let media = null;
  let exporting = false;
  /** 'preview' | 'export' — buffer size + FBO format */
  let qualityMode = 'preview';
  let pausedByVisibility = false;
  const scheduler = createRenderScheduler(p);
  const vp = {};
  const env = {
    width: 0,
    height: 0,
    time: 0,
    frameRate: 30,
    totalFrames: 1,
    media: null,
    textures: { blueNoise: null },
    scaleValue: 1,
    draft: true,
  };

  function totalFrames() {
    return Math.max(1, Math.round(state.rec.length.value * state.rec.frameRate));
  }

  function normalizeFrame(frameIndex) {
    const total = totalFrames();
    const i = Number.isFinite(frameIndex) ? Math.floor(frameIndex) : 0;
    return ((i % total) + total) % total;
  }

  function setFrame(frameIndex) {
    state.runtime.frame = normalizeFrame(frameIndex);
    return state.runtime.frame;
  }

  function fboFormatForMode(mode) {
    // Preview: RGBA8 bandwidth win. Export: HALF_FLOAT for soft gradients/emboss.
    if (mode === 'export') return p.HALF_FLOAT;
    return p.UNSIGNED_BYTE ?? p.HALF_FLOAT;
  }

  function rebuildBuffer(mode = qualityMode) {
    qualityMode = mode;
    const sizeMode = mode === 'export' ? 'export' : 'preview';
    const { width, height } = bufferSize(state.cnv, {
      mode: sizeMode,
      maxEdge: PREVIEW_MAX_EDGE,
    });
    const format = fboFormatForMode(mode);
    const needNewPipeline = !pipeline || pipeline.format !== format;

    if (!glc) {
      glc = p.createGraphics(width, height, p.WEBGL);
      restoreGlModes(glc);
      pipeline = createPipeline(glc, p, { format });
    } else if (glc.width !== width || glc.height !== height || needNewPipeline) {
      if (glc.width !== width || glc.height !== height) {
        glc.resizeCanvas(width, height);
        restoreGlModes(glc);
      }
      if (needNewPipeline) {
        pipeline = createPipeline(glc, p, { format });
      } else {
        pipeline.resizeAll();
      }
    }
    state.runtime.buffer = glc;
    pipeline?.invalidate();
  }

  function renderFrame(frameIndex, opts = {}) {
    const blitScreen = opts.blitScreen !== false;
    const total = totalFrames();
    state.runtime.frame = normalizeFrame(frameIndex);

    env.width = glc.width;
    env.height = glc.height;
    env.frameRate = state.rec.frameRate;
    env.totalFrames = total;
    env.time = state.runtime.frame / total;
    env.scaleValue = state.cnv.scale.value;
    env.draft = qualityMode === 'preview';

    const outTex = pipeline.render(state.stack, env);
    pipeline.present(outTex);

    if (blitScreen) {
      computeViewport({ winW: p.width, winH: p.height, bufW: glc.width, bufH: glc.height }, vp);
      p.clear();
      p.image(glc, vp.x, vp.y, vp.w, vp.h);
    }

    return state.runtime.frame;
  }

  function syncFrameRate() {
    const fps = Math.max(1, state.rec.frameRate || 30);
    if (typeof p.frameRate === 'function') p.frameRate(fps);
  }

  function syncAnimation() {
    syncFrameRate();
    if (document.hidden || exporting) {
      scheduler.setAnimating(false);
      return;
    }
    const wantsAnim = state.cnv.animation &&
      state.stack.some((inst) => inst.enabled && MODULES[inst.module]?.animated);
    scheduler.setAnimating(wantsAnim);
  }

  function setExporting(on) {
    exporting = !!on;
    if (exporting) {
      scheduler.setAnimating(false);
    } else {
      syncAnimation();
    }
  }

  /**
   * Run work at full export resolution + HALF_FLOAT, then restore preview buffer.
   * Used by PNG / MP4 so live preview stays cheap.
   */
  async function withFinalQuality(fn) {
    const wasAnimating = scheduler.isAnimating();
    const savedFrame = state.runtime.frame;
    setExporting(true);
    rebuildBuffer('export');
    try {
      return await fn();
    } finally {
      state.runtime.frame = savedFrame;
      rebuildBuffer('preview');
      setExporting(false);
      scheduler.setAnimating(wasAnimating);
      scheduler.requestRender();
    }
  }

  function invalidatePipeline() {
    pipeline?.invalidate();
  }

  function onVisibility() {
    if (document.hidden) {
      if (scheduler.isAnimating()) {
        pausedByVisibility = true;
        scheduler.setAnimating(false);
      }
    } else if (pausedByVisibility || state.cnv.animation) {
      pausedByVisibility = false;
      syncAnimation();
      scheduler.requestRender();
    }
  }

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    // Canvas is only a viewport blit; panels are DOM. DPR 1 saves a lot on retina.
    p.pixelDensity(1);
    syncFrameRate();
    media = createMediaRegistry(DEFAULT_MEDIA, (url, ok, err) => p.loadImage(url, ok, err));
    env.media = media;
    media.whenReady().then(() => {
      invalidatePipeline();
      scheduler.requestRender();
    });
    p.loadImage(
      BLUE_NOISE_URL,
      (img) => {
        env.textures.blueNoise = img;
        invalidatePipeline();
        scheduler.requestRender();
      },
      () => console.warn('[lumen] blue-noise load failed')
    );
    rebuildBuffer('preview');
    scheduler.init();
    scheduler.requestRender();
    document.addEventListener('visibilitychange', onVisibility);
    if (onReady) {
      onReady({
        scheduler,
        rebuildBuffer: () => rebuildBuffer(qualityMode === 'export' ? 'export' : 'preview'),
        getBuffer: () => glc,
        syncAnimation,
        syncFrameRate,
        invalidatePipeline,
        renderFrame,
        setFrame,
        getFrame: () => state.runtime.frame,
        totalFrames,
        setExporting,
        isExporting: () => exporting,
        withFinalQuality,
        getQualityMode: () => qualityMode,
        getMedia: () => media,
        getP: () => p,
        getEnv: () => env,
      });
    }
  };

  p.draw = () => {
    scheduler.consumeFrame();
    if (exporting) return;
    if (scheduler.isAnimating()) {
      state.runtime.frame = (state.runtime.frame + 1) % totalFrames();
    }
    renderFrame(state.runtime.frame, { blitScreen: true });
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    scheduler.requestRender();
  };
}
