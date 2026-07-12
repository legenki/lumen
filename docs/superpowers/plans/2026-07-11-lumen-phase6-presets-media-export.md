# Lumen Phase 6: Preset UI + Custom Media + MP4 Export + Mask Drag Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** UI пресетов (dropdown встроенных + user-пресеты + импорт/экспорт JSON), загрузка пользовательских медиа-файлов в реестр, drag слоёв в/из MASK-группы (мутация maskMembers), MP4-экспорт по образцу divix (h264-mp4-encoder). После фазы Lumen — полностью самодостаточное приложение, эталонная сверка возможна на любом пресете.

**Architecture:** Пресеты храним в `state.userPresets` (persisted) как массив в старом v2-формате — это позволяет одноимённо использовать `applyPresetToState` из фазы 5. Медиа-реестр расширяем API `add(key, url, name)`/`remove(key)`; пользовательские URL — `URL.createObjectURL(File)`, реестр держит ссылку до `revoke` при удалении. LayerList reorder получает второй режим: если drop над строкой-маской или её членом — целевой слой добавляется/удаляется из `maskMembers` до/после сжатия/расширения группы; дисплей-модель `buildLayerRows` уже умеет отрисовку. MP4 — вендоринг divix-утилиты `exportMedia.exportMP4` c `drawComposite()` = `p.redraw()` (наш dirty-flag scheduler отжигается перед экспортом через `scheduler.setAnimating(false)`).

**Tech Stack:** vanilla DOM + presetIO из divix (существует), h264-mp4-encoder (лениво загружается тем же ensureHME из divix), HTML5 file input, URL.createObjectURL, HTML5 Drag&Drop (уже в LayerList).

**Контекст для исполнителя без предыстории:**
- Repo: `/Users/andy/Documents/GitHub/lumen` (main, коммитить разрешено). Фазы 1-5 готовы: 19 модулей, пресеты в `src/js/presets.js` + `presetConvert.js` (`convertOldPreset`, `applyPresetToState`), LayerList (`src/shared/ui/layerList.js`) с drag & drop, media-реестр (`src/js/media.js`), пайплайн v2 с MASK.
- Образцы кода: divix `/Users/andy/Documents/GitHub/divix/src/shared/utils/{presetIO.js,exportMedia.js,lazyLibs.js}` — вендорить целиком копированием, потом дописать под lumen.
- Панельный helper для пресетов: `src/shared/ui/panelBuilder.js` уже экспортирует `buildPresetSection(root, { idPrefix, presets, onExport, onImport, ... })` — используем его для встроенных.
- Инварианты (страж-тесты не отменяются): `src/js/modules/referenceParity.test.js` 19/19; «every control has a path» во всех *.group.test.js; separator не переносить в схемы; run()-хуки рисуют через `ctx.glc.shader/rect`; showIf формы (notEquals/equals/in) уже работают.
- Дефолт media-хранилища: только 21 встроенный webp+png (см. `src/js/assets.js` DEFAULT_MEDIA). Пользовательские кладём в reg — они НЕ в DEFAULT_MEDIA.

---

### Task 1: Расширение медиа-реестра (add/remove + persistence-hooks)

**Files:**
- Modify: `src/js/media.js`, `src/js/media.test.js`

- [x] **Step 1: Тесты** — добавить в `src/js/media.test.js`:

```js
describe('add / remove', () => {
  it('add() inserts a user entry with generated key and marks it ready synchronously', () => {
    const reg = createMediaRegistry({}, fakeLoader());
    const entry = reg.add({ url: 'blob:user-a', name: 'Photo.png', width: 640, height: 400 });
    expect(entry.key).toMatch(/^user_/);
    expect(entry.ready).toBe(true);
    expect(entry.name).toBe('Photo.png');
    expect(entry.res).toEqual([640, 400]);
    expect(reg.get(entry.key)).toBe(entry);
  });
  it('remove() drops the entry and calls revokeObjectURL for blob: urls only', () => {
    const revoked = [];
    const spy = { revokeObjectURL: (u) => revoked.push(u) };
    const reg = createMediaRegistry({}, fakeLoader(), { url: spy });
    const a = reg.add({ url: 'blob:a', name: 'A', width: 2, height: 2 });
    const b = reg.add({ url: 'https://foo/b.png', name: 'B', width: 2, height: 2 });
    reg.remove(a.key);
    reg.remove(b.key);
    expect(reg.get(a.key)).toBeUndefined();
    expect(revoked).toEqual(['blob:a']);
  });
  it('keys() lists all current entries', () => {
    const reg = createMediaRegistry({}, fakeLoader());
    reg.add({ url: 'blob:x', name: 'X', width: 1, height: 1 });
    expect(reg.keys()).toEqual(expect.arrayContaining([expect.stringMatching(/^user_/)]));
  });
});
```

