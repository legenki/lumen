// LUMEN — инспектор выбранного слоя (правая панель, спека §4): на каждое
// выделение строится свежий panelBuilder со state = instance.params, поэтому
// path в схемах модулей относительные ('mix', 'threshold.min').
import { createPanelBuilder, getByPath } from '../shared/ui/panelBuilder.js';
import { createCenterPoint } from '../shared/ui/centerPoint.js';
import { createGradientMapper } from '../shared/ui/gradientMapper.js';
import { MODULES } from './modules/index.js';

export function renderInspector(root, { state, onParamChange }) {
  root.innerHTML = '';
  const inst = state.stack.find((m) => m.id === state.ui.selectedId);
  if (!inst) {
    root.innerHTML =
      '<p class="inspector-empty" style="opacity:.5;padding:12px;font-size:12px;">Select a layer to edit its parameters</p>';
    return;
  }
  const def = MODULES[inst.module];
  const sec = document.createElement('section');
  sec.className = 'panel-section';
  sec.innerHTML = `
    <h2 class="section-title"><span></span></h2>
    <div class="section-content"></div>`;
  sec.querySelector('.section-title span').textContent = `${def.label} (${inst.id})`;
  const content = sec.querySelector('.section-content');
  root.appendChild(sec);

  const controlId = (c) => `lm-ins-${inst.id}-${c.path.replace(/\./g, '-')}`;

  function refreshVisibility() {
    for (const c of def.controls) {
      if (!c.showIf) continue;
      const row = content.querySelector(`[data-control-id="${controlId(c)}"]`);
      if (!row) continue;
      const val = getByPath(inst.params, c.showIf.path);
      row.style.display = val !== c.showIf.notEquals ? '' : 'none';
    }
  }

  const panel = createPanelBuilder({
    state: inst.params,
    applyChange: () => onParamChange(),
    refreshVisibility,
  });

  for (const c of def.controls) {
    if (c.type === 'centerPoint') {
      const cp = createCenterPoint({
        container: content,
        label: c.label,
        axes: c.axes,
        getValue: () => getByPath(inst.params, c.path),
        onChange(v) {
          const target = getByPath(inst.params, c.path);
          target.x = v.x;
          target.y = v.y;
          onParamChange();
        },
      });
      cp.refresh();
    } else if (c.type === 'gradientMapper') {
      const gm = createGradientMapper({
        container: content,
        label: c.label,
        getStops: () => getByPath(inst.params, c.path),
        onChange: () => onParamChange(),
      });
      gm.refresh();
    } else {
      const row = panel.buildControl({ ...c, id: controlId(c) });
      content.appendChild(row);
    }
  }
  refreshVisibility();
}
