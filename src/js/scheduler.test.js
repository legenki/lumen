import { describe, it, expect, vi } from 'vitest';
import { createRenderScheduler } from './scheduler.js';

// Контракт (architecture.md §8.1 — антипаттерн старого кода, вечный RAF):
// p5 держится в noLoop; requestRender() вызывает redraw() максимум один раз
// на кадр; setAnimating(true) включает loop() для анимации, false — noLoop().
function fakeP5() {
  return { redraw: vi.fn(), loop: vi.fn(), noLoop: vi.fn() };
}

describe('createRenderScheduler', () => {
  it('starts paused (noLoop) via init', () => {
    const p = fakeP5();
    const s = createRenderScheduler(p);
    s.init();
    expect(p.noLoop).toHaveBeenCalledOnce();
  });
  it('requestRender triggers a single redraw while paused', () => {
    const p = fakeP5();
    const s = createRenderScheduler(p);
    s.init();
    s.requestRender();
    s.requestRender(); // коалесцируется до consumeFrame
    expect(p.redraw).toHaveBeenCalledTimes(1);
    s.consumeFrame();
    s.requestRender();
    expect(p.redraw).toHaveBeenCalledTimes(2);
  });
  it('does not call redraw while animating (loop is running)', () => {
    const p = fakeP5();
    const s = createRenderScheduler(p);
    s.init();
    s.setAnimating(true);
    expect(p.loop).toHaveBeenCalledOnce();
    s.requestRender();
    expect(p.redraw).not.toHaveBeenCalled();
  });
  it('setAnimating(false) returns to noLoop', () => {
    const p = fakeP5();
    const s = createRenderScheduler(p);
    s.init();
    s.setAnimating(true);
    s.setAnimating(false);
    expect(p.noLoop).toHaveBeenCalledTimes(2); // init + off
  });
  it('exposes animating state for the draw loop', () => {
    const p = fakeP5();
    const s = createRenderScheduler(p);
    s.init();
    expect(s.isAnimating()).toBe(false);
    s.setAnimating(true);
    expect(s.isAnimating()).toBe(true);
  });
});