- [x] **Step 2:** `npm test -- media` → FAIL (методов нет).

- [x] **Step 3:** дополнить `src/js/media.js` (совместимо с фазой 3):

```js
export function createMediaRegistry(sources, loadImage, deps = {}) {
  const entries = new Map();
  const jobs = [];
  const revokeObjectURL = deps.url?.revokeObjectURL ?? ((u) => URL.revokeObjectURL(u));
  let userCounter = 0;

  for (const [key, url] of Object.entries(sources)) {
    const entry = { key, url, ready: false, tex: null, res: [0, 0], name: key, user: false };
    entries.set(key, entry);
    jobs.push(
      new Promise((resolve) => {
        loadImage(
          url,
          (img) => {
            entry.tex = img;
            entry.res[0] = img.width;
            entry.res[1] = img.height;
            entry.ready = true;
            resolve();
          },
          (err) => {
            console.warn(`[lumen] media load failed: ${key}`, err);
            resolve();
          },
        );
      }),
    );
  }
  const all = Promise.all(jobs);

  function add({ url, name, width, height, tex = null }) {
    userCounter += 1;
    const key = `user_${userCounter}_${Date.now().toString(36)}`;
    const entry = {
      key, url, name, user: true,
      ready: true, tex, res: [width, height],
    };
    entries.set(key, entry);
    return entry;
  }

  function remove(key) {
    const entry = entries.get(key);
    if (!entry) return;
    if (entry.user && typeof entry.url === 'string' && entry.url.startsWith('blob:')) {
      revokeObjectURL(entry.url);
    }
    entries.delete(key);
  }

  return {
    get: (key) => entries.get(key),
    keys: () => Array.from(entries.keys()),
    whenReady: () => all,
    add,
    remove,
  };
}
```

- [x] **Step 4:** `npm test` → PASS все; lint чистый; регистр 19/19.

- [x] **Step 5: Commit**

