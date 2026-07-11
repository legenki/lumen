// LUMEN — секция Presets: dropdown (встроенные + пользовательские) + Apply /
// Save As / Export / Import / Delete. Пресеты хранятся в старом v2-формате
// (совместимо с applyPresetToState/convertOldPreset из фазы 5).
import { downloadPresetJSON, openPresetFile } from '../shared/utils/presetIO.js';
import { PRESETS } from './presets.js';
import { applyPresetToState, convertOldPreset } from './presetConvert.js';
import { timestamp } from '../shared/utils/datetime.js';

/** Экспортирует ТЕКУЩИЙ state.stack как preset v2 (совместимо со старым форматом). */
export function snapshotPreset(state, name) {
  return {
    toolId: 'lumen',
    version: 2,
    name,
    createdAt: new Date().toISOString().replace(/[:.]/g, '-'),
    main: {
      cnv: { ratio: state.cnv.ratio, animation: state.cnv.animation, scale: { value: state.cnv.scale.value } },
      rec: { length: { value: state.rec.length.value }, frame: 0 },
    },
    modules: state.stack.map((inst) => {
      const m = { ref: inst.id, name: inst.module, enabled: inst.enabled, params: structuredClone(inst.params) };
      if (inst.type === 'mask') m.params.__maskMembers = [...(inst.maskMembers || [])];
      return m;
    }),
  };
}

export function buildPresetPanelSection(root, { state, onApply }) {
  const wrap = document.createElement('div');
  wrap.className = 'panel-section';
  wrap.innerHTML = `
    <h2 class="section-title"><span>Presets</span>
      <svg class="chevron-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg></h2>
    <div class="section-content">
      <div class="parameter-row">
        <div class="parameter-header"><span class="parameter-label">Preset List</span></div>
        <select id="lm-preset-select" class="grafema-select"></select>
      </div>
      <div class="parameter-row" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <button id="lm-preset-apply" class="btn btn-accent">Apply</button>
        <button id="lm-preset-save" class="btn btn-secondary">Save As…</button>
      </div>
      <div class="parameter-row" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <button id="lm-preset-export" class="btn btn-secondary">Export</button>
        <button id="lm-preset-import" class="btn btn-secondary">Import</button>
      </div>
      <div class="parameter-row">
        <button id="lm-preset-delete" class="btn btn-secondary" style="width:100%;">Delete Selected (user only)</button>
      </div>
    </div>`;
  wrap.querySelector('.section-title').addEventListener('click', () => wrap.classList.toggle('collapsed'));
  root.appendChild(wrap);

  const select = wrap.querySelector('#lm-preset-select');

  function refill() {
    select.innerHTML = '';
    const built = document.createElement('optgroup');
    built.label = 'Built-in';
    for (const p of PRESETS) built.appendChild(new Option(p.name, p.name));
    select.appendChild(built);
    if (state.userPresets.length > 0) {
      const user = document.createElement('optgroup');
      user.label = 'User';
      for (const p of state.userPresets) user.appendChild(new Option(`★ ${p.name}`, `★ ${p.name}`));
      select.appendChild(user);
    }
  }
  refill();

  function currentPreset() {
    const label = select.value;
    if (label.startsWith('★ ')) return state.userPresets.find((p) => `★ ${p.name}` === label);
    return PRESETS.find((p) => p.name === label);
  }

  wrap.querySelector('#lm-preset-apply').addEventListener('click', () => {
    const preset = currentPreset();
    if (!preset) return;
    applyPresetToState(state, preset);
    onApply();
  });
  wrap.querySelector('#lm-preset-save').addEventListener('click', () => {
    const name = window.prompt('Preset name:', `My Preset ${state.userPresets.length + 1}`);
    if (!name) return;
    state.userPresets.push(snapshotPreset(state, name));
    refill();
    onApply();
  });
  wrap.querySelector('#lm-preset-export').addEventListener('click', () => {
    const preset = currentPreset() ?? snapshotPreset(state, 'Untitled');
    downloadPresetJSON(`${preset.name.replace(/[^\w-]/g, '_')}-${timestamp()}.json`, preset);
  });
  wrap.querySelector('#lm-preset-import').addEventListener('click', () => {
    openPresetFile((data) => {
      // Валидация форм: старый filtr-tool v2 или Lumen-снимок.
      if (!data || !Array.isArray(data.modules)) return;
      try {
        convertOldPreset(data); // sanity: конвертируется без падений (нет неизвестных модулей)
      } catch (e) {
        console.warn('[lumen] preset import rejected:', e);
        return;
      }
      state.userPresets.push({ ...data, name: data.name ?? 'Imported' });
      refill();
      onApply();
    });
  });
  wrap.querySelector('#lm-preset-delete').addEventListener('click', () => {
    const label = select.value;
    if (!label.startsWith('★ ')) return; // built-in неизменяемы
    state.userPresets = state.userPresets.filter((p) => `★ ${p.name}` !== label);
    refill();
    onApply();
  });

  return { refill };
}
