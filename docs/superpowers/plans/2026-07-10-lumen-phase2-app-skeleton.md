# Lumen Phase 2: App Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Рабочий каркас Lumen: Vite+PWA, p5 2.2.3 instance mode, двухпанельный glassmorphism-UI, state.js с persistence, dirty-flag рендер-цикл с центрированием буфера между панелями, PNG-экспорт и локальные дефолтные ассеты.

**Architecture:** Standalone-приложение по образцу divix (`/Users/andy/Documents/GitHub/divix`), но одно-workspace: без табов и HTML-partials. Экранный canvas — 2D на всё окно; тест-буфер фиксированного разрешения (по ratio-таблице старого инструмента × scale) рисуется по центру рабочей области между двумя панелями (290px слева и справа), вписанный в 85%. Рендер по требованию (noLoop + requestRender) — главное отличие от старого filtr-tool (см. architecture.md §8.1). Шейдерный пайплайн — фаза 3; здесь только каркас.

**Tech Stack:** Vite 8, vite-plugin-pwa, p5 2.2.3 (npm, ESM), vitest, eslint 10, prettier, lightningcss.

**Контекст для исполнителя без предыстории:**
- Спека: `docs/superpowers/specs/2026-07-10-lumen-migration-design.md`; реверс-референс: `reference/filtr/` (README там же); архитектура старого кода: `reference/filtr/architecture.md` (дефолты состояния — §2, проблемы — §8).
- Образец кода: divix (`/Users/andy/Documents/GitHub/divix`) — оттуда копируются shared-утилиты и CSS дизайн-системы. Идиомы divix соблюдать (panelBuilder SECTIONS, persistence, safeStorage).
- Правила из `AGENTS.md` (корень lumen): instance mode; никаких внешних ассетов (offline-first PWA — в т.ч. НИКАКИХ Google Fonts); после `resizeCanvas` у p5.Graphics восстанавливать режимы; zero-allocation в draw.

---

### Task 1: Каркас проекта (Vite + PWA + тулинг)

**Files:**
- Create: `package.json`, `vite.config.js`, `eslint.config.js`, `.prettierrc.json`, `.gitignore`, `public/icon.svg`, `index.html` (минимальный), `src/css/style.css` (заглушка), `src/js/main.js` (заглушка)

- [ ] **Step 1: package.json**

```json
{
  "name": "lumen",
  "version": "0.1.0",
  "description": "Lumen is a generative image-filtering studio built on p5.js — a stack of shader effect modules with masks, presets and offline-first PWA export.",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "lint": "eslint src --max-warnings 0",
    "format": "prettier --write \"src/**/*.{js,css,html}\""
  },
  "dependencies": {
    "p5": "2.2.3"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "eslint": "^10.4.1",
    "eslint-config-prettier": "^10.1.8",
    "globals": "^17.6.0",
    "jsdom": "^29.1.1",
    "lightningcss": "^1.32.0",
    "prettier": "^3.8.3",
    "vite": "^8.0.16",
    "vite-plugin-pwa": "^1.3.0",
    "vitest": "^4.1.8"
  }
}
```

- [ ] **Step 2: vite.config.js** (по divix, без HTML-partials — одно приложение)

```js
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/lumen/',
  server: { port: 3000 },
  // lightningcss keeps both -webkit-backdrop-filter and the standard property
  // (esbuild's CSS minifier drops the standard one — see grafema history).
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: { safari: 15 << 16, chrome: 90 << 16 },
    },
  },
  build: { outDir: 'dist', cssMinify: 'lightningcss' },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json,webp,png,frag,vert}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      manifest: {
        name: 'Lumen Filter Studio',
        short_name: 'Lumen',
        description: 'Generative image-filtering studio: shader effect stack, masks, presets',
        theme_color: '#f4f4f4',
        background_color: '#f4f4f4',
        display: 'standalone',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
    }),
  ],
});
```

- [ ] **Step 3: eslint.config.js и .prettierrc.json**

```js
import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
    },
  },
];
```

`.prettierrc.json`: `{ "singleQuote": true, "printWidth": 100 }`

`.gitignore`:

```
node_modules/
dist/
dev-dist/
.DS_Store
```

- [ ] **Step 4: public/icon.svg** (простой моно-глиф; заменяемый позже)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#111"/><circle cx="32" cy="32" r="17" fill="none" stroke="#f4f4f4" stroke-width="5"/><circle cx="32" cy="32" r="5" fill="#f4f4f4"/></svg>
```

- [ ] **Step 5: минимальные index.html / src/css/style.css / src/js/main.js** (полноценный layout — Task 4; сейчас smoke-заглушки)

`index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lumen</title>
  <link rel="icon" type="image/svg+xml" href="icon.svg">
  <link rel="stylesheet" href="src/css/style.css">
</head>
<body class="theme-light">
  <div id="lumen-app">Lumen skeleton</div>
  <script type="module" src="/src/js/main.js"></script>