```bash
git add src/js/media.js src/js/media.test.js
git commit -m "feat: media registry add/remove for user assets"
```
+ трейлер `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 2: Вендоринг presetIO из divix + Media-панель загрузки

**Files:**
- Copy: `src/shared/utils/presetIO.js` (из divix, дословно)
- Create: `src/js/mediaPanel.js`, `src/js/mediaPanel.test.js`
- Modify: `src/js/main.js` (встройка секции Media), `src/js/controls.js` (LEFT_SECTIONS остаётся Canvas — Media строит свой panel-section отдельно, как Layers).

- [x] **Step 1: Вендоринг presetIO** — `cp /Users/andy/Documents/GitHub/divix/src/shared/utils/presetIO.js src/shared/utils/presetIO.js`; сверить `cmp` — байт-идентичен.

- [x] **Step 2: `src/js/mediaPanel.js`** — секция Media в левой панели: список текущих user-медиа + кнопка «Add Image» + `<input type="file" accept="image/*" hidden>`. При выборе файла: создаётся `p.loadImage(URL.createObjectURL(file), (img) => media.add({ url: img.canvas?.toDataURL?.() ?? URL.createObjectURL(file), name: file.name, width: img.width, height: img.height, tex: img }))` — суть: p5 грузит blob как обычную картинку, из неё получаем ширину/высоту, передаём p5.Image как `tex` в реестр. Удаление слота — кнопкой «×» на строке; фильтруем только user-слоты (dust-in — DEFAULT_MEDIA не показываем в списке).

```js
// src/js/mediaPanel.js — секция Media (левая панель): список user-слотов
// и загрузка новых через file picker. DEFAULT_MEDIA не редактируем.
export function buildMediaSection(root, { p, media, onChange }) {
  const sec = document.createElement('section');
  sec.className = 'panel-section';
  sec.innerHTML = `
    <h2 class="section-title"><span>Media</span>
      <svg class="chevron-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
    </h2>
    <div class="section-content">
      <div class="parameter-row" id="lm-media-list"></div>
      <div class="parameter-row">
        <button id="lm-media-add" class="btn btn-secondary" style="width:100%;">Add Image</button>
        <input type="file" id="lm-media-file" accept="image/*" hidden multiple>
      </div>
    </div>`;
  sec.querySelector('.section-title').addEventListener('click', () => sec.classList.toggle('collapsed'));
  root.appendChild(sec);

  const list = sec.querySelector('#lm-media-list');
  const btn = sec.querySelector('#lm-media-add');
  const input = sec.querySelector('#lm-media-file');

  function refresh() {
    list.innerHTML = '';
    const userKeys = media.keys().filter((k) => media.get(k).user);
    if (userKeys.length === 0) {
      list.innerHTML =
        '<p style="opacity:.5;padding:6px 0;font-size:12px;">No user images loaded yet.</p>';
      return;
    }
    for (const key of userKeys) {
      const entry = media.get(key);
      const row = document.createElement('div');
      row.className = 'media-row';
      row.innerHTML = `
        <span class="media-key">${entry.name}</span>
        <button class="media-remove" data-key="${key}" title="Remove">×</button>`;
      list.appendChild(row);
    }
    list.querySelectorAll('.media-remove').forEach((b) => {
      b.addEventListener('click', () => {
        media.remove(b.dataset.key);
        refresh();
        onChange();
      });
    });
  }

  btn.addEventListener('click', () => input.click());
  input.addEventListener('change', () => {
    const files = Array.from(input.files ?? []);
    for (const file of files) loadOne(file);
    input.value = '';
  });

  function loadOne(file) {
    const url = URL.createObjectURL(file);
    p.loadImage(url, (img) => {
      media.add({
        url,
        name: file.name,
        width: img.width,
        height: img.height,
        tex: img,
      });
      refresh();
      onChange();
    }, () => {
      URL.revokeObjectURL(url);
      console.warn('[lumen] failed to load image:', file.name);
    });
  }

  refresh();
  return { refresh };
}
```

- [x] **Step 3: Тесты** (`src/js/mediaPanel.test.js`, `// @vitest-environment jsdom`): контейнер + fake media-реестр (реализующий keys/get/add/remove) + fake `p.loadImage` (сразу вызывает ok(img)); проверить: рендер пустого состояния; клик по «Add Image» триггерит input.click (стаббай через vi.fn); simulate change с fake File → media.add вызван с width/height из img; клик × вызывает media.remove и onChange; сборка «media.keys() returns non-user default keys, но список показывает только user».

- [x] **Step 4:** Встройка в `src/js/main.js` — после `buildLayersSection` до `openSections`:

```js
import { buildMediaSection } from './mediaPanel.js';
// ...
const mediaPanel = buildMediaSection(root, {
  p: api?.getP?.() ?? null,
  media,
  onChange() {
    api?.scheduler.requestRender();
    // user-слоты НЕ сериализуем (blob:-URL живут в памяти сессии) — persistence не трогаем
    refreshInspector(); // инспектор пересобирает media-select
  },
});
```

Здесь встаёт вопрос: где взять `media` в main.js? Сейчас реестр создаётся в `app.js` при setup и передаётся в env. Расширить api из onReady: `onReady({ scheduler, rebuildBuffer, getBuffer, syncAnimation, getMedia: () => media, getP: () => p })`. Обнови `src/js/app.js` соответственно.

`inspector.js` — media-select всегда строится из `media.keys()` (сейчас: `Object.keys(DEFAULT_MEDIA)`). Замена: `const options = Object.fromEntries(getMedia().keys().map((k) => [getMedia().get(k).name || k, k]));`. Пробрось `getMedia` в inspector.js через параметр `renderInspector(root, { state, getMedia, onParamChange })`.

- [x] **Step 5: CSS** — дописать в конец `src/css/style.css`:

```css
/* ============ Media panel rows ============ */
.media-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
.media-key { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12px; }
.media-remove { background: none; border: none; cursor: pointer; padding: 2px 6px; opacity: .55; font-size: 14px; }
.media-remove:hover { opacity: 1; color: #b91c1c; }
```

- [x] **Step 6:** `npm test` (все + mediaPanel) / lint / build — чистые.

- [x] **Step 7: Commit**

```bash
git add src/js/mediaPanel.js src/js/mediaPanel.test.js src/js/main.js src/js/app.js src/js/inspector.js src/shared/utils/presetIO.js src/css/style.css
git commit -m "feat: media panel for user image uploads"
```

---

### Task 3: UI пресетов (встроенные + user + import/export JSON)

