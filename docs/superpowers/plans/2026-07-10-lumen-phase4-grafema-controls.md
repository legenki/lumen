# Lumen Phase 4: Grafema Controls + Layers/Inspector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Три новых компонента дизайн-системы в репо grafema (LayerList, CenterPoint, GradientMapper) и настоящий UI Lumen: панель Layers (выделение/вкл-выкл/дубль/удаление/drag-reorder) + инспектор выбранного слоя со схемами контролов 4 Fill-модулей; dev-секция удаляется.

**Architecture:** Компоненты — vanilla-DOM фабрики в стиле panelBuilder (без фреймворков), разрабатываются в grafema (`/Users/andy/Documents/GitHub/grafema`, src/shared/ui/ + vitest jsdom тесты + CSS-блок в src/css/style.css), затем вендорятся в lumen копированием (устоявшийся паттерн: divix и lumen держат свои копии). Инспектор Lumen решает проблему адресации параметров слоя элегантно: на каждое выделение создаётся СВЕЖИЙ panelBuilder c `state = instance.params` — все path в схемах модулей относительные («mix», «gradCenter.x»), диспетчер один: requestRender + saveState.

**Tech Stack:** vanilla DOM + Pointer Events (CenterPoint, GradientMapper) + HTML5 Drag&Drop (LayerList), vitest + jsdom, существующий panelBuilder.

