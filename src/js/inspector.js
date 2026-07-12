// LUMEN — инспектор выбранного слоя (правая панель, спека §4): на каждое
// выделение строится свежий panelBuilder со state = instance.params, поэтому
// path в схемах модулей относительные ('mix', 'threshold.min').
import { createPanelBuilder, getByPath, escapeHtml } from '../shared/ui/panelBuilder.js';
import { createCenterPoint } from '../shared/ui/centerPoint.js';
import { createGradientMapper } from '../shared/ui/gradientMapper.js';
import { MODULES } from './modules/index.js';

/**
 * Видимость контрола по showIf. Поддерживаются формы:
 *   { path|key, notEquals }              // val !== notEquals
 *   { path|key, equals }                 // val === equals
 *   { path|key, in: [...] }              // in.includes(val)
 * И массив таких условий (все должны быть true — логика AND).
 * Терпимо к отсутствующему path/key — считает контрол видимым (безопасный
 * дефолт: лучше показать лишнее, чем уронить весь инспектор).
 */
function evalCondition(cond, params) {
  const path = cond?.path ?? cond?.key;
  if (!path) return true;
  const val = getByPath(params, path);
  if ('notEquals' in cond) return val !== cond.notEquals;
  if ('equals' in cond) return val === cond.equals;
  if (Array.isArray(cond.in)) return cond.in.includes(val);
  return true;
}
export function isControlVisible(control, params) {
  if (!control.showIf) return true;
  const conds = Array.isArray(control.showIf) ? control.showIf : [control.showIf];
  return conds.every((c) => evalCondition(c, params));
}

export function renderInspector(root, { state, getMedia, onParamChange }) {
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
      row.style.display = isControlVisible(c, inst.params) ? '' : 'none';
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
      content.lastElementChild.dataset.controlId = controlId(c);
    } else if (c.type === 'gradientMapper') {
      const gm = createGradientMapper({
        container: content,
        label: c.label,
        getStops: () => getByPath(inst.params, c.path),
        onChange: () => onParamChange(),
      });
      gm.refresh();
      content.lastElementChild.dataset.controlId = controlId(c);
    } else if (c.type === 'media') {
      const registry = getMedia();
      const mediaOptions = Object.fromEntries(
        registry.keys().map((k) => {
          const e = registry.get(k);
          return [e?.name || k, k];
        }),
      );
      const row = panel.buildControl({
        ...c,
        type: 'select',
        id: controlId(c),
        options: mediaOptions,
      });
      content.appendChild(row);
    } else {
      const row = panel.buildControl({ ...c, id: controlId(c) });
      content.appendChild(row);
    }
  }
  refreshVisibility();

  if (inst.type === 'mask') {
    buildMembersSection(root, { state, inst, onParamChange });
  }
}

/** Members-редактор для type==='mask' (фаза 5 Task 7, упрощённая версия —
 *  чекбоксы; drag-в-группу — фаза 6). Список кандидатов: все pass-инстансы
 *  стека НИЖЕ маски, в порядке стека. Toggle мутирует inst.maskMembers. */
function buildMembersSection(root, { state, inst, onParamChange }) {
  const maskIndex = state.stack.findIndex((m) => m.id === inst.id);
  const candidates = maskIndex < 0 ? [] : state.stack.slice(maskIndex + 1).filter((m) => m.type === 'pass');

  const sec = document.createElement('section');
  sec.className = 'panel-section';
  sec.innerHTML = `
    <h2 class="section-title"><span>Members</span>
      <svg class="chevron-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
    </h2>
    <div class="section-content"></div>`;
  sec.querySelector('.section-title').addEventListener('click', () => sec.classList.toggle('collapsed'));
  const content = sec.querySelector('.section-content');

  if (candidates.length === 0) {
    content.innerHTML = '<p style="opacity:.5;padding:8px 4px;font-size:12px;">No passes below this mask</p>';
  } else {
    for (const cand of candidates) {
      const label = `${MODULES[cand.module]?.label ?? cand.module} (${cand.id})`;
      const row = document.createElement('div');
      row.className = 'parameter-row';
      row.innerHTML = `
        <label class="checkbox-container">
          <input type="checkbox" id="lm-ins-${inst.id}-member-${cand.id}" ${inst.maskMembers.includes(cand.id) ? 'checked' : ''}>
          <span class="custom-checkbox"></span>
          <span>${escapeHtml(label)}</span>
        </label>`;
      const checkbox = row.querySelector('input');
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          if (!inst.maskMembers.includes(cand.id)) inst.maskMembers.push(cand.id);
          // порядок членов — по порядку стека
          inst.maskMembers.sort(
            (a, b) => state.stack.findIndex((m) => m.id === a) - state.stack.findIndex((m) => m.id === b),
          );
        } else {
          const i = inst.maskMembers.indexOf(cand.id);
          if (i >= 0) inst.maskMembers.splice(i, 1);
        }
        onParamChange();
      });
      content.appendChild(row);
    }
  }

  root.appendChild(sec);
}