**Files:**
- Create: `src/js/presetPanel.js`, `src/js/presetPanel.test.js`
- Modify: `src/js/state.js` (+`userPresets`), `src/js/state.test.js`, `src/js/main.js`
- Reuse: `src/shared/utils/presetIO.js` (Task 2)

- [x] **Step 1: state.userPresets** — TDD в `state.test.js`:

```js
  it('creates a userPresets array in persisted state', () => {
    const s = createDefaultState();
    expect(s.userPresets).toEqual([]);
  });
  it('round-trips userPresets through serialize/restore', () => {
    const s = createDefaultState();
    s.userPresets.push({ toolId: 'lumen', version: 3, name: 'My', modules: [] });
    const snap = serializeState(s);
    const t = createDefaultState();
    restoreState(t, snap);
    expect(t.userPresets).toHaveLength(1);
    expect(t.userPresets[0].name).toBe('My');
  });
```

- [x] **Step 2:** Изменения в `src/js/state.js`: `createDefaultState().userPresets = []`; `PERSISTED` теперь `['cnv', 'rec', 'stack', 'userPresets']`; `restoreState` — тот же mergeKnown-style но для `userPresets`: `if (Array.isArray(snap.userPresets)) state.userPresets = structuredClone(snap.userPresets); else state.userPresets = [];`.

- [x] **Step 3: presetPanel** — секция Presets в левой панели (использует `buildPresetSection` из panelBuilder + отдельный блок «Save As Preset» для user). API:

```js
// src/js/presetPanel.js
import { buildPresetSection } from '../shared/ui/panelBuilder.js';
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
  // Составляем карту {displayName: preset} для встроенных + пользовательских.
  const map = {};
  for (const p of PRESETS) map[p.name] = p;
  for (const p of state.userPresets) map[`★ ${p.name}`] = p;

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
    // eslint-disable-next-line no-alert
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
```

- [x] **Step 4: Тесты** (`src/js/presetPanel.test.js`, jsdom): `snapshotPreset(state, 'X').modules.length === state.stack.length` и т.д.; mask-инстанс сериализуется с `params.__maskMembers`; DOM-тест: клик Apply вызывает applyPresetToState (мок через vi.spyOn на модуль); Save As добавляет в state.userPresets; Import отвергает JSON с неизвестным модулем; Delete удаляет только с префиксом ★.

- [x] **Step 5:** Встройка в main.js — ПЕРЕД buildLayersSection: `buildPresetPanelSection(root, { state, onApply() { api?.rebuildBuffer(); api?.scheduler.requestRender(); saveState(); refreshLayers(); refreshInspector(); } });`; API layersPanel из Task 4 фазы 4 надо экспортировать хэндл, чтобы `refreshLayers` работал (внести правку в `buildLayersSection` если ещё не возвращает refresh).

- [x] **Step 6:** `npm test / lint / build`; `openSections(root, [0, 1, 2, 3])` (Presets, Media, Canvas, Layers).

- [x] **Step 7: Commit** `feat: preset panel with dropdown, save/import/export and user presets`.

---

### Task 4: Drag слоёв в/из MASK-группы

**Files:**
- Modify: `src/shared/ui/layerList.js` (+drop zones «внутрь группы»), `src/shared/ui/__tests__/layerList.test.js` — точечно
- Modify: `src/js/layersPanel.js` (обработка onReorder с расширенной сигнатурой), `src/js/layersPanel.test.js`
- Test: `src/js/layersPanel.test.js` — новые кейсы

- [x] **Step 1: Расширение callback** — в LayerList: `onReorder(fromIndex, toIndex, mode)`, где `mode ∈ 'above' | 'below' | 'into'`. По умолчанию mode='above' (совместимость с фазой 4). Добавить второй drop-target внутри строки MASK (или её member): полоса-подсказка «drop into» — визуальный класс `.layer-row.is-drop-into` при dragover в верхней/нижней половине строки-маски.

Простая реализация: строка становится drop-target с двумя зонами по вертикали: верхняя 40% → mode='above', нижняя 40% → 'below', средние 20% → 'into' (только если строка-mask). При `drop` вычисляем `mode` по event.offsetY/rect.height.

- [x] **Step 2: Юнит-тесты** в `layerList.test.js` (jsdom):