**Контекст для исполнителя без предыстории:**
- Lumen: `/Users/andy/Documents/GitHub/lumen` (спека docs/superpowers/specs/2026-07-10-lumen-migration-design.md §3-4; фазы 1-3 готовы: стек рендерится пайплайном, dev-UI в controls.js/main.js). Grafema: `/Users/andy/Documents/GitHub/grafema` — источник истины дизайн-системы. ВНИМАНИЕ: в grafema есть НЕЗАКОММИЧЕННЫЕ чужие правки (src/vertice/*) — стейджить ТОЛЬКО свои файлы, никаких `git add -A`.
- Референс UI старого инструмента: скриншот-описание в спеке §4 (MASK-группы: отступ «↳», бейдж, акцент; hover-иконки глаз/копия/корзина); схемы контролов модулей — reference/filtr/modules.js (panels) в lumen.
- Формат градиента (жёсткий контракт пайплайна): `[{ time: 0..1, value: { r: 0-255, g: 0-255, b: 0-255, a: 0-1 } }]`, 2..16 стопов, отсортирован по time.
- Оба репо: eslint + prettier; коммиты с трейлером `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1 (grafema): LayerList

**Files (в /Users/andy/Documents/GitHub/grafema):**
- Create: `src/shared/ui/layerList.js`
- Test: `src/shared/ui/__tests__/layerList.test.js`
- Modify: `src/css/style.css` (блок в конец)

- [x] **Step 1: Тест** (`src/shared/ui/__tests__/layerList.test.js`):

```js
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

  it('drag & drop reorders via onReorder(fromIndex, toIndex)', () => {
    const items = container.querySelectorAll('.layer-row');
    const dt = { setData: vi.fn(), getData: vi.fn(() => '0'), effectAllowed: '' };
    items[0].dispatchEvent(Object.assign(new Event('dragstart', { bubbles: true }), { dataTransfer: dt }));
    items[2].dispatchEvent(Object.assign(new Event('dragover', { bubbles: true, cancelable: true }), { dataTransfer: dt }));
    items[2].dispatchEvent(Object.assign(new Event('drop', { bubbles: true }), { dataTransfer: dt }));
    expect(cb.onReorder).toHaveBeenCalledWith(0, 2);
  });

  it('escapes HTML in labels', () => {
    layers = [{ id: 'x', label: '<img src=x>', enabled: true, isMask: false, indent: false, badge: 0 }];
    list.refresh();
    expect(container.querySelector('.layer-label').innerHTML).not.toContain('<img');
  });
});
```

- [x] **Step 2: Падает** — в grafema: `npm test -- layerList` → FAIL (модуля нет).

- [x] **Step 3: Реализация** `src/shared/ui/layerList.js`:

```js
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
```

- [x] **Step 4: CSS** — дописать в конец `/Users/andy/Documents/GitHub/grafema/src/css/style.css`:

```css
/* ============ LayerList (stack tools) ============ */
.layer-list { list-style: none; margin: 0; padding: 0; }
.layer-row {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 8px; border-radius: 6px; cursor: pointer;
  font-size: 12px; user-select: none;
  border-left: 2px solid transparent;
}
.layer-row:hover { background: rgba(0, 0, 0, 0.05); }
.layer-row.is-selected { background: rgba(0, 0, 0, 0.08); }
.layer-row.is-disabled .layer-label { opacity: 0.4; }
.layer-row.is-mask, .layer-row.is-mask-affected { border-left-color: #a78bfa; }
.layer-row.is-mask-affected { padding-left: 20px; }
.layer-indent { opacity: 0.5; margin-right: 2px; }
.layer-handle { cursor: grab; opacity: 0.35; display: inline-flex; }
.layer-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.layer-badge {
  background: #a78bfa; color: #fff; border-radius: 8px;
  font-size: 10px; padding: 1px 6px;
}
.layer-actions { display: none; gap: 2px; }
.layer-row:hover .layer-actions { display: inline-flex; }
.layer-act {
  background: none; border: none; cursor: pointer; padding: 2px;
  opacity: 0.55; display: inline-flex; color: inherit;
}
.layer-act:hover { opacity: 1; }
.layer-row.is-dragging { opacity: 0.4; }
.layer-row.is-drop-target { box-shadow: inset 0 2px 0 0 #a78bfa; }
```

- [x] **Step 5: Прогнать** — в grafema: `npm test -- layerList` → PASS; `npm run lint` (если ругается на чужие незакоммиченные файлы vertice — прогнать только на своём: `npx eslint src/shared/ui/layerList.js src/shared/ui/__tests__/layerList.test.js`).

- [x] **Step 6: Commit (в grafema; стейджить ТОЛЬКО свои файлы)**

```bash
cd /Users/andy/Documents/GitHub/grafema
git add src/shared/ui/layerList.js src/shared/ui/__tests__/layerList.test.js src/css/style.css
git commit -m "feat(shared): LayerList component for stack-based tools (Lumen)"
```

---

### Task 2 (grafema): CenterPoint (2D-джойстик)

**Files (в /Users/andy/Documents/GitHub/grafema):**
- Create: `src/shared/ui/centerPoint.js`
- Test: `src/shared/ui/__tests__/centerPoint.test.js`
- Modify: `src/css/style.css` (блок в конец)

- [x] **Step 1: Тест** (`src/shared/ui/__tests__/centerPoint.test.js`):

```js
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCenterPoint } from '../centerPoint.js';

describe('createCenterPoint', () => {
  let container, onChange, value, pad;
  const AXES = { x: { min: -0.5, max: 0.5, step: 0.01 }, y: { min: -0.5, max: 0.5, step: 0.01 } };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    value = { x: 0, y: 0 };
    onChange = vi.fn((v) => Object.assign(value, v));
    const cp = createCenterPoint({
      container, label: 'Center Point', axes: AXES,
      getValue: () => value, onChange,
    });
    cp.refresh();
    pad = container.querySelector('.center-point-pad');
    // jsdom не считает layout — фиксируем прямоугольник пада
    pad.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100 });
  });

  it('renders pad, knob and two number inputs with current values', () => {
    expect(pad).toBeTruthy();
    expect(container.querySelector('.center-point-knob')).toBeTruthy();
    const nums = container.querySelectorAll('input[type="number"]');
    expect(nums).toHaveLength(2);
    expect(nums[0].value).toBe('0');
  });

  it('pointer press maps pad position to axis ranges (center=0, right/bottom=max)', () => {
    pad.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 0 }));
    expect(onChange).toHaveBeenCalled();
    const v = onChange.mock.calls.at(-1)[0];
    expect(v.x).toBeCloseTo(0.5, 5); // право → x max
    expect(v.y).toBeCloseTo(-0.5, 5); // верх → y min
  });

  it('clamps and steps values', () => {
    pad.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 63, clientY: 63 }));
    const v = onChange.mock.calls.at(-1)[0];
    expect(v.x).toBeCloseTo(0.13, 5); // 0.63→0.13 raw=0.13, шаг 0.01
    expect(Math.round(v.x / 0.01)).toBeCloseTo(v.x / 0.01, 5);
  });

  it('number inputs write through onChange', () => {
    const nums = container.querySelectorAll('input[type="number"]');
    nums[1].value = '0.25';
    nums[1].dispatchEvent(new Event('input', { bubbles: true }));
    expect(onChange.mock.calls.at(-1)[0].y).toBeCloseTo(0.25, 5);
  });
});
```

- [x] **Step 2: Падает** — `npm test -- centerPoint` → FAIL.

- [x] **Step 3: Реализация** `src/shared/ui/centerPoint.js`:

```js
// centerPoint.js — 2D-джойстик для парных параметров {x, y} (Center Point,
// Position Offset). Ось X: лево→право = min→max; ось Y: верх→низ = min→max
// (экранные координаты; сверено с эталоном filtr-tool при интеграции Lumen).
export function createCenterPoint({ container, label, axes, getValue, onChange }) {
  const wrap = document.createElement('div');
  wrap.className = 'parameter-row center-point';
  wrap.innerHTML = `
    <div class="parameter-header"><span class="parameter-label"></span></div>
    <div class="center-point-body">
      <div class="center-point-pad"><div class="center-point-knob"></div></div>
      <div class="center-point-nums">
        <input type="number" class="grafema-num-input" data-axis="x">
        <input type="number" class="grafema-num-input" data-axis="y">
      </div>
    </div>`;
  wrap.querySelector('.parameter-label').textContent = label;
  container.appendChild(wrap);

  const pad = wrap.querySelector('.center-point-pad');
  const knob = wrap.querySelector('.center-point-knob');
  const numX = wrap.querySelector('input[data-axis="x"]');
  const numY = wrap.querySelector('input[data-axis="y"]');
  for (const [num, ax] of [[numX, axes.x], [numY, axes.y]]) {
    num.min = ax.min; num.max = ax.max; num.step = ax.step;
  }

  const snap = (raw, ax) => {
    const clamped = Math.min(ax.max, Math.max(ax.min, raw));
    const stepped = Math.round((clamped - ax.min) / ax.step) * ax.step + ax.min;
    return Math.min(ax.max, Math.max(ax.min, parseFloat(stepped.toFixed(6))));
  };

  function fromPointer(e) {
    const r = pad.getBoundingClientRect();
    const tx = (e.clientX - r.left) / r.width;   // 0..1
    const ty = (e.clientY - r.top) / r.height;   // 0..1
    onChange({
      x: snap(axes.x.min + tx * (axes.x.max - axes.x.min), axes.x),
      y: snap(axes.y.min + ty * (axes.y.max - axes.y.min), axes.y),
    });
    refresh();
  }

  let dragging = false;
  pad.addEventListener('pointerdown', (e) => {
    dragging = true;
    pad.setPointerCapture?.(e.pointerId);
    fromPointer(e);
  });
  pad.addEventListener('pointermove', (e) => { if (dragging) fromPointer(e); });
  pad.addEventListener('pointerup', () => { dragging = false; });

  function numHandler(axis, ax) {
    return (e) => {
      const n = parseFloat(e.target.value);
      if (!Number.isFinite(n)) return;
      const v = getValue();
      onChange({ x: v.x, y: v.y, [axis]: snap(n, ax) });
      refresh();
    };
  }
  numX.addEventListener('input', numHandler('x', axes.x));
  numY.addEventListener('input', numHandler('y', axes.y));

  function refresh() {
    const v = getValue();
    const px = (v.x - axes.x.min) / (axes.x.max - axes.x.min);
    const py = (v.y - axes.y.min) / (axes.y.max - axes.y.min);
    knob.style.left = `${px * 100}%`;
    knob.style.top = `${py * 100}%`;
    numX.value = v.x;
    numY.value = v.y;
  }

  return { refresh };
}
```

- [x] **Step 4: CSS** (в конец grafema style.css):

```css
/* ============ CenterPoint 2D pad ============ */
.center-point-body { display: flex; gap: 10px; align-items: flex-start; }
.center-point-pad {
  position: relative; width: 84px; height: 84px; flex: none;
  border-radius: 8px; background: rgba(0, 0, 0, 0.06);
  background-image: linear-gradient(rgba(0,0,0,.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,.08) 1px, transparent 1px);
  background-size: 21px 21px; background-position: center;
  cursor: crosshair; touch-action: none;
}
.center-point-knob {
  position: absolute; width: 12px; height: 12px; border-radius: 50%;
  background: #fff; border: 2px solid #555;
  transform: translate(-50%, -50%); pointer-events: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}
