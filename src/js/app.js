// LUMEN — главный контроллер: экранный 2D-canvas на всё окно; WEBGL2-графика
// фиксированного разрешения с пайплайном пассов; шахматка прозрачности под
// результатом (как в старом инструменте); рендер по требованию + анимация.
import { bufferSize } from './state.js';
import { computeViewport } from './viewport.js';
import { createRenderScheduler } from './scheduler.js';
import { restoreGlModes } from './graphicsModes.js';
import { createPipeline } from './pipeline.js';
import { createMediaRegistry } from './media.js';
import { DEFAULT_MEDIA } from './assets.js';
import { createAlphaImage } from '../shared/utils/alphaCheckerboard.js';

export function lumenSketch(p, { state, onReady }) {
  let glc = null; // WEBGL-графика пайплайна
  let pipeline = null;
  let media = null;
  let alphaImg = null;
  const scheduler = createRenderScheduler(p);
  const vp = {}; // zero-alloc: переиспользуемый viewport-объект
  const env = { width: 0, height: 0, time: 0, frameRate: 60, totalFrames: 1, media: null };

  function totalFrames() {
    return Math.max(1, Math.round(state.rec.length.value * state.rec.frameRate));
  }

  function rebuildBuffer() {
    const { width, height } = bufferSize(state.cnv);
    if (!glc) {
      glc = p.createGraphics(width, height, p.WEBGL);
      restoreGlModes(glc);
      pipeline = createPipeline(glc);
    } else if (glc.width !== width || glc.height !== height) {
      glc.resizeCanvas(width, height);
      restoreGlModes(glc); // FBO p5 автоследуют размеру канваса
    }
    if (alphaImg) alphaImg.remove();
    alphaImg = createAlphaImage(p, width, height, 1);
    state.runtime.buffer = glc;
  }

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
    media = createMediaRegistry(DEFAULT_MEDIA, (url, ok, err) => p.loadImage(url, ok, err));
    env.media = media;
    media.whenReady().then(() => scheduler.requestRender()); // дозарисовка fillMedia
    rebuildBuffer();
    scheduler.init();
    scheduler.setAnimating(state.cnv.animation);
    scheduler.requestRender();
    if (onReady) {
      onReady({
        scheduler,
        rebuildBuffer,
        getBuffer: () => glc,
        syncAnimation: () => scheduler.setAnimating(state.cnv.animation),
      });
    }
  };

  p.draw = () => {
    scheduler.consumeFrame();
    if (scheduler.isAnimating()) {
      state.runtime.frame = (state.runtime.frame + 1) % totalFrames();
    }
    env.width = glc.width;
    env.height = glc.height;
    env.frameRate = state.rec.frameRate;
    env.totalFrames = totalFrames();
    env.time = state.runtime.frame / env.totalFrames;

    const outTex = pipeline.render(state.stack, env);
    glc.clear();
    glc.image(outTex, -glc.width / 2, -glc.height / 2, glc.width, glc.height);

    computeViewport({ winW: p.width, winH: p.height, bufW: glc.width, bufH: glc.height }, vp);
    p.clear();
    p.image(alphaImg, vp.x, vp.y, vp.w, vp.h);
    p.image(glc, vp.x, vp.y, vp.w, vp.h);
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    scheduler.requestRender();
  };
}