</body>
</html>
```

`src/css/style.css`: `body { margin: 0; }` (заменится в Task 4).
`src/js/main.js`: `console.log('lumen boot');` (заменится в Task 6).

- [ ] **Step 6: Установка и smoke**

Run: `npm install && npm run build`
Expected: build успешен, в `dist/` есть `index.html`, `sw.js`, `manifest.webmanifest`.

Run: `npm run lint && npm test`
Expected: lint чистый; vitest сообщает «no test files found» — это нормально до Task 2 (выход 0 или предупреждение; если vitest падает из-за отсутствия тестов, добавить в package.json флаг `--passWithNoTests` к скрипту test).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vite.config.js eslint.config.js .prettierrc.json .gitignore public/icon.svg index.html src/
git commit -m "feat: scaffold Vite+PWA project skeleton with tooling"
```

---

### Task 2: Shared-утилиты из divix + тест deepMerge

**Files:**
- Create: `src/shared/utils/storage.js`, `src/shared/utils/persistence.js`, `src/shared/utils/deepMerge.js`, `src/shared/utils/datetime.js`, `src/shared/ui/panelBuilder.js`
- Test: `src/shared/utils/deepMerge.test.js`

- [ ] **Step 1: Скопировать дословно из divix**

```bash
mkdir -p src/shared/utils src/shared/ui
for f in storage.js persistence.js deepMerge.js datetime.js; do
  cp "/Users/andy/Documents/GitHub/divix/src/shared/utils/$f" "src/shared/utils/$f"
done
cp /Users/andy/Documents/GitHub/divix/src/shared/ui/panelBuilder.js src/shared/ui/panelBuilder.js
cp /Users/andy/Documents/GitHub/divix/src/shared/utils/panelBuilder.test.js src/shared/utils/panelBuilder.test.js
```

Файлы НЕ модифицировать (общая дизайн-система; расхождения с divix — только через осознанный форк в будущих фазах).

- [ ] **Step 2: Тест deepMerge** (`src/shared/utils/deepMerge.test.js`) — divix её не покрывал; поведение фиксируем по реализации (рекурсивный мердж plain-объектов, массивы и скаляры заменяются):

```js
import { describe, it, expect } from 'vitest';
import { deepMerge } from './deepMerge.js';

describe('deepMerge', () => {
  it('recursively merges nested plain objects', () => {
    const target = { cnv: { ratio: '1:1', scale: { value: 2.5, max: 8 } } };
    deepMerge(target, { cnv: { scale: { value: 4 } } });
    expect(target.cnv.scale).toEqual({ value: 4, max: 8 });
    expect(target.cnv.ratio).toBe('1:1');
  });
  it('replaces arrays wholesale (no element merge)', () => {
    const target = { stack: [{ id: 'a' }, { id: 'b' }] };
    deepMerge(target, { stack: [{ id: 'c' }] });
    expect(target.stack).toEqual([{ id: 'c' }]);
  });
  it('ignores keys missing from source and keeps extra target keys', () => {
    const target = { a: 1, b: 2 };
    deepMerge(target, { b: 3 });
    expect(target).toEqual({ a: 1, b: 3 });
  });
});
```

(Перед написанием прочитай `src/shared/utils/deepMerge.js` — 15 строк; если фактическая семантика отличается от ожиданий теста, приведи ТЕСТ к фактическому поведению divix-реализации и отметь это в отчёте. Реализацию не менять.)

- [ ] **Step 3: Прогнать**

Run: `npm test`
Expected: deepMerge-тесты PASS; panelBuilder.test.js PASS (jsdom уже в devDeps; если тесту нужен environment jsdom — добавить `// @vitest-environment jsdom` в шапку файла, как в divix, проверить как там).

- [ ] **Step 4: Commit**

```bash
git add src/shared
git commit -m "feat: vendor shared utils and panelBuilder from divix design system"
```

---

### Task 3: state.js + serialize/restore (TDD)

**Files:**
- Create: `src/js/state.js`
- Test: `src/js/state.test.js`

Дефолты — из старого инструмента (reference/filtr/architecture.md §2, bundle U4/Sc/d4; ratio-таблица и базовые разрешения перенесены дословно). `SCHEMA_VERSION = 1` — версия НОВОГО формата Lumen (старые пресеты version:2 конвертируются в фазе 6).

- [ ] **Step 1: Написать падающие тесты** (`src/js/state.test.js`):

