import { describe, it, expect } from 'vitest';
import { isControlVisible, renderInspector } from './inspector.js';

describe('isControlVisible (showIf predicate)', () => {
  it('control without showIf is always visible', () => {
    expect(isControlVisible({ path: 'mix' }, { mix: 1 })).toBe(true);
  });

  it('notEquals: visible when value differs', () => {
    const c = { path: 'abFocus', showIf: { path: 'abMode', notEquals: 0 } };
    expect(isControlVisible(c, { abMode: 1 })).toBe(true);
    expect(isControlVisible(c, { abMode: 0 })).toBe(false);
  });

  it('equals: visible only when value matches', () => {
    const c = { path: 'source', showIf: { path: 'mode', equals: 1 } };
    expect(isControlVisible(c, { mode: 1 })).toBe(true);
    expect(isControlVisible(c, { mode: 0 })).toBe(false);
  });

  it('equals 0 works (falsy value is a valid target)', () => {
    const c = { path: 'freqLow', showIf: { path: 'freqMode', equals: 0 } };
    expect(isControlVisible(c, { freqMode: 0 })).toBe(true);
    expect(isControlVisible(c, { freqMode: 1 })).toBe(false);
  });

  it('in: visible when value is in the array', () => {
    const c = { path: 'center', showIf: { path: 'sineMode', in: [1, 2] } };
    expect(isControlVisible(c, { sineMode: 1 })).toBe(true);
    expect(isControlVisible(c, { sineMode: 2 })).toBe(true);
    expect(isControlVisible(c, { sineMode: 0 })).toBe(false);
  });

  it('resolves nested paths', () => {
    const c = { path: 'x', showIf: { path: 'opts.mode', equals: 2 } };
    expect(isControlVisible(c, { opts: { mode: 2 } })).toBe(true);
    expect(isControlVisible(c, { opts: { mode: 3 } })).toBe(false);
  });
});

describe('renderInspector media control', () => {
  it('renders type=media control as select with media options', () => {
    const root = document.createElement('div');

    const state = {
      stack: [
        {
          id: 'pass1',
          module: 'fillMedia',
          params: {
            image: 'text0',
            blendMode: 0,
            mix: 1,
            scale: 100,
            rotate: 0,
            position: { x: 0, y: 0 },
            wrapMode: 3,
          },
          type: 'pass',
        },
      ],
      ui: { selectedId: 'pass1' },
    };

    renderInspector(root, {
      state,
      onParamChange: () => {},
    });

    const selects = root.querySelectorAll('select');
    const imageSelect = Array.from(selects).find((s) =>
      s.id && s.id.includes('image'),
    );

    expect(imageSelect).toBeTruthy();
    expect(imageSelect.options.length).toBeGreaterThan(1);

    // Check that DEFAULT_MEDIA keys are in options
    const optionValues = Array.from(imageSelect.options).map((opt) => opt.value);
    expect(optionValues).toContain('text0');
    expect(optionValues).toContain('img0');
  });

  it('sets media control value to current parameter', () => {
    const root = document.createElement('div');

    const state = {
      stack: [
        {
          id: 'pass1',
          module: 'fillMedia',
          params: {
            image: 'img2',
            blendMode: 0,
            mix: 1,
            scale: 100,
            rotate: 0,
            position: { x: 0, y: 0 },
            wrapMode: 3,
          },
          type: 'pass',
        },
      ],
      ui: { selectedId: 'pass1' },
    };

    renderInspector(root, {
      state,
      onParamChange: () => {},
    });

    const imageSelect = root.querySelector('select[id*="image"]');
    expect(imageSelect.value).toBe('img2');
  });

  it('updates params when media select changes', () => {
    const root = document.createElement('div');
    const params = {
      image: 'text0',
      blendMode: 0,
      mix: 1,
      scale: 100,
      rotate: 0,
      position: { x: 0, y: 0 },
      wrapMode: 3,
    };

    let changeCount = 0;
    const state = {
      stack: [
        {
          id: 'pass1',
          module: 'fillMedia',
          params,
          type: 'pass',
        },
      ],
      ui: { selectedId: 'pass1' },
    };

    renderInspector(root, {
      state,
      onParamChange: () => {
        changeCount++;
      },
    });

    const imageSelect = root.querySelector('select[id*="image"]');
    imageSelect.value = 'img3';
    imageSelect.dispatchEvent(new Event('change'));

    expect(params.image).toBe('img3');
    expect(changeCount).toBe(1);
  });
});
