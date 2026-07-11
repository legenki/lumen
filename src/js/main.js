import p5 from 'p5';
import { registerSW } from 'virtual:pwa-register';
import { createDefaultState, serializeState, restoreState } from './state.js';
import { lumenSketch } from './app.js';
import { LEFT_SECTIONS } from './controls.js';
import { createPanelBuilder, openSections } from '../shared/ui/panelBuilder.js';
import { createPersistence } from '../shared/utils/persistence.js';
import { timestamp } from '../shared/utils/datetime.js';
import { buildLayersSection } from './layersPanel.js';
import { renderInspector } from './inspector.js';

const STORAGE_KEY = 'lumen-tool';

registerSW({
  onOfflineReady() {
    console.log('[lumen] ready to work offline');
  },
});

const state = createDefaultState();
window.__lumenState = state; // отладка в консоли; не API

const { saveState, loadState } = createPersistence(
  STORAGE_KEY, 'lumen',
  () => serializeState(state),
  (data) => restoreState(state, data),
);
loadState();

let api = null; // { scheduler, rebuildBuffer, getBuffer } — придёт из sketch onReady
let layersSection = null; // { refresh } — для обновления бейджей/индента после Members-toggle

function applyChange(ctrl) {
  if (ctrl.id === 'lm-btn-save-png') return exportPNG();
  if (ctrl.regen === 'buffer' && api) {
    api.rebuildBuffer();
    api.scheduler.requestRender();
  }
  if (ctrl.regen === 'animation' && api) {
    api.syncAnimation();
    api.scheduler.requestRender();
  }
  saveState();
}

function refreshVisibility() {
  // Фаза 2: условно скрываемых контролов нет.
}

function exportPNG() {
  if (!api) return;
  const g = api.getBuffer();
  const el = g.canvas ?? g.elt; // p5.Graphics: canvas (2.x) / elt (fallback)
  el.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `lumen_${timestamp()}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
    setStatus('PNG saved');
  }, 'image/png');
}

function setStatus(text) {
  const s = document.getElementById('lm-export-status');
  if (s) {
    s.textContent = text;
    setTimeout(() => { if (s.textContent === text) s.textContent = ''; }, 2500);
  }
}

const panel = createPanelBuilder({ state, applyChange, refreshVisibility });

function refreshInspector() {
  renderInspector(document.getElementById('lm-inspector'), {
    state,
    onParamChange() {
      layersSection?.refresh(); // Members-toggle меняет badge/indent маски в LayerList
      api?.scheduler.requestRender();
      saveState();
    },
  });
}

function buildUI() {
  const root = document.getElementById('lm-left');
  root.innerHTML = '';
  panel.buildSections(root, LEFT_SECTIONS);
  layersSection = buildLayersSection(root, {
    state,
    onStackChange() {
      api?.scheduler.requestRender();
      saveState();
    },
    onSelect: refreshInspector,
  });
  openSections(root, [0, 1]);
  document.getElementById('lm-btn-save-png')
    .addEventListener('click', () => applyChange({ id: 'lm-btn-save-png' }));
}

const container = document.getElementById('lumen-canvas');
new p5((p) => lumenSketch(p, {
  state,
  onReady(a) {
    api = a;
    buildUI();
    panel.syncUIFromState(LEFT_SECTIONS);
    refreshInspector();
  },
}), container);

export { state };