```js
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createDefaultState, serializeState, restoreState,
  RATIO_TYPES, RATIO_BASE_SIZE, SCHEMA_VERSION, bufferSize,
} from './state.js';

describe('state defaults', () => {
  it('matches the old tool defaults (architecture.md §2)', () => {
    const s = createDefaultState();
    expect(s.cnv.ratio).toBe('1:1');
    expect(s.cnv.animation).toBe(true);
    expect(s.cnv.scale).toEqual({ value: 2.5, min: 2, max: 8, step: 0.25 });
    expect(s.rec.frameRate).toBe(60);
    expect(s.rec.length.value).toBe(10);
    expect(s.stack).toEqual([]);
    expect(s.ui.selectedId).toBeNull();
  });
  it('has 11 ratios with base sizes', () => {
    expect(Object.keys(RATIO_TYPES)).toHaveLength(11);
    expect(RATIO_BASE_SIZE['1:1']).toEqual({ width: 480, height: 480 });
    expect(RATIO_BASE_SIZE['16:9']).toEqual({ width: 640, height: 360 });
  });
});

describe('bufferSize', () => {
  it('is base size × scale, rounded', () => {
    const s = createDefaultState();
    expect(bufferSize(s.cnv)).toEqual({ width: 1200, height: 1200 }); // 480 × 2.5
    s.cnv.ratio = '16:9';
    s.cnv.scale.value = 3;
    expect(bufferSize(s.cnv)).toEqual({ width: 1920, height: 1080 });
  });
});

describe('serialize/restore round-trip', () => {
  let s;
  beforeEach(() => { s = createDefaultState(); });

  it('round-trips persisted fields', () => {
    s.cnv.ratio = '4:5';
    s.stack.push({ id: 'p01', type: 'pass', module: 'fillColor', enabled: true, params: {} });
    const snap = serializeState(s);
    expect(snap.v).toBe(SCHEMA_VERSION);
    const t = createDefaultState();
    restoreState(t, snap);
    expect(t.cnv.ratio).toBe('4:5');
    expect(t.stack).toHaveLength(1);
    expect(t.stack[0].module).toBe('fillColor');
  });
  it('does not serialize runtime/ui', () => {
    const snap = serializeState(s);
    expect(snap.runtime).toBeUndefined();
    expect(snap.ui).toBeUndefined();
  });
  it('ignores unknown fields and survives missing sections', () => {
    const t = createDefaultState();
    restoreState(t, { v: SCHEMA_VERSION, cnv: { ratio: '3:4', bogus: 1 }, junk: true });
    expect(t.cnv.ratio).toBe('3:4');
    expect(t.cnv.scale.value).toBe(2.5); // не тронут
    expect(t.cnv.bogus).toBeUndefined();
    expect('junk' in t).toBe(false);
  });
  it('rejects wrong schema version (returns false, state untouched)', () => {
    const t = createDefaultState();
    expect(restoreState(t, { v: 999, cnv: { ratio: '9:16' } })).toBe(false);
    expect(t.cnv.ratio).toBe('1:1');
  });
});
```

- [ ] **Step 2: Убедиться, что падают**

Run: `npm test -- state`
Expected: FAIL — `Cannot find module './state.js'` (или equivalent).

- [ ] **Step 3: Реализовать `src/js/state.js`**

```js
// LUMEN — единый источник истины (спека §2, дефолты старого инструмента:
// reference/filtr/architecture.md §2; таблицы Sc/d4 из bundle-pretty.js:39188-39245).
// Persisted: cnv, rec, stack. Runtime/ui не сериализуются.

export const SCHEMA_VERSION = 1;

// Дословно таблица Sc старого инструмента (bundle-pretty.js:39188-39200).
export const RATIO_TYPES = {
  '2:1': '2:1', '16:9': '16:9', '3:2': '3:2', '4:3': '4:3', '5:4': '5:4',
  '1:1': '1:1', '4:5': '4:5', '3:4': '3:4', '2:3': '2:3', '9:16': '9:16', '1:2': '1:2',
};

// Дословно таблица d4 (базовые разрешения буфера, bundle-pretty.js:39201-39245).
export const RATIO_BASE_SIZE = {
  '2:1': { width: 480, height: 240 },
  '16:9': { width: 640, height: 360 },
  '3:2': { width: 480, height: 320 },
  '4:3': { width: 480, height: 360 },
  '5:4': { width: 600, height: 480 },
  '1:1': { width: 480, height: 480 },
  '4:5': { width: 480, height: 600 },
  '3:4': { width: 360, height: 480 },
  '2:3': { width: 320, height: 480 },
  '9:16': { width: 360, height: 640 },
  '1:2': { width: 240, height: 480 },
};

export function bufferSize(cnv) {
  const base = RATIO_BASE_SIZE[cnv.ratio] || RATIO_BASE_SIZE['1:1'];
  const k = cnv.scale.value;
  return { width: Math.round(base.width * k), height: Math.round(base.height * k) };
}

export function createDefaultState() {
  return {
    // --- Persisted ---
    cnv: {
      ratio: '1:1',
      animation: true,
      scale: { value: 2.5, min: 2, max: 8, step: 0.25 },
    },
    rec: {
      preset: 'mp4-web',
      frameRate: 60,
      length: { value: 10, min: 1, max: 60 },
      quality: 0.95,
      bitrate: 50,
      h264: 20,
    },
    stack: [], // [{ id, type: 'pass'|'mask', module, enabled, params, maskMembers? }]
    // --- Не сериализуется ---
    ui: { selectedId: null },
    runtime: { frame: 0, buffer: null, needsRender: true },
  };
}

const PERSISTED = ['cnv', 'rec', 'stack'];

export function serializeState(state) {
  const snap = { v: SCHEMA_VERSION };
  for (const key of PERSISTED) snap[key] = structuredClone(state[key]);
  return snap;
}

/**
 * Восстанавливает snapshot поверх state. Неизвестные поля игнорируются;
 * отсутствующие секции оставляют дефолты. Возвращает false (state не тронут),
 * если версия схемы не совпадает.
 */
export function restoreState(state, snap) {
  if (!snap || snap.v !== SCHEMA_VERSION) return false;
  for (const key of PERSISTED) {
    if (!(key in snap)) continue;
    if (key === 'stack') {
      state.stack = Array.isArray(snap.stack) ? structuredClone(snap.stack) : [];
    } else {
      mergeKnown(state[key], snap[key]);
    }
  }
  return true;
}

// Мердж только по ключам, уже существующим в target (отбрасывает неизвестное —
// в отличие от shared deepMerge, который копирует всё; см. state.test.js).
// Shape guard: если в target лежит plain object, source обязан тоже быть plain
// object (иначе ключ игнорируется) — битый LocalStorage не должен затирать
// вложенные секции null'ом или массивом.
function mergeKnown(target, source) {
  if (typeof source !== 'object' || source === null) return;
  for (const key of Object.keys(source)) {
    if (!(key in target)) continue;
    const t = target[key];
    const s = source[key];
    const tIsObj = typeof t === 'object' && t !== null && !Array.isArray(t);
    const sIsObj = typeof s === 'object' && s !== null && !Array.isArray(s);
    if (tIsObj) {
      if (sIsObj) mergeKnown(t, s); // не-объект на месте объекта — игнор
    } else if (s !== undefined) {
      target[key] = structuredClone(s);
    }
  }
}
```

