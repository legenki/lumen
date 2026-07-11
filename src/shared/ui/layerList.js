// layerList.js — список слоёв-модулей стека (Lumen и будущие стековые
// инструменты): выделение, вкл/выкл, дубль, удаление, drag-reorder,
// MASK-группы (отступ «↳», бейдж числа членов, акцентная полоса).
// Дисплей-модель строит потребитель: [{ id, label, enabled, isMask, indent, badge }].
import { escapeHtml } from './panelBuilder.js';

const ICONS = {
  handle: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></svg>',
  eye: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  duplicate: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  trash: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
};

export function createLayerList({ container, getLayers, getSelectedId, callbacks }) {
  const root = document.createElement('ul');
  root.className = 'layer-list';
  container.appendChild(root);
  let dragFrom = -1;

  function rowHtml(layer) {
    const badge = layer.badge > 0 ? `<span class="layer-badge">${layer.badge}</span>` : '';
    const indent = layer.indent ? '<span class="layer-indent">&#8627;</span>' : '';
    return `
      <span class="layer-handle" title="Drag to reorder">${ICONS.handle}</span>
      ${indent}<span class="layer-label">${escapeHtml(layer.label)}</span>${badge}
      <span class="layer-actions">
        <button class="layer-act layer-act-toggle" title="Toggle visibility">${ICONS.eye}</button>
        <button class="layer-act layer-act-duplicate" title="Duplicate">${ICONS.duplicate}</button>
        <button class="layer-act layer-act-remove" title="Remove">${ICONS.trash}</button>
      </span>`;
  }

  function refresh() {
    root.innerHTML = '';
    const layers = getLayers();
    const selected = getSelectedId();
    layers.forEach((layer, index) => {
      const li = document.createElement('li');
      li.className = 'layer-row';
      li.draggable = true;
      li.dataset.id = layer.id;
      li.dataset.index = String(index);
      li.classList.toggle('is-selected', layer.id === selected);
      li.classList.toggle('is-disabled', !layer.enabled);
      li.classList.toggle('is-mask', !!layer.isMask);
      li.classList.toggle('is-mask-affected', !!layer.indent);
      li.innerHTML = rowHtml(layer);

      li.addEventListener('click', (e) => {
        if (e.target.closest('.layer-act')) return;
        callbacks.onSelect?.(layer.id);
      });
      li.querySelector('.layer-act-toggle').addEventListener('click', () => callbacks.onToggle?.(layer.id));
      li.querySelector('.layer-act-duplicate').addEventListener('click', () => callbacks.onDuplicate?.(layer.id));
      li.querySelector('.layer-act-remove').addEventListener('click', () => callbacks.onRemove?.(layer.id));

      li.addEventListener('dragstart', (e) => {
        dragFrom = index;
        li.classList.add('is-dragging');
        e.dataTransfer?.setData?.('text/plain', String(index));
      });
      li.addEventListener('dragend', () => li.classList.remove('is-dragging'));
      li.addEventListener('dragover', (e) => {
        e.preventDefault();
        li.classList.add('is-drop-target');
      });
      li.addEventListener('dragleave', () => li.classList.remove('is-drop-target'));
      li.addEventListener('drop', (e) => {
        e.preventDefault?.();
        li.classList.remove('is-drop-target');
        const from = dragFrom >= 0 ? dragFrom : parseInt(e.dataTransfer?.getData?.('text/plain') ?? '-1', 10);
        dragFrom = -1;
        if (from >= 0 && from !== index) callbacks.onReorder?.(from, index);
      });

      root.appendChild(li);
    });
  }

  return { refresh };
}
