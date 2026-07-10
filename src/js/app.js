// LUMEN — главный контроллер: p5 instance mode (AGENTS.md §1), экранный 2D
// canvas на всё окно, offscreen тест-буфер фиксированного разрешения,
// центрирование между панелями, рендер по требованию.
import { bufferSize } from './state.js';
import { computeViewport } from './viewport.js';
import { createRenderScheduler } from './scheduler.js';
import { restoreGraphicsModes } from './graphicsModes.js';

export function lumenSketch(p, { state, onReady }) {
  let buffer = null;
  const scheduler = createRenderScheduler(p);

  function rebuildBuffer() {
    const { width, height } = bufferSize(state.cnv);
    if (!buffer) {
      buffer = p.createGraphics(width, height);
    } else if (buffer.width !== width || buffer.height !== height) {
      buffer.resizeCanvas(width, height);
    }
    restoreGraphicsModes(buffer, p);
    state.runtime.buffer = buffer;
    drawTestPattern();
  }

  // Временный контент фазы 2: шахматка + диагональный градиент, чтобы видеть
  // границы, пропорции и центрирование буфера. Заменяется пайплайном в фазе 3.
  function drawTestPattern() {
    const g = buffer;
    const cell = Math.max(16, Math.round(g.width / 24));
    g.background(244);
    for (let y = 0; y < g.height; y += cell) {
      for (let x = 0; x < g.width; x += cell) {
        if (((x / cell) + (y / cell)) % 2 < 1) {
          g.fill(220);
          g.rect(x, y, cell, cell);
        }
      }
    }
    for (let x = 0; x < g.width; x += 2) {
      const t = x / g.width;
      g.fill(17 + t * 180, 17, 120 - t * 100, 160);
      g.rect(x, 0, 2, g.height * 0.12);
    }
    g.fill(17);
    g.rect(0, 0, g.width, 4);
    g.rect(0, g.height - 4, g.width, 4);
    g.rect(0, 0, 4, g.height);
    g.rect(g.width - 4, 0, 4, g.height);
  }

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
    rebuildBuffer();
    scheduler.init();
    scheduler.setAnimating(false); // фаза 2: анимации ещё нет
    scheduler.requestRender();
    if (onReady) onReady({ scheduler, rebuildBuffer, getBuffer: () => buffer });
  };

  p.draw = () => {
    scheduler.consumeFrame();
    p.clear();
    const v = computeViewport({
      winW: p.width, winH: p.height,
      bufW: buffer.width, bufH: buffer.height,
    });
    p.image(buffer, v.x, v.y, v.w, v.h);
    state.runtime.frame++;
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    scheduler.requestRender();
  };
}