- [ ] **Step 4: Прогнать тесты**

Run: `npm test -- state`
Expected: PASS (все).

- [ ] **Step 5: Commit**

```bash
git add src/js/state.js src/js/state.test.js
git commit -m "feat: state model with versioned serialize/restore (old-tool defaults)"
```

---

### Task 4: Двухпанельный layout + CSS дизайн-системы

**Files:**
- Create: `src/css/style.css` (замена заглушки: копия divix + lumen-правки)
- Modify: `index.html` (полный layout)

- [ ] **Step 1: Скопировать CSS дизайн-системы**

```bash
cp /Users/andy/Documents/GitHub/divix/src/css/style.css src/css/style.css
```

- [ ] **Step 2: Очистить от офлайн-нарушений и divix-специфики**

В скопированном `src/css/style.css`:
1. Удалить все `@import`/`url(` ссылки на ВНЕШНИЕ ресурсы (googleapis и т.п.), если есть (`grep -n "googleapis\|http" src/css/style.css`) — offline-first. Font-family заменять системным стеком только в тех правилах, где удалили внешний шрифт.
2. НЕ вычищать остальное (классы других workspace'ов не мешают и держат файл диффабельным против divix).

- [ ] **Step 3: Дописать lumen-блок в конец style.css**

```css
/* ============ LUMEN: two-panel layout ============ */
/* Правая панель дизайн-системы (.sidebar) остаётся как есть (260px + 20px
   margin). Левая — зеркальная. Рабочая область канваса — между ними. */

.lumen-app { width: 100vw; height: 100vh; overflow: hidden; position: relative; }

.lumen-sidebar-left {
  position: fixed;
  top: 0; left: 0;
  width: var(--panel-width) !important;
  height: calc(100vh - (var(--margin-xlarge) * 2)) !important;
  margin: var(--margin-xlarge) !important;
  z-index: 100;
}

/* Канвас-вьюпорт на всё окно; p5-canvas растягивается CSS'ом */
.lumen-canvas-viewport {
  position: absolute;
  inset: 0;
  z-index: 0;
}
.lumen-canvas-viewport canvas { width: 100vw !important; height: 100vh !important; }
```

(Константа 290 = 260px панель + 20px margin + 10px зазор живёт в JS-модуле viewport.js, Task 5 — CSS-переменные тут не нужны, панели фиксированы; значение из AGENTS.md §3, как в divix.)

- [ ] **Step 4: Полный index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lumen</title>
  <link rel="icon" type="image/svg+xml" href="icon.svg">
  <link rel="stylesheet" href="src/css/style.css">
</head>
<body class="theme-light">
  <div class="lumen-app">

    <aside class="sidebar lumen-sidebar-left">
      <div class="sidebar-content" id="lm-left"></div>
      <footer class="sidebar-footer">
        <button id="lm-btn-save-png" class="btn btn-accent">Export as PNG</button>
        <div id="lm-export-status" class="export-status"></div>
      </footer>
    </aside>

    <main class="lumen-canvas-viewport" id="lumen-canvas">
      <!-- p5.js canvas injected here -->
    </main>

    <aside class="sidebar right-sidebar">
      <div class="sidebar-content" id="lm-inspector">
        <p class="inspector-empty" style="opacity:.5;padding:12px;font-size:12px;">
          Select a layer to edit its parameters
        </p>
      </div>
    </aside>

  </div>
  <script type="module" src="/src/js/main.js"></script>
</body>
</html>
```

Сверь имена классов `.sidebar`, `.right-sidebar`, `.sidebar-content`, `.sidebar-footer`, `.btn btn-accent`, `.export-status` с фактическим style.css (скопирован из divix) — если какой-то класс в divix называется иначе, использовать divix-имя (источник истины — CSS, не этот сниппет).

- [ ] **Step 5: Smoke**

Run: `npm run build && npm run preview & sleep 2 && curl -s http://localhost:4173/lumen/ | grep -c "lumen-sidebar-left\|right-sidebar\|lumen-canvas" ; kill %1`
Expected: `3` (или больше); build без ошибок.

- [ ] **Step 6: Commit**

```bash
git add src/css/style.css index.html
git commit -m "feat: two-panel glassmorphism layout on divix design system"
```

---

### Task 5: viewport.js + scheduler.js (TDD, чистая логика)

**Files:**
- Create: `src/js/viewport.js`, `src/js/scheduler.js`
- Test: `src/js/viewport.test.js`, `src/js/scheduler.test.js`

- [ ] **Step 1: Падающие тесты viewport** (`src/js/viewport.test.js`):

```js
import { describe, it, expect } from 'vitest';
import { computeViewport, PANEL_LEFT, PANEL_RIGHT, FIT } from './viewport.js';

describe('computeViewport', () => {
  // Рабочая область: окно минус панели (290px с каждой стороны: 260 панель
  // + 20 margin + 10 зазор). Буфер вписывается в 85% рабочей области
  // с сохранением пропорций и центрируется в ней (спека §3).
  it('centers a square buffer in the workspace between panels', () => {
    const v = computeViewport({ winW: 1920, winH: 1080, bufW: 1200, bufH: 1200 });
    // avail: w=1920-580=1340, h=1080; scale=min(1340/1200,1080/1200)*0.85=0.765
    expect(v.w).toBeCloseTo(918, 0);
    expect(v.h).toBeCloseTo(918, 0);
    expect(v.x).toBeCloseTo(290 + (1340 - 918) / 2, 0); // 501
    expect(v.y).toBeCloseTo((1080 - 918) / 2, 0); // 81
  });
  it('fits a wide buffer by width', () => {
    const v = computeViewport({ winW: 1920, winH: 1080, bufW: 1920, bufH: 1080 });
    // scale = min(1340/1920, 1080/1080) * 0.85 ≈ 0.59323; w = 1340*0.85 = 1139
    expect(v.w).toBeCloseTo(1139, 0);
    expect(v.h).toBeCloseTo(640.7, 0);
  });
  it('keeps aspect ratio', () => {
    const v = computeViewport({ winW: 1400, winH: 900, bufW: 640, bufH: 360 });
    expect(v.w / v.h).toBeCloseTo(640 / 360, 5);
  });
  it('exports the layout constants used by CSS', () => {
    // 290 = 260px панель + 20px margin + 10px зазор (AGENTS.md §3, как в divix)
    expect(PANEL_LEFT).toBe(290);
    expect(PANEL_RIGHT).toBe(290);
    expect(FIT).toBe(0.85);
  });
});
```

- [ ] **Step 2: Падающие тесты scheduler** (`src/js/scheduler.test.js`):

```js
import { describe, it, expect, vi } from 'vitest';
import { createRenderScheduler } from './scheduler.js';

// Контракт (architecture.md §8.1 — антипаттерн старого кода, вечный RAF):
// p5 держится в noLoop; requestRender() вызывает redraw() максимум один раз
// на кадр; setAnimating(true) включает loop() для анимации, false — noLoop().
function fakeP5() {
  return { redraw: vi.fn(), loop: vi.fn(), noLoop: vi.fn() };
}

describe('createRenderScheduler', () => {
  it('starts paused (noLoop) via init', () => {
    const p = fakeP5();
    const s = createRenderScheduler(p);
    s.init();
    expect(p.noLoop).toHaveBeenCalledOnce();
  });
  it('requestRender triggers a single redraw while paused', () => {
    const p = fakeP5();
    const s = createRenderScheduler(p);
    s.init();
    s.requestRender();
    s.requestRender(); // коалесцируется до consumeFrame
    expect(p.redraw).toHaveBeenCalledTimes(1);
    s.consumeFrame();
    s.requestRender();
    expect(p.redraw).toHaveBeenCalledTimes(2);
  });
  it('does not call redraw while animating (loop is running)', () => {
    const p = fakeP5();
    const s = createRenderScheduler(p);
    s.init();
    s.setAnimating(true);
    expect(p.loop).toHaveBeenCalledOnce();
    s.requestRender();
    expect(p.redraw).not.toHaveBeenCalled();
  });
  it('setAnimating(false) returns to noLoop', () => {
    const p = fakeP5();
    const s = createRenderScheduler(p);
    s.init();
    s.setAnimating(true);
    s.setAnimating(false);
    expect(p.noLoop).toHaveBeenCalledTimes(2); // init + off
  });
});
```

- [ ] **Step 3: Убедиться, что падают**

Run: `npm test -- viewport scheduler`
Expected: FAIL — модули не существуют.

- [ ] **Step 4: Реализация**

`src/js/viewport.js`:

```js
// LUMEN — центрирование буфера в рабочей области между двумя панелями
// (спека §3: 85% доступного пространства; адаптация формулы AGENTS.md §3
// под двухпанельный layout).

export const PANEL_LEFT = 290; // 260 панель + 20 margin + 10 зазор (AGENTS.md §3)
export const PANEL_RIGHT = 290;
export const FIT = 0.85;

export function computeViewport({ winW, winH, bufW, bufH }) {
  const availW = winW - PANEL_LEFT - PANEL_RIGHT;
  const availH = winH;
  const scale = Math.min(availW / bufW, availH / bufH) * FIT;
  const w = bufW * scale;
  const h = bufH * scale;
  return {
    x: PANEL_LEFT + (availW - w) / 2,
    y: (availH - h) / 2,
    w,
    h,
  };
}
```

`src/js/scheduler.js`:

```js
// LUMEN — рендер по требованию вместо вечного RAF старого инструмента
// (reference/filtr/architecture.md §8.1). p5 живёт в noLoop; изменения
// состояния зовут requestRender(); анимация переключает в loop().

export function createRenderScheduler(p) {
  let animating = false;
  let pending = false;

  return {
    init() {
      p.noLoop();
    },
    requestRender() {
      if (animating || pending) return;
      pending = true;
      p.redraw();
    },
    /** Вызывается из p.draw() в начале кадра. */
    consumeFrame() {
      pending = false;
    },
    setAnimating(on) {
      animating = !!on;
      if (on) p.loop();
      else p.noLoop();
    },
    isAnimating: () => animating,
  };
}
```

- [ ] **Step 5: Прогнать тесты**

Run: `npm test -- viewport scheduler`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/js/viewport.js src/js/viewport.test.js src/js/scheduler.js src/js/scheduler.test.js
git commit -m "feat: viewport centering math and dirty-flag render scheduler (TDD)"
```

---

### Task 6: app.js — p5 instance, тест-буфер, resize

**Files:**
- Create: `src/js/app.js`, `src/js/graphicsModes.js`
- Modify: `src/js/main.js`

- [ ] **Step 1: `src/js/graphicsModes.js`** — ловушка resizeCanvas (методология, AGENTS.md §4):

```js
// resizeCanvas() у p5.Graphics полностью сбрасывает 2D-контекст —
// после ЛЮБОГО resize обязательно восстановить режимы (AGENTS.md §4).
export function restoreGraphicsModes(g, p) {
  g.pixelDensity(1);
  g.angleMode(p.DEGREES);
  g.rectMode(p.CORNER);
  g.imageMode(p.CORNER);
  g.noStroke();
}
```

- [ ] **Step 2: `src/js/app.js`**

```js
// LUMEN — главный контроллер: p5 instance mode (AGENTS.md §1), экранный 2D
// canvas на всё окно, offscreen тест-буфер фиксированного разрешения,
// центрирование между панелями, рендер по требованию.
import { bufferSize } from './state.js';
import { computeViewport } from './viewport.js';
import { createRenderScheduler } from './scheduler.js';
import { restoreGraphicsModes } from './graphicsModes.js';

export function lumenSketch(p, { state, onReady }) {
  let buffer = null;
  const scheduler = createRenderScheduler(p);

  function rebuildBuffer() {
    const { width, height } = bufferSize(state.cnv);
    if (!buffer) {
      buffer = p.createGraphics(width, height);
    } else if (buffer.width !== width || buffer.height !== height) {
      buffer.resizeCanvas(width, height);
    }
    restoreGraphicsModes(buffer, p);
    state.runtime.buffer = buffer;
    drawTestPattern();
  }

  // Временный контент фазы 2: шахматка + диагональный градиент, чтобы видеть
  // границы, пропорции и центрирование буфера. Заменяется пайплайном в фазе 3.
  function drawTestPattern() {
    const g = buffer;
    const cell = Math.max(16, Math.round(g.width / 24));
    g.background(244);
    for (let y = 0; y < g.height; y += cell) {
      for (let x = 0; x < g.width; x += cell) {
        if (((x / cell) + (y / cell)) % 2 < 1) {
          g.fill(220);
          g.rect(x, y, cell, cell);
        }
      }
    }
    for (let x = 0; x < g.width; x += 2) {
      const t = x / g.width;
      g.fill(17 + t * 180, 17, 120 - t * 100, 160);
      g.rect(x, 0, 2, g.height * 0.12);
    }
    g.fill(17);
    g.rect(0, 0, g.width, 4);
    g.rect(0, g.height - 4, g.width, 4);
    g.rect(0, 0, 4, g.height);
    g.rect(g.width - 4, 0, 4, g.height);
  }

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
    rebuildBuffer();
    scheduler.init();
    scheduler.setAnimating(false); // фаза 2: анимации ещё нет
    scheduler.requestRender();
    if (onReady) onReady({ scheduler, rebuildBuffer, getBuffer: () => buffer });
  };

  p.draw = () => {
    scheduler.consumeFrame();
    p.clear();
    const v = computeViewport({
      winW: p.width, winH: p.height,
      bufW: buffer.width, bufH: buffer.height,
    });
    p.image(buffer, v.x, v.y, v.w, v.h);
    state.runtime.frame++;
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    scheduler.requestRender();
  };
}
```

- [ ] **Step 3: `src/js/main.js`** — точка входа (по образцу divix main.js, без табов):

```js
import p5 from 'p5';
import { registerSW } from 'virtual:pwa-register';
import { createDefaultState } from './state.js';
import { lumenSketch } from './app.js';

