// LUMEN — главный контроллер: экранный 2D-canvas на всё окно; WEBGL2-графика
// фиксированного разрешения с пайплайном пассов; шахматка прозрачности под
// результатом (как в старом инструменте); рендер по требованию + анимация.
import { bufferSize } from './state.js';
import { computeViewport } from './viewport.js';
import { createRenderScheduler } from './scheduler.js';
import { restoreGlModes } from './graphicsModes.js';
import { createPipeline } from './pipeline.js';
import { MODULES } from './modules/index.js';
import { createMediaRegistry } from './media.js';
import { DEFAULT_MEDIA, BLUE_NOISE_URL } from './assets.js';

export function lumenSketch(p, { state, onReady }) {
  let glc = null; // WEBGL-графика пайплайна
  let pipeline = null;
  let media = null;
  const scheduler = createRenderScheduler(p);
  const vp = {}; // zero-alloc: переиспользуемый viewport-объект
  const env = {
    width: 0,
    height: 0,
    time: 0,
    frameRate: 60,
    totalFrames: 1,
    media: null,
    textures: { blueNoise: null },
  };

  function totalFrames() {
    return Math.max(1, Math.round(state.rec.length.value * state.rec.frameRate));
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
  }

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
    media = createMediaRegistry(DEFAULT_MEDIA, (url, ok, err) => p.loadImage(url, ok, err));
    env.media = media;
    media.whenReady().then(() => scheduler.requestRender()); // дозарисовка fillMedia
    p.loadImage(
      BLUE_NOISE_URL,
      (img) => {
        env.textures.blueNoise = img;
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
        syncAnimation() {
          const wantsAnim = state.cnv.animation &&
            state.stack.some((inst) => inst.enabled && MODULES[inst.module]?.animated);
          scheduler.setAnimating(wantsAnim);
        },
        getMedia: () => media,
        getP: () => p,
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
    env.scaleValue = state.cnv.scale.value;

    const outTex = pipeline.render(state.stack, env);
    glc.clear();
    glc.image(outTex, -glc.width / 2, -glc.height / 2, glc.width, glc.height);

    computeViewport({ winW: p.width, winH: p.height, bufW: glc.width, bufH: glc.height }, vp);
    p.clear();
    p.image(glc, vp.x, vp.y, vp.w, vp.h);
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    scheduler.requestRender();
  };
}
