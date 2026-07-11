// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCenterPoint } from '../centerPoint.js';

describe('createCenterPoint', () => {
  let container, onChange, value, pad;
  const AXES = { x: { min: -0.5, max: 0.5, step: 0.01 }, y: { min: -0.5, max: 0.5, step: 0.01 } };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    value = { x: 0, y: 0 };
    onChange = vi.fn((v) => Object.assign(value, v));
    const cp = createCenterPoint({
      container, label: 'Center Point', axes: AXES,
      getValue: () => value, onChange,
    });
    cp.refresh();
    pad = container.querySelector('.center-point-pad');
    // jsdom не считает layout — фиксируем прямоугольник пада
    pad.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100 });
  });

  it('renders pad, knob and two number inputs with current values', () => {
    expect(pad).toBeTruthy();
    expect(container.querySelector('.center-point-knob')).toBeTruthy();
    const nums = container.querySelectorAll('input[type="number"]');
    expect(nums).toHaveLength(2);
    expect(nums[0].value).toBe('0');
  });

  it('pointer press maps pad position to axis ranges (center=0, right/bottom=max)', () => {
    pad.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 0 }));
    expect(onChange).toHaveBeenCalled();
    const v = onChange.mock.calls.at(-1)[0];
    expect(v.x).toBeCloseTo(0.5, 5); // право → x max
    expect(v.y).toBeCloseTo(-0.5, 5); // верх → y min
  });

  it('clamps and steps values', () => {
    pad.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 63, clientY: 63 }));
    const v = onChange.mock.calls.at(-1)[0];
    expect(v.x).toBeCloseTo(0.13, 5); // 0.63→0.13 raw=0.13, шаг 0.01
    expect(Math.round(v.x / 0.01)).toBeCloseTo(v.x / 0.01, 5);
  });

  it('number inputs write through onChange', () => {
    const nums = container.querySelectorAll('input[type="number"]');
    nums[1].value = '0.25';
    nums[1].dispatchEvent(new Event('input', { bubbles: true }));
    expect(onChange.mock.calls.at(-1)[0].y).toBeCloseTo(0.25, 5);
  });
});
