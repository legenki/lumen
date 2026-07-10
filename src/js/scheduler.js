// LUMEN — рендер по требованию вместо вечного RAF старого инструмента
// (reference/filtr/architecture.md §8.1). p5 живёт в noLoop; изменения
// состояния зовут requestRender(); анимация переключает в loop().

export function createRenderScheduler(p) {
  let animating = false;
  let pending = false;

  return {
    init() {
      p.noLoop();
    },
    requestRender() {
      if (animating || pending) return;
      pending = true;
      p.redraw();
    },
    /** Вызывается из p.draw() в начале кадра. */
    consumeFrame() {
      pending = false;
    },
    setAnimating(on) {
      animating = !!on;
      if (on) p.loop();
      else p.noLoop();
    },
    isAnimating: () => animating,
  };
}