```js
  it('emits onReorder with mode "into" when dropping in the middle of a mask row', () => {
    layers = [
      { id: 'p01', label: 'Fill: Color', enabled: true, isMask: false, indent: false, badge: 0 },
      { id: 'p02', label: 'MASK', enabled: true, isMask: true, indent: false, badge: 0 },
    ];
    list.refresh();
    const items = container.querySelectorAll('.layer-row');
    // fake bounding box: y 0..40
    items[1].getBoundingClientRect = () => ({ top: 0, left: 0, width: 100, height: 40, right: 100, bottom: 40 });
    const dt = { setData: vi.fn(), getData: vi.fn(() => '0'), effectAllowed: '' };
    items[0].dispatchEvent(Object.assign(new Event('dragstart', { bubbles: true }), { dataTransfer: dt }));
    items[1].dispatchEvent(Object.assign(new MouseEvent('dragover', { bubbles: true, cancelable: true, clientY: 20 }), { dataTransfer: dt }));
    items[1].dispatchEvent(Object.assign(new MouseEvent('drop', { bubbles: true, clientY: 20 }), { dataTransfer: dt }));
    expect(cb.onReorder).toHaveBeenCalledWith(0, 1, 'into');
  });
```

Плюс: тест 'above'/'below' для не-mask строк — mode всегда 'above' или 'below' исходя из зоны.

- [x] **Step 3: Реализация в layerList.js** — заменить обработчик `drop`:

```js
li.addEventListener('drop', (e) => {
  e.preventDefault?.();
  li.classList.remove('is-drop-target', 'is-drop-into');
  const from = dragFrom >= 0 ? dragFrom : parseInt(e.dataTransfer?.getData?.('text/plain') ?? '-1', 10);
  dragFrom = -1;
  if (from < 0 || from === index) return;
  const rect = li.getBoundingClientRect();
  const y = (e.clientY ?? 0) - rect.top;
  const h = rect.height || 1;
  let mode = y < h * 0.4 ? 'above' : y > h * 0.6 ? 'below' : (layer.isMask ? 'into' : 'above');
  callbacks.onReorder?.(from, index, mode);
});
```

Плюс визуальный overlay `.is-drop-into` при dragover в средней зоне маски: обновить обработчик dragover (пересчитывать класс).

- [x] **Step 4: layersPanel.js — обработка mode**:

```js
onReorder(from, to, mode) {
  const target = state.stack[to];
  const src = state.stack[from];
  if (!target || !src) return;
  if (mode === 'into' && target.type === 'mask' && src.type === 'pass') {
    // Кладём src сразу после маски и добавляем его id в maskMembers
    moveModule(state, from, to + 1);
    if (!target.maskMembers.includes(src.id)) target.maskMembers.push(src.id);
  } else if (mode === 'above' || mode === 'below') {
    // Обычный reorder; если целевая — член какой-то маски, добавим/оставим членство соответственно
    const insertAt = mode === 'above' ? to : to + 1;
    moveModule(state, from, from < insertAt ? insertAt - 1 : insertAt);
    // Если ушли ниже последнего члена MASK, автоматически исключаемся из maskMembers
    for (const inst of state.stack) {
      if (inst.type !== 'mask') continue;
      const idx = state.stack.indexOf(inst);
      const block = new Set();
      let j = idx + 1;
      while (j < state.stack.length && inst.maskMembers.includes(state.stack[j].id)) {
        block.add(state.stack[j].id); j++;
      }
      inst.maskMembers = inst.maskMembers.filter((id) => block.has(id));
    }
  }
  onStackChange();
  layerList.refresh();
},
```

- [x] **Step 5:** Тесты `layersPanel.test.js`:
1. mode 'into' на mask → src перемещается сразу после маски + добавляется в maskMembers;
2. reorder mode 'above' переносит слой над членом маски → maskMembers пересчитываются (непрерывный блок);
3. reorder pass-слоя ВНЕ группы → maskMembers маски укорачивается.

- [x] **Step 6:** `npm test / lint / build`; браузерный смоук: собери стек fillMedia → maskMedia → colorCorrection; перетащи colorCorrection на середину строки маски → отступ «↳» появился + бейдж 1. Перетащи его вниз в конец → отступ пропал, бейдж 0.

- [x] **Step 7: Commit** `feat: drag layers into and out of MASK groups`.

---

### Task 5: Вендоринг lazyLibs + exportMedia (MP4-экспорт)

**Files:**
- Copy: `src/shared/utils/lazyLibs.js`, `src/shared/utils/exportMedia.js` (из divix)
- Modify: `src/js/main.js` (кнопка Export as MP4 в футере левой панели + длительность), `index.html` (кнопка+select seconds), `src/js/app.js` (getP)