.center-point-nums { display: flex; flex-direction: column; gap: 6px; flex: 1; }
```

- [x] **Step 5: Прогнать** — `npm test -- centerPoint` → PASS; точечный eslint на своих файлах.

- [x] **Step 6: Commit (grafema, только свои файлы)**

```bash
cd /Users/andy/Documents/GitHub/grafema
git add src/shared/ui/centerPoint.js src/shared/ui/__tests__/centerPoint.test.js src/css/style.css
git commit -m "feat(shared): CenterPoint 2D pad control"
```

---

### Task 3 (grafema): GradientMapper (+ чистая модель)

**Files (в /Users/andy/Documents/GitHub/grafema):**
- Create: `src/shared/ui/gradientModel.js`, `src/shared/ui/gradientMapper.js`
- Test: `src/shared/ui/__tests__/gradientModel.test.js`, `src/shared/ui/__tests__/gradientMapper.test.js`
- Modify: `src/css/style.css`

- [x] **Step 1: Тест модели** (`src/shared/ui/__tests__/gradientModel.test.js`):

```js
import { describe, it, expect } from 'vitest';
import {
  GRADIENT_MIN_STOPS, GRADIENT_MAX_STOPS,
  sortStops, addStop, removeStop, moveStop, stopsToCss,
} from '../gradientModel.js';

