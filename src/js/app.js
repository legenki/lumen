// LUMEN — главный контроллер: экранный 2D-canvas на всё окно; WEBGL2-графика
// фиксированного разрешения с пайплайном пассов; шахматка прозрачности под
// результатом (как в старом инструменте); рендер по требованию + анимация.
//
// Контракт времени (паритет filtr renderFrame):
//   setFrame(i) / renderFrame(i) — абсолютный курсор → env.time = frame / totalFrames.
//   Preview (loop) инкрементирует frame только когда animating && !exporting.
//   Export вызывает renderFrame(i, { blitScreen: false }) без fullscreen blit.
import { bufferSize } from './state.js';
import { computeViewport } from './viewport.js';
import { createRenderScheduler } from './scheduler.js';
import { restoreGlModes } from './graphicsModes.js';
import { createPipeline } from './pipeline.js';
import { MODULES } from './modules/index.js';
import { createMediaRegistry } from './media.js';
import { DEFAULT_MEDIA, BLUE_NOISE_URL } from './assets.js';
import { createAlphaImage } from '../shared/utils/alphaCheckerboard.js';

export function lumenSketch(p, { state, onReady }) {
  let glc = null; // WEBGL-графика пайплайна
  let pipeline = null;
  let media = null;
  let alphaImg = null;
  let alphaKey = '';
  let exporting = false;
  const scheduler = createRenderScheduler(p);
  const vp = {}; // zero-alloc: переиспользуемый viewport-объект
  const env = {
    width: 0,
    height: 0,
    time: 0,
    frameRate: 30,
    totalFrames: 1,
    media: null,
    textures: { blueNoise: null },
    scaleValue: 1,
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

  function ensureAlpha(w, h) {
    const key = `${w}x${h}`;
    if (alphaImg && alphaKey === key) return alphaImg;
    if (alphaImg) {
      try { alphaImg.remove(); } catch { /* p5 graphics may already be gone */ }
    }
    alphaImg = createAlphaImage(p, w, h, 1);
    alphaKey = key;
    return alphaImg;
  }

  function rebuildBuffer() {
    const { width, height } = bufferSize(state.cnv);
    if (!glc) {
      glc = p.createGraphics(width, height, p.WEBGL);
      restoreGlModes(glc);
      pipeline = createPipeline(glc, p);
    } else if (glc.width !== width || glc.height !== height) {
      glc.resizeCanvas(width, height);
      restoreGlModes(glc);
      pipeline.resizeAll();
    }
    state.runtime.buffer = glc;
    pipeline?.invalidate();
  }

  /**
   * Рендерит один абсолютный кадр в WEBGL-буфер.
   * @param {number} frameIndex
   * @param {{ blitScreen?: boolean }} [opts]
   *   blitScreen — рисовать результат на fullscreen 2D canvas (preview).
   *   false при экспорте: только glc, без viewport composite.
   */
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

    const outTex = pipeline.render(state.stack, env);
    glc.clear();
    glc.image(outTex, -glc.width / 2, -glc.height / 2, glc.width, glc.height);

    if (blitScreen) {
      computeViewport({ winW: p.width, winH: p.height, bufW: glc.width, bufH: glc.height }, vp);
      p.clear();
      // Шахматка под прозрачными областями (только preview, не в экспорт).
      if (state.ui?.showCheckerboard !== false) {
        const bw = Math.max(1, Math.round(vp.w));
        const bh = Math.max(1, Math.round(vp.h));
        const board = ensureAlpha(bw, bh);
        p.image(board, vp.x, vp.y, vp.w, vp.h);
      }
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
    const wantsAnim = !exporting &&
      state.cnv.animation &&
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

  function invalidatePipeline() {
    pipeline?.invalidate();
  }

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
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
    rebuildBuffer();
    scheduler.init();
    scheduler.requestRender();
    if (onReady) {
      onReady({
        scheduler,
        rebuildBuffer,
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
        getMedia: () => media,
        getP: () => p,
        getEnv: () => env,
      });
    }
  };

  p.draw = () => {
    scheduler.consumeFrame();
    // Во время экспорта draw не должен крутиться (noLoop), но на всякий случай
    // не инкрементируем кадр и не блитим лишний раз.
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