- [x] **Step 1: Вендоринг** — `cp` двух файлов из divix; сверить `cmp` — идентичны. Инспект lazyLibs.js: он лениво загружает h264-mp4-encoder (~1.7MB, только на первом Export MP4).

- [x] **Step 2: index.html** — в футере левой панели рядом с «Export as PNG» добавить группу:

```html
<div class="btn-group" style="display:grid;grid-template-columns:1fr auto;gap:8px;">
  <button id="lm-btn-save-mp4" class="btn btn-secondary">Export as MP4</button>
  <select id="lm-mp4-length" class="grafema-select" style="min-width:64px;" title="Video length">
    <option value="2">2s</option><option value="4" selected>4s</option>
    <option value="6">6s</option><option value="8">8s</option>
    <option value="10">10s</option><option value="15">15s</option>
  </select>
</div>
```

- [x] **Step 3: Кнопка в main.js**:

```js
import { exportMP4 } from '../shared/utils/exportMedia.js';

const recVideo = { active: false, seconds: 4 };
document.getElementById('lm-mp4-length').addEventListener('change', (e) => {
  recVideo.seconds = parseInt(e.target.value, 10) || 4;
});
document.getElementById('lm-btn-save-mp4').onclick = async () => {
  if (!api) return;
  const p = api.getP();
  const glc = api.getBuffer();
  const wasAnimating = api.scheduler.isAnimating();
  await exportMP4({
    p,
    prefix: 'lumen',
    cnv: state.cnv,
    rec: state.rec,
    recVideo,
    drawComposite: () => { p.redraw(); },
    getSize: () => ({ w: glc.width, h: glc.height }),
    getCanvas: () => glc.canvas,
    setStatus,
    onDone: () => {
      api.scheduler.setAnimating(wasAnimating);
      api.scheduler.requestRender();
    },
  });
};
```

- [x] **Step 4:** Замечание про density — у нас нет cnv.density.base (divix использует его); передаём getSize напрямую от buffer'а, так что density-branch в exportMedia.js не активируется. Проверить, что exportMedia.js работает без `cnv.density` (в реализации: используется только в fallback `!getSize`; у нас всегда `getSize`). Никаких изменений в exportMedia.js.

- [x] **Step 5: Тест** — `src/js/exportMedia.smoke.test.js` минимально: подмок `exportMP4` вызовет `p.redraw()` totalFrames раз, сохранит cnv.animation и восстановит; MP4-кодировщик — за пределами теста (не грузим h264-mp4-encoder). Задача теста — убедиться в правильной обвязке main.js без запуска реального кодирования; можно ограничиться тестом что `onDone` вернёт scheduler.setAnimating.

- [x] **Step 6:** `npm test / lint / build` — чисто.

- [x] **Step 7: Ручной браузерный тест** (контроллер): применить пресет «Braindance Loop» (анимируемый); Export as MP4 4s → скачался .mp4, длительность 4с, размер >100KB, воспроизводится плеером. Прогресс отображается в export-status.

- [x] **Step 8: Commit** `feat: MP4 video export via h264-mp4-encoder (vendored from divix)`.

---

### Task 6: Финальный DoD

Проверяется контроллером:

- [x] Presets: dropdown содержит 28 built-in; применение любого меняет рендер и стек; Save As сохраняет текущий стек, Export скачивает JSON, Import принимает как встроенные (v2), так и Lumen-снимки, Delete удаляет только пользовательские.
- [x] Media: Add Image принимает файл, добавляет в реестр; user-слоты видны в media-select у fillMedia/maskMedia/displaceTexture; после reload user-слоты пропадают (blob-URL — только сессия, это документировано).
- [x] Drag: слой в середину строки MASK → индент+бейдж; вниз из группы → сбрасывается.
- [x] MP4: экспорт «Braindance Loop» 4s → .mp4 файл скачался, размер сходится, консоль без критических ошибок.
- [x] `npm run lint && npm test && npm run build` — всё зелёное; страж referenceParity 19/19; «every control has a path».
- [x] Чекбоксы плана отмечены.

## Definition of Done (фаза 6)
Все пункты Task 6 выполнены; тестов ≥ 280; персистенция user-пресетов работает; фаза Lumen формально завершается спекой (нет требований вне спецификации, кроме Optional: WebCodecs-энкодер вместо h264-mp4-encoder — вне скоупа).