const bw = () => ([
  { time: 0, value: { r: 255, g: 255, b: 255, a: 1 } },
  { time: 1, value: { r: 0, g: 0, b: 0, a: 1 } },
]);

describe('gradient model', () => {
  it('constants', () => {
    expect(GRADIENT_MIN_STOPS).toBe(2);
    expect(GRADIENT_MAX_STOPS).toBe(16);
  });

  it('addStop inserts interpolated stop at time, keeps sort order', () => {
    const g = bw();
    const idx = addStop(g, 0.5);
    expect(g).toHaveLength(3);
    expect(g[idx].time).toBe(0.5);
    expect(g[idx].value.r).toBeCloseTo(127.5, 1); // интерполяция соседей
    expect(g[idx].value.a).toBe(1);
    expect(g.map((s) => s.time)).toEqual([0, 0.5, 1]);
  });

  it('addStop refuses beyond max', () => {
    const g = bw();
    for (let i = 0; i < 20; i++) addStop(g, (i + 1) / 22);
    expect(g.length).toBe(GRADIENT_MAX_STOPS);
  });

  it('removeStop refuses below min', () => {
    const g = bw();
    expect(removeStop(g, 0)).toBe(false);
    expect(g).toHaveLength(2);
    addStop(g, 0.5);
    expect(removeStop(g, 1)).toBe(true);
    expect(g).toHaveLength(2);
  });

  it('moveStop clamps time to 0..1 and resorts, returning new index', () => {
    const g = bw();
    const i = addStop(g, 0.5);
    const newIdx = moveStop(g, i, 1.7);
    expect(g[newIdx].time).toBe(1);
    expect(g.map((s) => s.time)).toEqual([0, 1, 1]);
  });

  it('stopsToCss renders a css linear-gradient stop list', () => {
    expect(stopsToCss(bw())).toBe(
      'rgba(255,255,255,1) 0%, rgba(0,0,0,1) 100%',
    );
  });

  it('sortStops is stable for equal times', () => {
    const g = [
      { time: 0.5, value: { r: 1, g: 0, b: 0, a: 1 } },
      { time: 0.5, value: { r: 2, g: 0, b: 0, a: 1 } },
    ];
    sortStops(g);
    expect(g[0].value.r).toBe(1);
  });
});
```

- [x] **Step 2: Реализация модели** `src/shared/ui/gradientModel.js`:

```js
// gradientModel.js — чистая модель мультистопового градиента.
// Контракт данных (пайплайн Lumen, packGradient):
// [{ time: 0..1, value: { r: 0-255, g: 0-255, b: 0-255, a: 0-1 } }], sorted.
export const GRADIENT_MIN_STOPS = 2;
export const GRADIENT_MAX_STOPS = 16;

export function sortStops(stops) {
  // стабильная сортировка по time
  const indexed = stops.map((s, i) => [s, i]);
  indexed.sort((a, b) => a[0].time - b[0].time || a[1] - b[1]);
  for (let i = 0; i < stops.length; i++) stops[i] = indexed[i][0];
  return stops;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Цвет градиента в точке t (линейная интерполяция соседей). */
export function sampleAt(stops, t) {
  if (t <= stops[0].time) return { ...stops[0].value };
  const last = stops[stops.length - 1];
  if (t >= last.time) return { ...last.value };
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (t >= a.time && t <= b.time) {
      const k = b.time === a.time ? 0 : (t - a.time) / (b.time - a.time);
      return {
        r: lerp(a.value.r, b.value.r, k),
        g: lerp(a.value.g, b.value.g, k),
        b: lerp(a.value.b, b.value.b, k),
        a: lerp(a.value.a, b.value.a, k),
      };
    }
  }
  return { ...last.value };
}

/** Вставляет стоп в t с интерполированным цветом; возвращает его индекс или -1. */
export function addStop(stops, t) {
  if (stops.length >= GRADIENT_MAX_STOPS) return -1;
  const time = Math.min(1, Math.max(0, t));
  stops.push({ time, value: sampleAt(stops, time) });
  sortStops(stops);
  return stops.findIndex((s) => s.time === time);
}

/** Удаляет стоп по индексу; false если стопов минимум. */
export function removeStop(stops, index) {
  if (stops.length <= GRADIENT_MIN_STOPS) return false;
  stops.splice(index, 1);
  return true;
}

/** Двигает стоп по времени (кламп 0..1), пересортировывает; новый индекс. */
export function moveStop(stops, index, t) {
  const stop = stops[index];
  stop.time = Math.min(1, Math.max(0, t));
  sortStops(stops);
  return stops.indexOf(stop);
}

export function stopsToCss(stops) {
  return stops
    .map((s) => `rgba(${Math.round(s.value.r)},${Math.round(s.value.g)},${Math.round(s.value.b)},${s.value.a}) ${s.time * 100}%`)
    .join(', ');
}
```

- [x] **Step 3: Тест DOM-компонента** (`src/shared/ui/__tests__/gradientMapper.test.js`):

```js
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGradientMapper } from '../gradientMapper.js';

