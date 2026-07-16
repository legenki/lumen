import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildMediaSection } from './mediaPanel.js';

function fakeMediaRegistry(initial = []) {
  const entries = new Map(initial.map((e) => [e.key, e]));
  let counter = 0;
  return {
    keys: () => Array.from(entries.keys()),
    get: (key) => entries.get(key),
    add({ url, name, width, height, tex = null }) {
      counter += 1;
      const key = `user_${counter}`;
      const entry = { key, url, name, width, height, tex, user: true, ready: true, res: [width, height] };
      entries.set(key, entry);
      return entry;
    },
    remove(key) {
      entries.delete(key);
    },
  };
}

function fakeP({ img = { width: 10, height: 20 }, fail = false } = {}) {
  return {
    loadImage: vi.fn((url, ok, err) => {
      if (fail) err(new Error('load failed'));
      else ok(img);
    }),
  };
}

describe('buildMediaSection', () => {
  let root;
  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
    if (!URL.createObjectURL) URL.createObjectURL = vi.fn(() => 'blob:mock');
    if (!URL.revokeObjectURL) URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => {
    root.remove();
    document.querySelectorAll('.media-modal-overlay').forEach((el) => el.remove());
  });

  it('renders button "Add / Remove Media Files" in the left panel', () => {
    const media = fakeMediaRegistry([{ key: 'img0', url: 'x', name: 'img0', user: false }]);
    buildMediaSection(root, { p: fakeP(), media, onChange: vi.fn() });
    const btn = root.querySelector('#lm-media-open');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toBe('Add / Remove Media Files');
  });

  it('opens modal overlay when button is clicked', () => {
    const media = fakeMediaRegistry([{ key: 'img0', url: 'x', name: 'img0', user: false }]);
    buildMediaSection(root, { p: fakeP(), media, onChange: vi.fn() });
    root.querySelector('#lm-media-open').click();
    const overlay = document.querySelector('.media-modal-overlay');
    expect(overlay.classList.contains('active')).toBe(true);
  });

  it('shows all media entries (both default and user) in the modal grid', () => {
    const media = fakeMediaRegistry([
      { key: 'img0', url: 'x', name: 'img0', user: false },
      { key: 'white', url: 'y', name: 'white', user: false },
    ]);
    media.add({ url: 'blob:a', name: 'Photo.png', width: 10, height: 10 });
    buildMediaSection(root, { p: fakeP(), media, onChange: vi.fn() });
    root.querySelector('#lm-media-open').click();
    const cells = document.querySelectorAll('.media-cell');
    expect(cells.length).toBe(3);
  });

  it('displays human-readable names for built-in media', () => {
    const media = fakeMediaRegistry([
      { key: 'white', url: 'y', name: 'white', user: false },
    ]);
    buildMediaSection(root, { p: fakeP(), media, onChange: vi.fn() });
    root.querySelector('#lm-media-open').click();
    const labels = Array.from(document.querySelectorAll('.media-cell-label')).map((el) => el.textContent);
    expect(labels).toContain('White Fill');
  });

  it('clicking Upload Media triggers the hidden file input', () => {
    const media = fakeMediaRegistry();
    buildMediaSection(root, { p: fakeP(), media, onChange: vi.fn() });
    root.querySelector('#lm-media-open').click();
    const input = document.querySelector('#lm-media-file');
    const spy = vi.spyOn(input, 'click');
    document.querySelector('#lm-media-upload-btn').click();
    expect(spy).toHaveBeenCalled();
  });

  it('selecting a file loads it via p.loadImage and calls media.add', () => {
    const media = fakeMediaRegistry();
    const p = fakeP({ img: { width: 640, height: 400 } });
    const onChange = vi.fn();
    buildMediaSection(root, { p, media, onChange });
    root.querySelector('#lm-media-open').click();

    const input = document.querySelector('#lm-media-file');
    const file = new File(['data'], 'Photo.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));

    expect(p.loadImage).toHaveBeenCalled();
    expect(media.keys()).toHaveLength(1);
    const entry = media.get(media.keys()[0]);
    expect(entry.name).toBe('Photo.png');
    expect(entry.width).toBe(640);
    expect(onChange).toHaveBeenCalled();
  });

  it('clicking remove button on a cell calls media.remove and refreshes grid', () => {
    const media = fakeMediaRegistry();
    const onChange = vi.fn();
    media.add({ url: 'blob:a', name: 'A.png', width: 2, height: 2 });
    buildMediaSection(root, { p: fakeP(), media, onChange });
    root.querySelector('#lm-media-open').click();

    const removeBtn = document.querySelector('.media-cell-remove');
    expect(removeBtn).toBeTruthy();
    removeBtn.click();

    expect(media.keys()).toHaveLength(0);
    expect(onChange).toHaveBeenCalled();
    expect(document.querySelectorAll('.media-cell').length).toBe(0);
  });

  it('closes modal when clicking overlay background', () => {
    const media = fakeMediaRegistry();
    buildMediaSection(root, { p: fakeP(), media, onChange: vi.fn() });
    root.querySelector('#lm-media-open').click();
    const overlay = document.querySelector('.media-modal-overlay');
    expect(overlay.classList.contains('active')).toBe(true);
    overlay.click();
    expect(overlay.classList.contains('active')).toBe(false);
  });
});
