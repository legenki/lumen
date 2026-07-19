import p5 from 'p5';
import { registerSW } from 'virtual:pwa-register';
import { createDefaultState, serializeState, restoreState } from './state.js';
import { lumenSketch } from './app.js';
import { LEFT_SECTIONS, timelineFrameMax } from './controls.js';
import { createPanelBuilder, openSections } from '../shared/ui/panelBuilder.js';
import { createPersistence } from '../shared/utils/persistence.js';
import { timestamp } from '../shared/utils/datetime.js';
import { buildLayersSection } from './layersPanel.js';
import { buildMediaSection } from './mediaPanel.js';
import { buildPresetPanelSection } from './presetPanel.js';
import { renderInspector } from './inspector.js';
import { PRESETS } from './presets.js';
import { applyPresetToState } from './presetConvert.js';
import { startMp4Export, cancelMp4Export } from './mp4Export.js';
import { perfHintText } from './perf.js';

const STORAGE_KEY = 'lumen-tool';
const THEME_KEY = 'lumen-theme';

function toggleTheme() {
  const isDark = document.body.classList.contains('theme-dark');
  const next = isDark ? 'light' : 'dark';
  document.body.classList.replace(isDark ? 'theme-dark' : 'theme-light', `theme-${next}`);
  localStorage.setItem(THEME_KEY, next);
}

registerSW({
  onOfflineReady() {
    console.log('[lumen] ready to work offline');
  },
});

const state = createDefaultState();
window.__lumenState = state;

window.__lumenApplyPreset = (name) => {
  const preset = PRESETS.find((p) => p.name === name);
  if (!preset) return `not found; known: ${PRESETS.map((p) => p.name).join(', ')}`;
  applyPresetToState(state, preset);
  api?.invalidatePipeline?.();
  api?.rebuildBuffer();
  api?.scheduler.requestRender();
  saveState();
  buildUI();
  refreshInspector();
  updatePerfHint();
  return `applied: ${name} (${state.stack.length} modules)`;
};

const { saveState, loadState } = createPersistence(
  STORAGE_KEY, 'lumen',
  () => serializeState(state),
  (data) => restoreState(state, data),
);
loadState();

let api = null;
let layersSection = null;
let statusToken = 0;
let scrubberRaf = 0;

function applyChange(ctrl) {
  if (ctrl.id === 'lm-btn-save-png') return exportPNG();

  if (ctrl.regen === 'buffer' && api) {
    api.invalidatePipeline?.();
    api.rebuildBuffer();
    api.scheduler.requestRender();
  }
  if (ctrl.regen === 'animation' && api) {
    api.syncAnimation();
    api.scheduler.requestRender();
    syncScrubberLoop();
  }
  if (ctrl.regen === 'timeline' && api) {
    const max = timelineFrameMax(state.rec);
    if (state.runtime.frame > max) {
      state.runtime.frame = max;
      api.setFrame?.(max);
    }
    api.syncFrameRate?.();
    api.syncAnimation();
    syncTimelineScrubber();
    syncMp4LengthSelect();
    api.invalidatePipeline?.();
    api.scheduler.requestRender();
  }
  if (ctrl.regen === 'frame' && api) {
    api.setFrame?.(state.runtime.frame);
    api.scheduler.requestRender();
  }

  if (ctrl.regen !== 'none' && ctrl.regen !== 'frame') {
    api?.invalidatePipeline?.();
  }

  saveState(); // already debounced 500ms in createPersistence
  updatePerfHint();
}

function refreshVisibility() {}

async function exportPNG() {
  if (!api) return;
  try {
    setStatus('Rendering PNG…', { ttl: 0 });
    const run = async () => {
      api.renderFrame(state.runtime.frame, { blitScreen: false });
      const g = api.getBuffer();
      const el = g.canvas ?? g.elt;
      await new Promise((resolve, reject) => {
        el.toBlob((blob) => {
          if (!blob) return reject(new Error('toBlob failed'));
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `lumen_${timestamp()}.png`;
          a.click();
          URL.revokeObjectURL(a.href);
          resolve();
        }, 'image/png');
      });
    };
    if (typeof api.withFinalQuality === 'function') {
      await api.withFinalQuality(run);
    } else {
      await run();
    }
    setStatus('PNG saved');
  } catch (e) {
    console.error(e);
    setStatus('PNG export failed');
  }
  updatePerfHint();
}

function setStatus(text, opts = {}) {
  const s = document.getElementById('lm-export-status');
  if (!s) return;
  if (opts.clearIf !== undefined) {
    if (s.textContent === opts.clearIf) s.textContent = '';
    return;
  }
  s.textContent = text;
  const ttl = opts.ttl !== undefined ? opts.ttl : (text ? 2500 : 0);
  if (!ttl) return;
  const token = ++statusToken;
  setTimeout(() => {
    if (token !== statusToken) return;
    if (s.textContent === text) s.textContent = '';
  }, ttl);
}

function updatePerfHint() {
  const el = document.getElementById('lm-perf-hint');
  if (!el) return;
  el.textContent = perfHintText(state);
}

const recVideo = {
  active: false,
  cancel: false,
  get seconds() { return state.rec.length.value; },
  set seconds(v) {
    const n = parseInt(v, 10);
    if (Number.isFinite(n) && n > 0) state.rec.length.value = n;
  },
};

const panel = createPanelBuilder({ state, applyChange, refreshVisibility });

function refreshInspector() {
  renderInspector(document.getElementById('lm-inspector'), {
    state,
    getMedia: () => api?.getMedia(),
    onParamChange({ refreshLayers = false } = {}) {
      if (refreshLayers) layersSection?.refresh();
      api?.invalidatePipeline?.();
      api?.scheduler.requestRender();
      saveState();
      updatePerfHint();
    },
  });
}

