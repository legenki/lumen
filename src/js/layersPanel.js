// LUMEN — секция Layers: Module List + Add To Stack + LayerList (спека §4).
// MASK-группы: дисплей-модель уже поддерживает indent/badge; до фазы 5 масок
// в реестре нет, поэтому строки плоские.
import { createLayerList } from '../shared/ui/layerList.js';
import { MODULES } from './modules/index.js';
import { addModule, duplicateModule, removeModule, moveModule } from './stack.js';

export function buildLayersSection(root, { state, onStackChange, onSelect }) {
  const sec = document.createElement('section');
  sec.className = 'panel-section';
  sec.innerHTML = `
    <h2 class="section-title"><span>Layers</span>
      <svg class="chevron-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
    </h2>
    <div class="section-content">
      <div class="parameter-row">
        <div class="parameter-header"><span class="parameter-label">Module List</span></div>
        <select class="grafema-select" id="lm-layers-module"></select>
      </div>
      <div class="parameter-row">
        <button id="lm-layers-add" class="btn btn-secondary" style="width:100%;">Add To Stack</button>
      </div>
      <div class="parameter-row" id="lm-layers-list"></div>
    </div>`;
  sec.querySelector('.section-title').addEventListener('click', () => sec.classList.toggle('collapsed'));
  root.appendChild(sec);

  const select = sec.querySelector('#lm-layers-module');
  for (const def of Object.values(MODULES)) {
    const opt = document.createElement('option');
    opt.value = def.key;
    opt.textContent = def.label;
    select.appendChild(opt);
  }

  const layerList = createLayerList({
    container: sec.querySelector('#lm-layers-list'),
    getLayers: () =>
      state.stack.map((m) => ({
        id: m.id,
        label: MODULES[m.module]?.label ?? m.module,
        enabled: m.enabled,
        isMask: m.type === 'mask',
        indent: false, // MASK-члены — фаза 5
        badge: Array.isArray(m.maskMembers) ? m.maskMembers.length : 0,
      })),
    getSelectedId: () => state.ui.selectedId,
    callbacks: {
      onSelect(id) {
        state.ui.selectedId = id;
        layerList.refresh();
        onSelect();
      },
      onToggle(id) {
        const inst = state.stack.find((m) => m.id === id);
        if (inst) inst.enabled = !inst.enabled;
        layerList.refresh();
        onStackChange();
      },
      onDuplicate(id) {
        const dup = duplicateModule(state, id);
        if (dup) state.ui.selectedId = dup.id;
        layerList.refresh();
        onStackChange();
        onSelect();
      },
      onRemove(id) {
        removeModule(state, id);
        if (state.ui.selectedId === id) state.ui.selectedId = null;
        layerList.refresh();
        onStackChange();
        onSelect();
      },
      onReorder(from, to) {
        moveModule(state, from, to);
        layerList.refresh();
        onStackChange();
      },
    },
  });

  sec.querySelector('#lm-layers-add').addEventListener('click', () => {
    const inst = addModule(state, select.value);
    state.ui.selectedId = inst.id;
    layerList.refresh();
    onStackChange();
    onSelect();
  });

  layerList.refresh();
  return { refresh: () => layerList.refresh() };
}
