// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGradientMapper } from '../gradientMapper.js';

describe('createGradientMapper', () => {
  let container, onChange, gradient, gm, strip;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    gradient = [
      { time: 0, value: { r: 255, g: 255, b: 255, a: 1 } },
      { time: 1, value: { r: 0, g: 0, b: 0, a: 1 } },
    ];
    onChange = vi.fn();
    gm = createGradientMapper({
      container, label: 'Gradient',
      getStops: () => gradient, onChange,
    });
    gm.refresh();
    strip = container.querySelector('.gradient-strip');
    strip.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 20, right: 200, bottom: 20 });
  });

  it('renders a marker per stop and a preview strip', () => {
    expect(container.querySelectorAll('.gradient-marker')).toHaveLength(2);
    expect(strip.style.background).toContain('linear-gradient');
  });

  it('double-click on strip adds an interpolated stop and fires onChange', () => {
    strip.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, clientX: 100, clientY: 10 }));
    expect(gradient).toHaveLength(3);
    expect(gradient[1].time).toBeCloseTo(0.5, 2);
    expect(onChange).toHaveBeenCalled();
  });

  it('selecting a marker exposes color/alpha editors; remove honors min-2', () => {
    const markers = container.querySelectorAll('.gradient-marker');
    markers[0].dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 0, clientY: 10 }));
    markers[0].dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
    const removeBtn = container.querySelector('.gradient-remove');
    expect(removeBtn).toBeTruthy();
    removeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(gradient).toHaveLength(2); // ниже минимума не удаляет
  });

  it('color input edits selected stop (0-255 channels preserved)', () => {
    container.querySelectorAll('.gradient-marker')[0]
      .dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 0, clientY: 10 }));
    const color = container.querySelector('.gradient-editor input[type="color"]');
    color.value = '#ff0000';
    color.dispatchEvent(new Event('input', { bubbles: true }));
    expect(gradient[0].value).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(onChange).toHaveBeenCalled();
  });

  it('dragging a marker moves its time (clamped)', () => {
    const m = container.querySelectorAll('.gradient-marker')[0];
    m.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 0, clientY: 10 }));
    strip.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 60, clientY: 10 }));
    strip.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
    expect(gradient.some((s) => Math.abs(s.time - 0.3) < 0.02)).toBe(true);
  });
});
