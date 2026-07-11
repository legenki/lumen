// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLayerList } from '../layerList.js';

function rows() {
  return [
    { id: 'p01', label: 'Fill: Gradient', enabled: true, isMask: false, indent: false, badge: 0 },
    { id: 'p02', label: 'MASK: Media File', enabled: true, isMask: true, indent: false, badge: 2 },
    { id: 'p03', label: 'Fill: Color', enabled: false, isMask: false, indent: true, badge: 0 },
  ];
}

describe('createLayerList', () => {
  let container, cb, list, layers, selectedId;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    layers = rows();
    selectedId = 'p01';
    cb = {
      onSelect: vi.fn(), onToggle: vi.fn(), onDuplicate: vi.fn(),
      onRemove: vi.fn(), onReorder: vi.fn(),
    };
    list = createLayerList({
      container,
      getLayers: () => layers,
      getSelectedId: () => selectedId,
      callbacks: cb,
    });
    list.refresh();
  });

  it('renders one row per layer with label, selection and disabled state', () => {
    const items = container.querySelectorAll('.layer-row');
    expect(items).toHaveLength(3);
    expect(items[0].textContent).toContain('Fill: Gradient');
    expect(items[0].classList.contains('is-selected')).toBe(true);
    expect(items[2].classList.contains('is-disabled')).toBe(true);
  });

  it('renders mask badge and member indent classes', () => {
    const items = container.querySelectorAll('.layer-row');
    expect(items[1].classList.contains('is-mask')).toBe(true);
    expect(items[1].querySelector('.layer-badge').textContent).toBe('2');
    expect(items[2].classList.contains('is-mask-affected')).toBe(true);
  });

  it('click on a row selects it (but clicks on action buttons do not select)', () => {
    const items = container.querySelectorAll('.layer-row');
    items[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(cb.onSelect).toHaveBeenCalledWith('p02');
    cb.onSelect.mockClear();
    items[0].querySelector('.layer-act-remove').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(cb.onRemove).toHaveBeenCalledWith('p01');
    expect(cb.onSelect).not.toHaveBeenCalled();
  });

  it('toggle and duplicate buttons fire their callbacks', () => {
    const row = container.querySelectorAll('.layer-row')[2];
    row.querySelector('.layer-act-toggle').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(cb.onToggle).toHaveBeenCalledWith('p03');
    row.querySelector('.layer-act-duplicate').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(cb.onDuplicate).toHaveBeenCalledWith('p03');
  });

  it('drag & drop reorders via onReorder(fromIndex, toIndex, mode)', () => {
    const items = container.querySelectorAll('.layer-row');
    items[2].getBoundingClientRect = () => ({ top: 0, left: 0, width: 100, height: 40, right: 100, bottom: 40 });
    const dt = { setData: vi.fn(), getData: vi.fn(() => '0'), effectAllowed: '' };
    items[0].dispatchEvent(Object.assign(new Event('dragstart', { bubbles: true }), { dataTransfer: dt }));
    items[2].dispatchEvent(Object.assign(new MouseEvent('dragover', { bubbles: true, cancelable: true, clientY: 5 }), { dataTransfer: dt }));
    items[2].dispatchEvent(Object.assign(new MouseEvent('drop', { bubbles: true, clientY: 5 }), { dataTransfer: dt }));
    expect(cb.onReorder).toHaveBeenCalledWith(0, 2, 'above');
  });

  it('emits onReorder with mode "into" when dropping in the middle of a mask row', () => {
    layers = [
      { id: 'p01', label: 'Fill: Color', enabled: true, isMask: false, indent: false, badge: 0 },
      { id: 'p02', label: 'MASK', enabled: true, isMask: true, indent: false, badge: 0 },
    ];
    list.refresh();
    const items = container.querySelectorAll('.layer-row');
    items[1].getBoundingClientRect = () => ({ top: 0, left: 0, width: 100, height: 40, right: 100, bottom: 40 });
    const dt = { setData: vi.fn(), getData: vi.fn(() => '0'), effectAllowed: '' };
    items[0].dispatchEvent(Object.assign(new Event('dragstart', { bubbles: true }), { dataTransfer: dt }));
    items[1].dispatchEvent(Object.assign(new MouseEvent('dragover', { bubbles: true, cancelable: true, clientY: 20 }), { dataTransfer: dt }));
    items[1].dispatchEvent(Object.assign(new MouseEvent('drop', { bubbles: true, clientY: 20 }), { dataTransfer: dt }));
    expect(cb.onReorder).toHaveBeenCalledWith(0, 1, 'into');
  });

  it('emits mode "above" when dropping in the top 40% of a non-mask row', () => {
    const items = container.querySelectorAll('.layer-row');
    items[2].getBoundingClientRect = () => ({ top: 0, left: 0, width: 100, height: 40, right: 100, bottom: 40 });
    const dt = { setData: vi.fn(), getData: vi.fn(() => '0'), effectAllowed: '' };
    items[0].dispatchEvent(Object.assign(new Event('dragstart', { bubbles: true }), { dataTransfer: dt }));
    items[2].dispatchEvent(Object.assign(new MouseEvent('dragover', { bubbles: true, cancelable: true, clientY: 10 }), { dataTransfer: dt }));
    items[2].dispatchEvent(Object.assign(new MouseEvent('drop', { bubbles: true, clientY: 10 }), { dataTransfer: dt }));
    expect(cb.onReorder).toHaveBeenCalledWith(0, 2, 'above');
  });

  it('emits mode "below" when dropping in the bottom 40% of a non-mask row', () => {
    const items = container.querySelectorAll('.layer-row');
    items[2].getBoundingClientRect = () => ({ top: 0, left: 0, width: 100, height: 40, right: 100, bottom: 40 });
    const dt = { setData: vi.fn(), getData: vi.fn(() => '0'), effectAllowed: '' };
    items[0].dispatchEvent(Object.assign(new Event('dragstart', { bubbles: true }), { dataTransfer: dt }));
    items[2].dispatchEvent(Object.assign(new MouseEvent('dragover', { bubbles: true, cancelable: true, clientY: 30 }), { dataTransfer: dt }));
    items[2].dispatchEvent(Object.assign(new MouseEvent('drop', { bubbles: true, clientY: 30 }), { dataTransfer: dt }));
    expect(cb.onReorder).toHaveBeenCalledWith(0, 2, 'below');
  });

  it('on a mask row: top zone is "above", bottom zone is "below", middle zone is "into"', () => {
    layers = [
      { id: 'p01', label: 'Fill: Color', enabled: true, isMask: false, indent: false, badge: 0 },
      { id: 'p02', label: 'MASK', enabled: true, isMask: true, indent: false, badge: 0 },
    ];
    list.refresh();
    const items = container.querySelectorAll('.layer-row');
    items[1].getBoundingClientRect = () => ({ top: 0, left: 0, width: 100, height: 40, right: 100, bottom: 40 });
    const dt = { setData: vi.fn(), getData: vi.fn(() => '0'), effectAllowed: '' };

    items[0].dispatchEvent(Object.assign(new Event('dragstart', { bubbles: true }), { dataTransfer: dt }));
    items[1].dispatchEvent(Object.assign(new MouseEvent('dragover', { bubbles: true, cancelable: true, clientY: 5 }), { dataTransfer: dt }));
    items[1].dispatchEvent(Object.assign(new MouseEvent('drop', { bubbles: true, clientY: 5 }), { dataTransfer: dt }));
    expect(cb.onReorder).toHaveBeenNthCalledWith(1, 0, 1, 'above');

    items[0].dispatchEvent(Object.assign(new Event('dragstart', { bubbles: true }), { dataTransfer: dt }));
    items[1].dispatchEvent(Object.assign(new MouseEvent('dragover', { bubbles: true, cancelable: true, clientY: 35 }), { dataTransfer: dt }));
    items[1].dispatchEvent(Object.assign(new MouseEvent('drop', { bubbles: true, clientY: 35 }), { dataTransfer: dt }));
    expect(cb.onReorder).toHaveBeenNthCalledWith(2, 0, 1, 'below');

    items[0].dispatchEvent(Object.assign(new Event('dragstart', { bubbles: true }), { dataTransfer: dt }));
    items[1].dispatchEvent(Object.assign(new MouseEvent('dragover', { bubbles: true, cancelable: true, clientY: 20 }), { dataTransfer: dt }));
    items[1].dispatchEvent(Object.assign(new MouseEvent('drop', { bubbles: true, clientY: 20 }), { dataTransfer: dt }));
    expect(cb.onReorder).toHaveBeenNthCalledWith(3, 0, 1, 'into');
  });

  it('adds .is-drop-into on dragover in the middle zone of a mask row, and clears it on dragleave/drop', () => {
    layers = [
      { id: 'p01', label: 'Fill: Color', enabled: true, isMask: false, indent: false, badge: 0 },
      { id: 'p02', label: 'MASK', enabled: true, isMask: true, indent: false, badge: 0 },
    ];
    list.refresh();
    const items = container.querySelectorAll('.layer-row');
    items[1].getBoundingClientRect = () => ({ top: 0, left: 0, width: 100, height: 40, right: 100, bottom: 40 });
    const dt = { setData: vi.fn(), getData: vi.fn(() => '0'), effectAllowed: '' };

    items[0].dispatchEvent(Object.assign(new Event('dragstart', { bubbles: true }), { dataTransfer: dt }));
    items[1].dispatchEvent(Object.assign(new MouseEvent('dragover', { bubbles: true, cancelable: true, clientY: 20 }), { dataTransfer: dt }));
    expect(items[1].classList.contains('is-drop-into')).toBe(true);

    items[1].dispatchEvent(new Event('dragleave', { bubbles: true }));
    expect(items[1].classList.contains('is-drop-into')).toBe(false);

    items[1].dispatchEvent(Object.assign(new MouseEvent('dragover', { bubbles: true, cancelable: true, clientY: 20 }), { dataTransfer: dt }));
    expect(items[1].classList.contains('is-drop-into')).toBe(true);
    items[1].dispatchEvent(Object.assign(new MouseEvent('drop', { bubbles: true, clientY: 20 }), { dataTransfer: dt }));
    expect(items[1].classList.contains('is-drop-into')).toBe(false);
  });

  it('does not call onReorder when dropping a row onto itself (from === to)', () => {
    const items = container.querySelectorAll('.layer-row');
    const dt = { setData: vi.fn(), getData: vi.fn(() => '1'), effectAllowed: '' };
    items[1].dispatchEvent(Object.assign(new Event('dragstart', { bubbles: true }), { dataTransfer: dt }));
    items[1].dispatchEvent(Object.assign(new MouseEvent('dragover', { bubbles: true, cancelable: true, clientY: 5 }), { dataTransfer: dt }));
    items[1].dispatchEvent(Object.assign(new MouseEvent('drop', { bubbles: true, clientY: 5 }), { dataTransfer: dt }));
    expect(cb.onReorder).not.toHaveBeenCalled();
  });

  it('escapes HTML in labels', () => {
    layers = [{ id: 'x', label: '<img src=x>', enabled: true, isMask: false, indent: false, badge: 0 }];
    list.refresh();
    expect(container.querySelector('.layer-label').innerHTML).not.toContain('<img');
  });
});
