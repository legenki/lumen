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
      // При animating=true p5 loop сам вызывает draw, но если вкладка
      // неактивна или мы только что применили пресет — RAF может «спать».
      // Форсируем немедленный redraw() в обоих режимах; коалесцируем
      // повторные вызовы через `pending` до consumeFrame.
      if (pending) return;
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
