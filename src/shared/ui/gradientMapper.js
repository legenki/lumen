// gradientMapper.js — многостоповый редактор градиента (Fill: Gradient,
// Gradient Map). Данные живут у потребителя (getStops), мутируются на месте
// функциями gradientModel; onChange зовётся после каждой мутации.
import {
  addStop, removeStop, moveStop, stopsToCss,
} from './gradientModel.js';

export function createGradientMapper({ container, label, getStops, onChange }) {
  const wrap = document.createElement('div');
  wrap.className = 'parameter-row gradient-mapper';
  wrap.innerHTML = `
    <div class="parameter-header"><span class="parameter-label"></span></div>
    <div class="gradient-strip"></div>
    <div class="gradient-markers"></div>
    <div class="gradient-editor" hidden>
      <input type="color">
      <input type="range" min="0" max="1" step="0.01" class="custom-slider" title="Alpha">
      <input type="number" min="0" max="1" step="0.01" class="grafema-num-input" title="Position">
      <button class="btn btn-secondary gradient-remove" title="Remove stop">✕</button>
    </div>`;
  wrap.querySelector('.parameter-label').textContent = label;
  container.appendChild(wrap);

  const strip = wrap.querySelector('.gradient-strip');
  const markersEl = wrap.querySelector('.gradient-markers');
  const editor = wrap.querySelector('.gradient-editor');
  const colorIn = editor.querySelector('input[type="color"]');
  const alphaIn = editor.querySelector('input[type="range"]');
  const timeIn = editor.querySelector('input[type="number"]');
  const removeBtn = editor.querySelector('.gradient-remove');

  let selected = -1;
  let dragging = -1;

  const toHex = (v) => {
    const c = (n) => Math.round(n).toString(16).padStart(2, '0');
    return `#${c(v.r)}${c(v.g)}${c(v.b)}`;
  };

  function timeFromEvent(e) {
    const r = strip.getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  }

  strip.addEventListener('dblclick', (e) => {
    const idx = addStop(getStops(), timeFromEvent(e));
    if (idx >= 0) {
      selected = idx;
      onChange();
      refresh();
    }
  });

  // Слушаем move/up на всём wrap: при драге указатель ходит над зоной
  // маркеров (ниже strip), события всплывают до wrap.
  wrap.addEventListener('pointermove', (e) => {
    if (dragging < 0) return;
    dragging = moveStop(getStops(), dragging, timeFromEvent(e));
    selected = dragging;
    onChange();
    refresh();
  });
  wrap.addEventListener('pointerup', () => { dragging = -1; });

  colorIn.addEventListener('input', () => {
    const v = getStops()[selected]?.value;
    if (!v) return;
    v.r = parseInt(colorIn.value.slice(1, 3), 16);
    v.g = parseInt(colorIn.value.slice(3, 5), 16);
    v.b = parseInt(colorIn.value.slice(5, 7), 16);
    onChange();
    refresh();
  });
  alphaIn.addEventListener('input', () => {
    const v = getStops()[selected]?.value;
    if (!v) return;
    v.a = parseFloat(alphaIn.value);
    onChange();
    refresh();
  });
  timeIn.addEventListener('input', () => {
    const n = parseFloat(timeIn.value);
    if (!Number.isFinite(n) || selected < 0) return;
    selected = moveStop(getStops(), selected, n);
    onChange();
    refresh();
  });
  removeBtn.addEventListener('click', () => {
    if (selected < 0) return;
    if (removeStop(getStops(), selected)) {
      selected = -1;
      onChange();
    }
    refresh();
  });

  function refresh() {
    const stops = getStops();
    strip.style.background = `linear-gradient(90deg, ${stopsToCss(stops)})`;
    markersEl.innerHTML = '';
    stops.forEach((s, i) => {
      const m = document.createElement('div');
      m.className = 'gradient-marker';
      m.classList.toggle('is-selected', i === selected);
      m.style.left = `${s.time * 100}%`;
      m.style.background = toHex(s.value);
      m.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        selected = i;
        dragging = i;
        refresh();
      });
      m.addEventListener('pointerup', () => { dragging = -1; });
      markersEl.appendChild(m);
    });
    const sel = stops[selected];
    editor.hidden = !sel;
    if (sel) {
      colorIn.value = toHex(sel.value);
      alphaIn.value = sel.value.a;
      timeIn.value = parseFloat(sel.time.toFixed(3));
    }
  }

  return { refresh };
}