function syncTimelineScrubber() {
  const slide = document.getElementById('lm-timeline-frame');
  const num = document.getElementById('lm-timeline-frame-num');
  const max = timelineFrameMax(state.rec);
  if (slide) {
    slide.max = String(max);
    slide.value = String(Math.min(state.runtime.frame, max));
  }
  if (num) {
    num.max = String(max);
    num.value = String(Math.min(state.runtime.frame, max));
  }
}

function syncMp4LengthSelect() {
  const sel = document.getElementById('lm-mp4-length');
  if (!sel) return;
  const v = String(state.rec.length.value);
  if (![...sel.options].some((o) => o.value === v)) {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = `${v}s`;
    sel.appendChild(opt);
  }
  sel.value = v;
}

function syncExportButtons() {
  const mp4Btn = document.getElementById('lm-btn-save-mp4');
  const cancelBtn = document.getElementById('lm-btn-cancel-mp4');
  if (mp4Btn) mp4Btn.disabled = !!recVideo.active;
  if (cancelBtn) {
    cancelBtn.hidden = !recVideo.active;
    cancelBtn.disabled = !recVideo.active;
  }
}

/** rAF scrubber sync only while animating (no setInterval when idle). */
function syncScrubberLoop() {
  if (scrubberRaf) {
    cancelAnimationFrame(scrubberRaf);
    scrubberRaf = 0;
  }
  if (!api || recVideo.active) return;
  if (!api.scheduler.isAnimating()) return;

  const tick = () => {
    scrubberRaf = 0;
    if (!api || recVideo.active || !api.scheduler.isAnimating()) return;
    const slide = document.getElementById('lm-timeline-frame');
    const num = document.getElementById('lm-timeline-frame-num');
    const f = state.runtime.frame;
    if (slide && slide !== document.activeElement) slide.value = String(f);
    if (num && num !== document.activeElement) num.value = String(f);
    scrubberRaf = requestAnimationFrame(tick);
  };
  scrubberRaf = requestAnimationFrame(tick);
}

function buildUI() {
  const root = document.getElementById('lm-left');
  root.innerHTML = '';
  buildPresetPanelSection(root, {
    state,
    onApply() {
      api?.invalidatePipeline?.();
      api?.rebuildBuffer();
      api?.syncAnimation();
      api?.scheduler.requestRender();
      saveState();
      layersSection?.refresh();
      refreshInspector();
      syncTimelineScrubber();
      syncMp4LengthSelect();
      updatePerfHint();
      syncScrubberLoop();
    },
  });
  panel.buildSections(root, LEFT_SECTIONS);
  layersSection = buildLayersSection(root, {
    state,
    onStackChange() {
      api?.invalidatePipeline?.();
      api?.syncAnimation();
      api?.scheduler.requestRender();
      saveState();
      updatePerfHint();
      syncScrubberLoop();
    },
    onSelect: refreshInspector,
  });
  buildMediaSection(root, {
    p: api?.getP?.() ?? null,
    media: api?.getMedia?.() ?? null,
    onChange() {
      api?.invalidatePipeline?.();
      api?.scheduler.requestRender();
      refreshInspector();
    },
  });
  openSections(root, [0, 1, 2, 3, 4]);

  const pngBtn = document.getElementById('lm-btn-save-png');
  if (pngBtn) {
    pngBtn.onclick = () => applyChange({ id: 'lm-btn-save-png' });
  }

  const mp4Btn = document.getElementById('lm-btn-save-mp4');
  if (mp4Btn) {
    mp4Btn.onclick = async () => {
      if (recVideo.active) return;
      syncExportButtons();
      const status = (msg, opts) => {
        if (opts?.clearIf !== undefined) return setStatus(msg, opts);
        const isProgress = typeof msg === 'string' && (
          msg.startsWith('Encoding') || msg.startsWith('Preparing') || msg.startsWith('Finalizing')
        );
        setStatus(msg, isProgress ? { ttl: 0 } : opts);
        syncExportButtons();
      };
      syncExportButtons();
      try {
        await startMp4Export(api, state, recVideo, status);
      } finally {
        syncExportButtons();
        syncTimelineScrubber();
        updatePerfHint();
        syncScrubberLoop();
      }
    };
  }

  const cancelBtn = document.getElementById('lm-btn-cancel-mp4');
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      cancelMp4Export(recVideo);
      setStatus('Cancelling…', { ttl: 0 });
    };
  }

  const mp4Length = document.getElementById('lm-mp4-length');
  if (mp4Length) {
    syncMp4LengthSelect();
    mp4Length.onchange = (e) => {
      const n = parseInt(e.target.value, 10) || 4;
      state.rec.length.value = n;
      applyChange({ id: 'lm-mp4-length', regen: 'timeline', path: 'rec.length.value' });
      panel.syncUIFromState(LEFT_SECTIONS);
      syncTimelineScrubber();
    };
  }

  const themeBtn = document.getElementById('lm-btn-theme');
  if (themeBtn) themeBtn.onclick = toggleTheme;

  syncTimelineScrubber();
  syncExportButtons();
  updatePerfHint();
  syncScrubberLoop();
}

const container = document.getElementById('lumen-canvas');
new p5((p) => lumenSketch(p, {
  state,
  onReady(a) {
    api = a;
    buildUI();
    panel.syncUIFromState(LEFT_SECTIONS);
    refreshInspector();
    api.syncAnimation();
    syncTimelineScrubber();
    syncMp4LengthSelect();
    updatePerfHint();
    syncScrubberLoop();
  },
}), container);

export { state };