describe('createGradientMapper', () => {
  let container, onChange, gradient, gm, strip;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    gradient = [
      { time: 0, value: { r: 255, g: 255, b: 255, a: 1 } },
      { time: 1, value: { r: 0, g: 0, b: 0, a: 1 } },
    ];
    onChange = vi.fn();
    gm = createGradientMapper({
      container, label: 'Gradient',
      getStops: () => gradient, onChange,
    });
    gm.refresh();
    strip = container.querySelector('.gradient-strip');
    strip.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 20, right: 200, bottom: 20 });
  });

  it('renders a marker per stop and a preview strip', () => {
    expect(container.querySelectorAll('.gradient-marker')).toHaveLength(2);
    expect(strip.style.background).toContain('linear-gradient');
  });

  it('double-click on strip adds an interpolated stop and fires onChange', () => {
    strip.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, clientX: 100, clientY: 10 }));
    expect(gradient).toHaveLength(3);
    expect(gradient[1].time).toBeCloseTo(0.5, 2);
    expect(onChange).toHaveBeenCalled();
  });

  it('selecting a marker exposes color/alpha editors; remove honors min-2', () => {
    const markers = container.querySelectorAll('.gradient-marker');
    markers[0].dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 0, clientY: 10 }));
    markers[0].dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
    const removeBtn = container.querySelector('.gradient-remove');
    expect(removeBtn).toBeTruthy();
    removeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(gradient).toHaveLength(2); // ниже минимума не удаляет
  });

  it('color input edits selected stop (0-255 channels preserved)', () => {
    container.querySelectorAll('.gradient-marker')[0]
      .dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 0, clientY: 10 }));
    const color = container.querySelector('.gradient-editor input[type="color"]');
    color.value = '#ff0000';
    color.dispatchEvent(new Event('input', { bubbles: true }));
    expect(gradient[0].value).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(onChange).toHaveBeenCalled();
  });

  it('dragging a marker moves its time (clamped)', () => {
    const m = container.querySelectorAll('.gradient-marker')[0];
    m.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 0, clientY: 10 }));
    strip.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 60, clientY: 10 }));
    strip.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
    expect(gradient.some((s) => Math.abs(s.time - 0.3) < 0.02)).toBe(true);
  });
});
```

- [x] **Step 4: Реализация** `src/shared/ui/gradientMapper.js`:

```js
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
```

- [x] **Step 5: CSS** (в конец grafema style.css):

```css
/* ============ GradientMapper ============ */
.gradient-strip {
  height: 18px; border-radius: 5px; cursor: copy;
  border: 1px solid rgba(0, 0, 0, 0.12); touch-action: none;
}
.gradient-markers { position: relative; height: 14px; margin-top: 2px; }
.gradient-marker {
  position: absolute; top: 0; width: 10px; height: 12px;
  transform: translateX(-50%); cursor: ew-resize;
  border: 2px solid #555; border-radius: 3px;
}
.gradient-marker.is-selected { border-color: #000; box-shadow: 0 0 0 2px rgba(0,0,0,.15); }
.gradient-editor { display: flex; gap: 6px; align-items: center; margin-top: 6px; }
.gradient-editor input[type="color"] { width: 34px; height: 24px; flex: none; }
.gradient-editor input[type="range"] { flex: 1; }
.gradient-editor input[type="number"] { width: 58px; flex: none; }
.gradient-remove { flex: none; padding: 2px 8px; }
```

- [x] **Step 6: Прогнать** — `npm test -- gradient` → PASS (обе сюиты); точечный eslint.

- [x] **Step 7: Commit (grafema, только свои файлы)**

```bash
cd /Users/andy/Documents/GitHub/grafema
git add src/shared/ui/gradientModel.js src/shared/ui/gradientMapper.js src/shared/ui/__tests__/gradientModel.test.js src/shared/ui/__tests__/gradientMapper.test.js src/css/style.css
git commit -m "feat(shared): GradientMapper multi-stop editor with pure model"
```

---

### Task 4 (lumen): Вендоринг компонентов + CSS

**Files (в /Users/andy/Documents/GitHub/lumen):**
- Create: `src/shared/ui/layerList.js`, `src/shared/ui/centerPoint.js`, `src/shared/ui/gradientMapper.js`, `src/shared/ui/gradientModel.js` (+ их тесты в `src/shared/utils/`-стиле lumen: тесты кладём рядом с исходником, `src/shared/ui/*.test.js`)
- Modify: `src/css/style.css` (3 CSS-блока в конец)

- [x] **Step 1: Копирование**

```bash
cd /Users/andy/Documents/GitHub/lumen
for f in layerList.js centerPoint.js gradientMapper.js gradientModel.js; do
  cp "/Users/andy/Documents/GitHub/grafema/src/shared/ui/$f" "src/shared/ui/$f"
done
for f in layerList centerPoint gradientMapper gradientModel; do
  cp "/Users/andy/Documents/GitHub/grafema/src/shared/ui/__tests__/$f.test.js" "src/shared/ui/$f.test.js"
  # поправить относительный импорт: '../layerList.js' → './layerList.js'
  sed -i '' "s|from '../$f.js'|from './$f.js'|" "src/shared/ui/$f.test.js"
done
```
Проверить diff -q каждого исходника против grafema (идентичны), у тестов — только строка импорта.

ВНИМАНИЕ: lumen'овский panelBuilder (копия divix) может НЕ экспортировать `escapeHtml`, который импортирует layerList.js. Проверить `grep -n escapeHtml src/shared/ui/panelBuilder.js`; если нет — скопировать функцию `escapeHtml` из grafema panelBuilder в lumen panelBuilder (добавить export, БЕЗ других изменений) и отметить в отчёте.

- [x] **Step 2: CSS** — дописать в конец lumen `src/css/style.css` все три блока из Tasks 1/2/3 дословно (LayerList, CenterPoint, GradientMapper).

- [x] **Step 3: Прогнать** — `npm test` (новые тесты подхватятся: +4 файла) и `npm run lint` → чисто.

- [x] **Step 4: Commit**

```bash
git add src/shared/ui src/css/style.css
git commit -m "feat: vendor LayerList, CenterPoint and GradientMapper from grafema"
```

---

### Task 5 (lumen): Option-таблицы + схемы контролов модулей (TDD)

**Files:**
- Create: `src/js/modules/optionTables.js`
- Modify: `src/js/modules/fillColor.js`, `fillGradient.js`, `fillMedia.js`, `fillNoise.js`
- Test: дополнить `src/js/modules/fills.test.js`

Схемы — дословная транскрипция panels из `reference/filtr/modules.js` (тип `number`→`slider`, `bool`→`check`; `separator` опускаем; `interval` → ДВА слайдера `threshold.min`/`threshold.max`; `media` → `select` c опциями из имён DEFAULT_MEDIA; `point2d` → `centerPoint` с осями из reference; `gradient` → `gradientMapper`).

- [x] **Step 1: Тесты** — добавить в `src/js/modules/fills.test.js`:

```js
import { getByPath } from '../../shared/ui/panelBuilder.js';
import { BLEND_MODES, WRAP_MODES, ALPHA_MODES, GRADIENT_MODES } from './optionTables.js';

describe('option tables (verbatim from reference)', () => {
  it('blend modes: 26 entries Normal..Luminosity', () => {
    expect(Object.keys(BLEND_MODES)).toHaveLength(26);
    expect(BLEND_MODES.Normal).toBe(0);
    expect(BLEND_MODES.Luminosity).toBe(25);
  });
  it('wrap/alpha/gradient modes', () => {
    expect(WRAP_MODES).toEqual({ CLAMP: 0, REPEAT: 1, MIRROR: 2, TRANSPARENT: 3 });
    expect(ALPHA_MODES).toEqual({ 'Ignore Source Alpha': 0, 'Fade by Source Alpha': 1 });
    expect(GRADIENT_MODES).toEqual({ Linear: 0, Radial: 1, Angular: 2, Box: 3, Triangle: 4 });
  });
});

describe('module control schemas', () => {
  it('every module declares controls and every path resolves into defaults', () => {
    for (const def of Object.values(MODULES)) {
      expect(Array.isArray(def.controls)).toBe(true);
      expect(def.controls.length).toBeGreaterThan(0);
      for (const c of def.controls) {
        expect(getByPath(def.defaults, c.path)).not.toBeUndefined();
      }
    }
  });
  it('fillGradient has gradientMapper + centerPoint with reference axes', () => {
    const cs = MODULES.fillGradient.controls;
    expect(cs.find((c) => c.type === 'gradientMapper')?.path).toBe('gradient');
    const cp = cs.find((c) => c.type === 'centerPoint');
    expect(cp.path).toBe('gradCenter');
    expect(cp.axes.x).toEqual({ min: -0.5, max: 0.5, step: 0.01 });
  });
  it('fillMedia position axes are ±50 (reference), image is a select over DEFAULT_MEDIA', () => {
    const cs = MODULES.fillMedia.controls;
    expect(cs.find((c) => c.path === 'position')?.axes.x).toEqual({ min: -50, max: 50, step: 0.1 });
    const img = cs.find((c) => c.path === 'image');
    expect(img.type).toBe('select');
    expect(Object.values(img.options)).toContain('text0');
  });
  it('fillNoise threshold is two sliders (interval transcription)', () => {
    const cs = MODULES.fillNoise.controls;
    expect(cs.find((c) => c.path === 'threshold.min')).toBeTruthy();
    expect(cs.find((c) => c.path === 'threshold.max')).toBeTruthy();
  });
});
```

(Ожидание `getByPath(defaults, 'gradCenter')` для centerPoint-контрола: path указывает на объект `{x, y}` — не undefined, тест валиден. То же `position`, `gradient`.)

- [x] **Step 2: Падают** — `npm test -- fills` → FAIL.

- [x] **Step 3: `src/js/modules/optionTables.js`** — дословно из reference/filtr/modules.js (BLEND_MODES 26 записей Normal:0…Luminosity:25 — скопировать оттуда полностью; WRAP_MODES/ALPHA_MODES/GRADIENT_MODES как в тесте выше). Шапка-комментарий со ссылкой на reference.

- [x] **Step 4: Схемы `controls` в модулях.** Каждому модулю добавить поле `controls` (массив). Общие первые два контрола у всех:

```js
    { type: 'select', path: 'blendMode', label: 'Blending Mode', options: BLEND_MODES },
    { type: 'slider', path: 'mix', label: 'Pass Mix', min: 0, max: 1, step: 0.01 },
```

`fillColor` дальше: `{ type: 'color', path: 'color', label: 'Color' }`, `{ type: 'select', path: 'alphaMode', label: 'Alpha Mode', options: ALPHA_MODES }`.

`fillGradient` дальше (по reference): select gradMode (GRADIENT_MODES, label 'Gradient Mode'); `{ type: 'gradientMapper', path: 'gradient', label: 'Gradient' }`; select alphaMode; slider gradScale 0.01..3 step 0.01 label 'Gradient Scale' + `showIf: { path: 'gradMode', notEquals: 2 }`; slider gradAngle -180..180 step 1 label 'Gradient Angle'; check gradReverse label 'Reverse Gradient'; `{ type: 'centerPoint', path: 'gradCenter', label: 'Center Point', axes: { x: { min: -0.5, max: 0.5, step: 0.01 }, y: { min: -0.5, max: 0.5, step: 0.01 } } }`; select wrapMode (WRAP_MODES, label 'Wrapping Mode').

`fillMedia` дальше: `{ type: 'select', path: 'image', label: 'Texture', options: <карта имя→имя из Object.keys(DEFAULT_MEDIA)> }` (импортировать DEFAULT_MEDIA из '../assets.js', собрать `Object.fromEntries(Object.keys(DEFAULT_MEDIA).map(k => [k, k]))` на уровне модуля); slider scale 1..250 step 0.1 label 'Scale Image'; slider rotate -180..180 step 1 label 'Rotate Image'; `{ type: 'centerPoint', path: 'position', label: 'Position Offset', axes: { x: { min: -50, max: 50, step: 0.1 }, y: { min: -50, max: 50, step: 0.1 } } }`; select wrapMode.

`fillNoise` дальше: slider threshold.min 0..1 step 0.01 label 'Luma Threshold Min'; slider threshold.max 0..1 step 0.01 label 'Luma Threshold Max'; slider contrast 0.5..5 step 0.01 label 'Grain Contrast'; check colorNoise label 'Color Noise'; slider size 1..10 step 0.1 label 'Grain Size'; select alphaMode; slider fps 0..60 step 1 label 'Animation (FPS)'.

- [x] **Step 5: Прогнать** — `npm test` → PASS все; `npm run lint`; сверка дефолтов из фазы 3 (`node`-скрипт сравнения) по-прежнему 4 × OK (controls её не трогает).

- [x] **Step 6: Commit**

```bash
git add src/js/modules
git commit -m "feat: module control schemas and option tables from reference"
```

---

### Task 6 (lumen): Панель Layers + инспектор (замена dev-UI)

**Files:**
- Create: `src/js/inspector.js`, `src/js/layersPanel.js`
- Modify: `src/js/main.js`, `src/js/controls.js`, `src/js/stack.js` (+ `src/js/stack.test.js`), `src/js/state.js` (убрать ui.devModule)

- [x] **Step 1: TDD duplicateModule/moveModule** — добавить в `src/js/stack.test.js`:

```js
import { duplicateModule, moveModule } from './stack.js';

describe('duplicateModule', () => {
  it('clones instance with fresh id right after the original', () => {
    const s = createDefaultState();
    const a = addModule(s, 'fillColor');
    const b = addModule(s, 'fillNoise');
    a.params.mix = 0.42;
    const dup = duplicateModule(s, a.id);
    expect(s.stack.map((m) => m.id)).toEqual([a.id, dup.id, b.id]);
    expect(dup.module).toBe('fillColor');
    expect(dup.params.mix).toBe(0.42);
    dup.params.mix = 1;
    expect(a.params.mix).toBe(0.42); // независимая копия
  });
});

describe('moveModule', () => {
  it('moves instance between indices', () => {
    const s = createDefaultState();
    const a = addModule(s, 'fillColor');
    const b = addModule(s, 'fillGradient');
    const c = addModule(s, 'fillNoise');
    moveModule(s, 0, 2);
    expect(s.stack.map((m) => m.id)).toEqual([b.id, c.id, a.id]);
  });
});
```

Реализация в `src/js/stack.js`:

```js
export function duplicateModule(state, id) {
  const i = state.stack.findIndex((m) => m.id === id);
  if (i < 0) return null;
  const src = state.stack[i];
  const inst = {
    ...structuredClone(src),
    id: createModuleInstance(src.module, state.stack.map((m) => m.id)).id,
  };
  state.stack.splice(i + 1, 0, inst);
  return inst;
}

export function moveModule(state, fromIndex, toIndex) {
  const [inst] = state.stack.splice(fromIndex, 1);
  state.stack.splice(toIndex, 0, inst);
}
```

- [x] **Step 2: `src/js/layersPanel.js`** — секция Layers для левой панели:

```js
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
```

- [x] **Step 3: `src/js/inspector.js`** — инспектор выбранного слоя:

```js
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

  const custom = []; // refresh-ссылки кастом-контролов
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
      custom.push(cp);
    } else if (c.type === 'gradientMapper') {
      const gm = createGradientMapper({
        container: content,
        label: c.label,
        getStops: () => getByPath(inst.params, c.path),
        onChange: () => onParamChange(),
      });
      gm.refresh();
      custom.push(gm);
    } else {
      const row = panel.buildControl({ ...c, id: controlId(c) });
      content.appendChild(row);
    }
  }
  refreshVisibility();
}
```

(panelBuilder.buildControl ожидает `ctrl.id` и `ctrl.path` — они переданы; slider/check/select/color уже реализованы.)

- [x] **Step 4: Перепаять `src/js/main.js`:**
- удалить импорт addModule и ветки lm-stack-add/lm-stack-clear из applyChange (Canvas-ветки buffer/animation остаются);
- удалить из `src/js/controls.js` секцию 'Stack (dev)' целиком; из `src/js/state.js` — поле `ui.devModule`;
- в buildUI после `panel.buildSections(root, LEFT_SECTIONS)`:

```js
  layersPanel = buildLayersSection(root, {
    state,
    onStackChange() {
      api?.scheduler.requestRender();
      saveState();
    },
    onSelect() {
      renderInspector(document.getElementById('lm-inspector'), {
        state,
        onParamChange() {
          api?.scheduler.requestRender();
          saveState();
        },
      });
    },
  });
  openSections(root, [0, 1]);
```
- при старте после loadState: вызвать `onSelect()`-эквивалент один раз (отрисовать пустой инспектор), объявить `let layersPanel = null;` на уровне модуля;
- импорты: `import { buildLayersSection } from './layersPanel.js'; import { renderInspector } from './inspector.js';`.

- [x] **Step 5: Прогнать** — `npm run lint && npm test && npm run build` → чисто; dev-сервер `npm run dev -- --port 3211 --strictPort` (3000/3210 могут быть заняты) → curl 200 → убить. Поведение в браузере проверяет контроллер.

- [x] **Step 6: Commit**

```bash
git add src/js
git commit -m "feat: Layers panel with LayerList and per-layer inspector"
```

---

### Task 7: Сквозной DoD (контроллер, браузер)

Проверяется контроллером после Task 6 (не субагентом):

- [x] Layers: Add To Stack добавляет слой и выделяет его; инспектор справа показывает схему модуля.
- [x] Слайдер mix, select blendMode, color — меняют рендер мгновенно.
- [x] CenterPoint у fillGradient двигает центр градиента (направление осей сверить с эталоном: gradCenter y=+0.3 в эталоне и в Lumen смещают центр в одну сторону).
- [x] GradientMapper: dblclick добавляет стоп, цвет стопа меняет градиент, remove не даёт < 2 стопов.
- [x] Глаз выключает слой (рендер без него), дубль копирует с параметрами, корзина удаляет, drag-reorder меняет порядок пассов (виден в рендере).
- [x] showIf: gradScale скрывается при gradMode=Angular (2).
- [x] Persistence: стек+параметры живут после reload; выделение сбрасывается (ui не сериализуется) — это норм.
- [x] fillNoise threshold-слайдеры и fps работают.
- [x] `npm run lint && npm test && npm run build` в lumen; `npm test` в grafema.
- [x] Чекбоксы плана отмечает контроллер.

## Definition of Done (фаза 4)
Всё из Task 7 зелёное; grafema-компоненты закоммичены в grafema (3 коммита, чужие vertice-правки не тронуты); dev-секция и ui.devModule удалены; тестов в lumen ≥ 70.