registerSW({
  onOfflineReady() {
    console.log('[lumen] ready to work offline');
  },
});

const state = createDefaultState();
window.__lumenState = state; // отладка в консоли; не API

const container = document.getElementById('lumen-canvas');
new p5((p) => lumenSketch(p, {
  state,
  onReady(api) {
    window.__lumenApi = api; // временно до Task 7 (UI-встройка)
  },
}), container);

export { state };
```

- [ ] **Step 4: Smoke + lint**

Run: `npm run lint && npm run build`
Expected: чисто.

Run: `npm run dev & sleep 3 && curl -s http://localhost:3000/lumen/ -o /dev/null -w "%{http_code}"; kill %1`
Expected: `200`. (Визуально: тест-паттерн с рамкой по центру между панелями; шахматка не искажена — проверяет контроллер при ревью.)

- [ ] **Step 5: Commit**

```bash
git add src/js/app.js src/js/graphicsModes.js src/js/main.js
git commit -m "feat: p5 instance app shell with centered test buffer and on-demand render"
```

---

### Task 7: Canvas-секция UI + PNG-экспорт + persistence

**Files:**
- Create: `src/js/controls.js`
- Modify: `src/js/main.js` (UI-встройка вместо `window.__lumenApi`)

- [ ] **Step 1: `src/js/controls.js`** — декларативные секции (формат SECTIONS panelBuilder'а; divix-идиома):

```js
// LUMEN — декларативное описание панелей (спека §3: controls.js).
// Фаза 2: только секция Canvas. Presets/Media/Layers добавляются в фазах 4-6.
import { RATIO_TYPES } from './state.js';

export const LEFT_SECTIONS = [
  {
    title: 'Canvas',
    controls: [
      {
        type: 'select', id: 'lm-cnv-ratio', label: 'Canvas Ratio',
        path: 'cnv.ratio', options: RATIO_TYPES, regen: 'buffer',
      },
      {
        type: 'slider', id: 'lm-cnv-scale', label: 'Resolution Scale',
        path: 'cnv.scale.value', min: 2, max: 8, step: 0.25, regen: 'buffer',
      },
    ],
  },
];
```

- [ ] **Step 2: Перепаять `src/js/main.js`** — построение панели, applyChange, persistence:

```js
import p5 from 'p5';
import { registerSW } from 'virtual:pwa-register';
import { createDefaultState, serializeState, restoreState } from './state.js';
import { lumenSketch } from './app.js';
import { LEFT_SECTIONS } from './controls.js';
import { createPanelBuilder, openSections } from '../shared/ui/panelBuilder.js';
import { createPersistence } from '../shared/utils/persistence.js';
import { timestamp } from '../shared/utils/datetime.js';

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

function applyChange(ctrl) {
  if (ctrl.id === 'lm-btn-save-png') return exportPNG();
  if (ctrl.regen === 'buffer' && api) {
    api.rebuildBuffer();
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

function buildUI() {
  const root = document.getElementById('lm-left');
  root.innerHTML = '';
  panel.buildSections(root, LEFT_SECTIONS);
  openSections(root, [0]);
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
  },
}), container);

export { state };
```

(`timestamp` — сверь фактическую сигнатуру в `src/shared/utils/datetime.js`, скопированном из divix, и используй её; если там иное имя — поправь импорт, не файл.)

- [ ] **Step 3: Ручной smoke через dev-сервер**

Run: `npm run lint && npm test && npm run build`
Expected: всё чисто.

Функциональная проверка (dev-сервер + браузер делает контроллер на ревью; исполнителю — консольная):
`npm run dev & sleep 3 && curl -s http://localhost:3000/lumen/ -o /dev/null -w "%{http_code}"; kill %1` → `200`.

- [ ] **Step 4: Commit**

```bash
git add src/js/controls.js src/js/main.js
git commit -m "feat: Canvas section UI, PNG export and localStorage persistence"
```

---

### Task 8: Дефолтные ассеты (offline-first) + PWA-проверка + README

**Files:**
- Create: `public/assets/lumen/media/*` (full-варианты дефолтных медиа), `src/js/assets.js`, `README.md`

- [ ] **Step 1: Определить full-варианты**

У дефолтных медиа старого инструмента по ДВА файла на имя: preview и full (см. reference/filtr/architecture.md §4, таблицы b4/v4 в bundle-pretty.js:41283-41328 — там `previewSrc: Pt(...)` и `fullSrc: Kt(...)` с разными хэшами). Открой эти строки бандла, выпиши какой хэш = full для: img0-img3, text0-text5, noise0. Файлы без пары (shape0-4, gradient-*, white, blue-noise png, watermark) — единственные версии; watermark НЕ копировать (лицензионный, спека «Вне объёма»).

- [ ] **Step 2: Скопировать с чистыми именами**

```bash
mkdir -p public/assets/lumen/media
# для каждого имени (пример для img0; полный список — из Step 1):
cp "reference/filtr/live/filtr-tool/assets/img0-<FULL_HASH>.webp" public/assets/lumen/media/img0.webp
# ... img1-3, text0-5, noise0 (full-варианты), shape0-4, gradient-circle,
# gradient-linear, gradient-reflect, gradient-tile, white (единственные),
# blue-noise-256x256 (png → public/assets/lumen/media/blue-noise-256x256.png)
ls public/assets/lumen/media | wc -l
```

Expected: `21` файл (4 img + 6 text + 1 noise + 5 shape + 4 gradient + 1 white = 21 webp — минус... пересчитай сам и зафиксируй фактическое число в отчёте) + 1 png = 22 всего. Сверь каждое скопированное full-имя размером больше preview-собрата (`ls -la` обоих хэшей).

- [ ] **Step 3: `src/js/assets.js`** — манифест-модуль:

```js
// LUMEN — локальные дефолтные ассеты (offline-first, AGENTS.md §7).
// Имена и состав — из старого инструмента (reference/filtr/architecture.md §4);
// скопированы FULL-варианты. Загрузка — фаза 4 (media.js).
const BASE = `${import.meta.env.BASE_URL}assets/lumen/media`;

export const DEFAULT_MEDIA = {
  img0: `${BASE}/img0.webp`,
  img1: `${BASE}/img1.webp`,
  img2: `${BASE}/img2.webp`,
  img3: `${BASE}/img3.webp`,
  text0: `${BASE}/text0.webp`,
  text1: `${BASE}/text1.webp`,
  text2: `${BASE}/text2.webp`,
  text3: `${BASE}/text3.webp`,
  text4: `${BASE}/text4.webp`,
  text5: `${BASE}/text5.webp`,
  noise0: `${BASE}/noise0.webp`,
  shape0: `${BASE}/shape0.webp`,
  shape1: `${BASE}/shape1.webp`,
  shape2: `${BASE}/shape2.webp`,
  shape3: `${BASE}/shape3.webp`,
  shape4: `${BASE}/shape4.webp`,
  'gradient-circle': `${BASE}/gradient-circle.webp`,
  'gradient-linear': `${BASE}/gradient-linear.webp`,
  'gradient-reflect': `${BASE}/gradient-reflect.webp`,
  'gradient-tile': `${BASE}/gradient-tile.webp`,
  white: `${BASE}/white.webp`,
};

export const BLUE_NOISE_URL = `${BASE}/blue-noise-256x256.png`;
```

- [ ] **Step 4: PWA-проверка офлайн-комплектности**

Run: `npm run build && grep -o "assets/lumen/media/[a-z0-9.-]*" dist/sw.js | sort -u | wc -l`
Expected: 22 (все ассеты в precache). Если 0 — проверь `globPatterns` в vite.config.js (webp/png уже включены в Task 1).

- [ ] **Step 5: README.md проекта** (кратко, по образцу divix):

```markdown
# Lumen

Generative image-filtering studio built on p5.js: a stack of shader effect
modules (fills, displacements, blurs, color ops, masks) with presets and
offline-first PWA export. Port of the legacy filtr-tool
(reverse-engineering reference: `reference/filtr/`).

## Develop
    npm install
    npm run dev        # http://localhost:3000/lumen/

## Test / Lint
    npm test
    npm run lint

## Docs
- Design spec: `docs/superpowers/specs/2026-07-10-lumen-migration-design.md`
- Legacy-tool reference: `reference/filtr/README.md`
- Methodology: `LUMEN_METHODOLOGY.md`, agent rules: `AGENTS.md`
```

- [ ] **Step 6: Финальный прогон фазы**

Run: `npm run lint && npm test && npm run build`
Expected: всё зелёное.

- [ ] **Step 7: Commit**

```bash
git add public/assets src/js/assets.js README.md
git commit -m "feat: vendor default media assets (full variants) and project README"
```

---

## Definition of Done (фаза 2)

- `npm run dev` показывает: две панели (лево: Canvas-секция + Export as PNG; право: пустой инспектор), тест-буфер по центру рабочей области, вписан в 85%.
- Смена Canvas Ratio / Resolution Scale мгновенно перестраивает буфер (с восстановлением режимов) и перерисовывает; после перезагрузки страницы настройки восстановлены из LocalStorage.
- Рендер по требованию: без взаимодействия draw не выполняется (проверка: `window.__lumenState.runtime.frame` не растёт в покое).
- Export as PNG скачивает буфер в полном разрешении.
- `npm run lint`, `npm test`, `npm run build` — чистые; sw.js прекеширует 22 медиа-ассета.
- Контроллер визуально проверяет layout/центрирование в браузере на финальном ревью фазы.
