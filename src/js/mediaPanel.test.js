// LUMEN — тесты секции Media (левая панель): рендер пустого состояния,
// добавление user-изображения через file picker, удаление слота, фильтрация
// DEFAULT_MEDIA (не-user записи в списке не показываются).
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
  });

  it('renders empty state when there are no user media entries', () => {
    const media = fakeMediaRegistry([{ key: 'img0', url: 'x', name: 'img0', user: false }]);
    buildMediaSection(root, { p: fakeP(), media, onChange: vi.fn() });
    expect(root.textContent).toContain('No user images loaded yet.');
  });

  it('does not list non-user (default) media entries', () => {
    const media = fakeMediaRegistry([
      { key: 'img0', url: 'x', name: 'img0', user: false },
      { key: 'text0', url: 'y', name: 'text0', user: false },
    ]);
    buildMediaSection(root, { p: fakeP(), media, onChange: vi.fn() });
    expect(root.querySelectorAll('.media-row').length).toBe(0);
  });

  it('clicking Add Image triggers the hidden file input click', () => {
    const media = fakeMediaRegistry();
    buildMediaSection(root, { p: fakeP(), media, onChange: vi.fn() });
    const input = root.querySelector('#lm-media-file');
    const spy = vi.spyOn(input, 'click');
    root.querySelector('#lm-media-add').click();
    expect(spy).toHaveBeenCalled();
  });

  it('selecting a file loads it via p.loadImage and calls media.add with width/height from the image', () => {
    const media = fakeMediaRegistry();
    const p = fakeP({ img: { width: 640, height: 400 } });
    const onChange = vi.fn();
    buildMediaSection(root, { p, media, onChange });

    const input = root.querySelector('#lm-media-file');
    const file = new File(['data'], 'Photo.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));

    expect(p.loadImage).toHaveBeenCalled();
    expect(media.keys()).toHaveLength(1);
    const entry = media.get(media.keys()[0]);
    expect(entry.name).toBe('Photo.png');
    expect(entry.width).toBe(640);
    expect(entry.height).toBe(400);
    expect(onChange).toHaveBeenCalled();

    // list should now show the new user row
    expect(root.querySelectorAll('.media-row').length).toBe(1);
    expect(root.textContent).toContain('Photo.png');
  });

  it('clicking the remove (x) button on a row calls media.remove and onChange, and refreshes the list', () => {
    const media = fakeMediaRegistry();
    const onChange = vi.fn();
    const panel = buildMediaSection(root, { p: fakeP(), media, onChange });
    media.add({ url: 'blob:a', name: 'A.png', width: 2, height: 2 });
    panel.refresh();

    const removeBtn = root.querySelector('.media-remove');
    expect(removeBtn).toBeTruthy();
    removeBtn.click();

    expect(media.keys()).toHaveLength(0);
    expect(onChange).toHaveBeenCalled();
    expect(root.textContent).toContain('No user images loaded yet.');
  });

  it('media.keys() may include non-user default keys, but the visible list shows only user entries', () => {
    const media = fakeMediaRegistry([
      { key: 'img0', url: 'x', name: 'img0', user: false },
    ]);
    const panel = buildMediaSection(root, { p: fakeP(), media, onChange: vi.fn() });
    media.add({ url: 'blob:b', name: 'B.png', width: 3, height: 3 });
    panel.refresh();

    expect(media.keys()).toEqual(expect.arrayContaining(['img0']));
    const rows = Array.from(root.querySelectorAll('.media-key')).map((el) => el.textContent);
    expect(rows).toEqual(['B.png']);
  });
});
