# Lumen Phase 1: Reference Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Собрать в `reference/filtr/` полный, проверенный референс старого filtr-tool: рабочий локальный эталон (live), оригинальные GLSL-шейдеры, реестр 19 модулей, 28 пресетов и архитектурные заметки.

**Architecture:** Всё скачивается с https://antlii.github.io/filtr-tool/ (деплой самодостаточен). Live-эталон вендорится «как есть» без правки путей (сервится с префиксом `/filtr-tool/`). Данные (модули, пресеты) извлекаются из отформатированного бандла в валидные ES-модули и проверяются node-скриптами.

**Tech Stack:** curl, js-beautify (pinned), Node ≥ 20 (verify-скрипты), python3 http.server (эталон).

**Контекст для исполнителя без предыстории:**
- Спека: `docs/superpowers/specs/2026-07-10-lumen-migration-design.md` — прочитать перед началом.
- Старый инструмент задеплоен на GitHub Pages; исходного репозитория нет. JS-бандл минифицирован, но строки/метки сохранены. Шейдеры и текстуры — отдельные файлы с оригинальным содержимым.
- Известные факты (проверены): 15 `.frag` (WebGL2 `#version 300 es`), бандл `assets/index-BiEMM2Nx.js` (~3.1 МБ), CSS `assets/index-7EWvZ7f0.css`, реестр модулей — объект с 19 ключами, пресетов 28, у масок поле `__maskMembers`.

---

### Task 1: Вендоринг live-эталона

**Files:**
- Create: `reference/filtr/live/filtr-tool/index.html`
- Create: `reference/filtr/live/filtr-tool/assets/*` (51 файл)
- Create: `reference/filtr/tools/assets-manifest.txt`
- Create: `reference/filtr/tools/download-live.sh`

- [ ] **Step 1: Создать манифест ассетов**

Записать в `reference/filtr/tools/assets-manifest.txt` (пути относительно https://antlii.github.io/):

```
filtr-tool/index.html
filtr-tool/assets/index-BiEMM2Nx.js
filtr-tool/assets/index-7EWvZ7f0.css
filtr-tool/assets/blue-noise-256x256-lsuKT_Fh.png
filtr-tool/assets/blurComp-ByMtstRX.frag
filtr-tool/assets/blurNoise-CO-OBL7q.frag
filtr-tool/assets/displaceCubic-Dyi1MP3D.frag
filtr-tool/assets/displaceSimplex-BpUUhkz0.frag
filtr-tool/assets/displaceSine-l4VGaZJI.frag
filtr-tool/assets/embossEffect-Cm20D6A6.frag
filtr-tool/assets/fillColor-CHUbhfq3.frag
filtr-tool/assets/fillGradient-Dp8rbCk7.frag
filtr-tool/assets/fillMedia-Dg4rXJaa.frag
filtr-tool/assets/fillNoise-DjX6Fj2W.frag
filtr-tool/assets/gradient-circle-BHxptb8S.webp
filtr-tool/assets/gradient-linear-Ct5-CGUK.webp
filtr-tool/assets/gradient-reflect-DyRKsYSP.webp
filtr-tool/assets/gradient-tile-BLm9vbX9.webp
filtr-tool/assets/gradientMap-ySkbPprP.frag
filtr-tool/assets/img0-54dYMZt1.webp
filtr-tool/assets/img0-DrQVn_of.webp
filtr-tool/assets/img1-80G2myQK.webp
filtr-tool/assets/img1-Bz_wQgMJ.webp
filtr-tool/assets/img2-CJYn3rGE.webp
filtr-tool/assets/img2-Cdlbn-QB.webp
filtr-tool/assets/img3-DCdk677M.webp
filtr-tool/assets/img3-dbLqj_ea.webp
filtr-tool/assets/lensGrid-BlATGk1u.frag
filtr-tool/assets/lumaBands-CqFg_o5N.frag
filtr-tool/assets/noise0-BNZBTDER.webp
filtr-tool/assets/noise0-DSZBptgo.webp
filtr-tool/assets/rgbShift-D9ua9tbh.frag
filtr-tool/assets/shape0-DDeBArAw.webp
filtr-tool/assets/shape1-Bxo9ollx.webp
filtr-tool/assets/shape2-CXLoUU42.webp
filtr-tool/assets/shape3-DnE6ENEf.webp
filtr-tool/assets/shape4-IVpOZ1x-.webp
filtr-tool/assets/text0-Bni7HgwS.webp
filtr-tool/assets/text0-M2wDD-MK.webp
filtr-tool/assets/text1-DUik8sAF.webp
filtr-tool/assets/text1-DX8lU08Q.webp
filtr-tool/assets/text2-CDnihDEJ.webp
filtr-tool/assets/text2-hjf9z93P.webp
filtr-tool/assets/text3-BQNNq0pW.webp
filtr-tool/assets/text3-CLRxWAgh.webp
filtr-tool/assets/text4-8Zrl-LJC.webp
filtr-tool/assets/text4-DpAFYfW2.webp
filtr-tool/assets/text5-CKr4GEU5.webp
filtr-tool/assets/text5-ifSmA1E4.webp
filtr-tool/assets/warpGrid-CQc9h_M_.frag
filtr-tool/assets/watermark-DRuBhAP_.webp
filtr-tool/assets/white-BPU41Y0a.webp
```

- [ ] **Step 2: Написать скрипт скачивания** `reference/filtr/tools/download-live.sh`:

```bash
#!/usr/bin/env bash
# Vendors the deployed filtr-tool (GitHub Pages) into reference/filtr/live/
# verbatim — no path rewriting; serve live/ so URLs keep the /filtr-tool/ prefix.
set -euo pipefail
cd "$(dirname "$0")"
BASE="https://antlii.github.io"
DEST="../live"
while IFS= read -r path; do
  [ -z "$path" ] && continue
  mkdir -p "$DEST/$(dirname "$path")"
  echo "GET $path"
  curl -sSf "$BASE/$path" -o "$DEST/$path"
done < assets-manifest.txt
echo "Done: $(find "$DEST" -type f | wc -l | tr -d ' ') files"
```

- [ ] **Step 3: Запустить и проверить**

Run: `chmod +x reference/filtr/tools/download-live.sh && reference/filtr/tools/download-live.sh`
Expected: `Done: 52 files` (51 из манифеста; ± сервисные файлы не считаем — сверить `find reference/filtr/live -type f -empty | wc -l` → `0`).

- [ ] **Step 4: Смоук-тест эталона**

Run: `cd reference/filtr/live && python3 -m http.server 8123 &` затем `curl -s -o /dev/null -w "%{http_code}" http://localhost:8123/filtr-tool/` и `curl -s http://localhost:8123/filtr-tool/assets/fillMedia-Dg4rXJaa.frag | head -2`; после — `kill %1`.
Expected: `200`; первые строки frag: `#version 300 es`. (Полная ручная проверка в браузере — открыть http://localhost:8123/filtr-tool/ и убедиться, что инструмент рендерит.)

- [ ] **Step 5: Commit**

```bash
git add reference/filtr/tools reference/filtr/live
git commit -m "ref: vendor filtr-tool live etalon from GitHub Pages"
```

---

### Task 2: Отформатированный бандл для чтения

**Files:**
- Create: `reference/filtr/bundle-pretty.js`

- [ ] **Step 1: Прогнать js-beautify (пиновая версия)**

Run: `npx --yes js-beautify@1.15.4 -f reference/filtr/live/filtr-tool/assets/index-BiEMM2Nx.js -o reference/filtr/bundle-pretty.js`
Expected: файл создан; `wc -l reference/filtr/bundle-pretty.js` → > 80000 строк.

- [ ] **Step 2: Проверить ориентиры**

Run: `grep -n 'label: "Fill: Media File"' reference/filtr/bundle-pretty.js && grep -c 'toolId: "filtr-tool"' reference/filtr/bundle-pretty.js`
Expected: метка найдена (~строка 39361 при beautify 1.15.4); счётчик `toolId` ≥ 28.

- [ ] **Step 3: Commit**

```bash
git add reference/filtr/bundle-pretty.js
git commit -m "ref: add pretty-printed filtr-tool bundle for reverse engineering"
```

---

### Task 3: Шейдеры с чистыми именами

**Files:**
- Create: `reference/filtr/shaders/<name>.frag` (15 файлов)
- Create: `reference/filtr/shaders/README.md`

- [ ] **Step 1: Скопировать frag-файлы, убрав хэши из имён**

```bash
# ВНИМАНИЕ: наивный ${base%-*} ломается на хэшах с дефисом
# (blurNoise-CO-OBL7q → blurNoise-CO). Режем по известным именам модулей.
mkdir -p reference/filtr/shaders
for f in reference/filtr/live/filtr-tool/assets/*.frag; do
  base=$(basename "$f" .frag)              # e.g. blurNoise-CO-OBL7q
  clean=$(echo "$base" | sed -E 's/^([a-zA-Z]+)-.*/\1/')  # имя до первого дефиса
  cp "$f" "reference/filtr/shaders/$clean.frag"
done
ls reference/filtr/shaders/*.frag | wc -l
```

Expected: `15` (blurComp, blurNoise, displaceCubic, displaceSimplex, displaceSine, embossEffect, fillColor, fillGradient, fillMedia, fillNoise, gradientMap, lensGrid, lumaBands, rgbShift, warpGrid).

- [ ] **Step 2: Проверить целостность**

Run: `grep -L "void main" reference/filtr/shaders/*.frag; grep -L "#version 300 es" reference/filtr/shaders/*.frag`
Expected: обе команды не выводят ничего (каждый файл содержит и то и другое).

- [ ] **Step 3: Задокументировать вершинный шейдер и загрузку**

В `reference/filtr/bundle-pretty.js` найти, как вызывается `loadShader` (grep `loadShader(`) и откуда берётся vertex-источник (отдельного `.vert` в ассетах НЕТ — выяснить: либо инлайн-строка, либо дефолтный p5). Записать в `reference/filtr/shaders/README.md`:
- источник vertex-шейдера (вставить дословно, если инлайн);
- список пар key → frag-файл (из манифеста загрузчика, grep по именам frag в бандле);
- пометку: GLSL ES 3.00 (`#version 300 es`) ⇒ новому пайплайну нужен WebGL2;
- какие модули НЕ имеют собственного frag (blurGaussian, blurMotion, displaceTexture, colorCorrection, maskMedia) и какими пассами/шейдерами они реализованы по коду пассов (grep `blurComp`, `getPasses`, `rebuildPassesAndRender`).

- [ ] **Step 4: Commit**

```bash
git add reference/filtr/shaders
git commit -m "ref: extract original GLSL shaders with clean names"
```

---

### Task 4: Реестр модулей → modules.js

**Files:**
- Create: `reference/filtr/tools/verify-modules.mjs`
- Create: `reference/filtr/modules.js`

- [ ] **Step 1: Написать проверочный скрипт (сначала — он)** `reference/filtr/tools/verify-modules.mjs`:

```js
// Verifies reference/filtr/modules.js: complete, self-contained, well-formed.
import { MODULES } from '../modules.js';

const EXPECTED = [
  'fillMedia', 'fillColor', 'fillGradient', 'fillNoise',
  'displaceSine', 'displaceCubic', 'displaceSimplex', 'displaceTexture',
  'blurGaussian', 'blurMotion', 'blurNoise',
  'gradientMap', 'colorCorrection', 'rgbShift', 'lumaBands',
  'embossEffect', 'lensGrid', 'warpGrid', 'maskMedia',
];

const keys = Object.keys(MODULES);
const missing = EXPECTED.filter((k) => !keys.includes(k));
const extra = keys.filter((k) => !EXPECTED.includes(k));
if (missing.length || extra.length) {
  throw new Error(`Registry mismatch. Missing: ${missing} Extra: ${extra}`);
}
for (const [key, def] of Object.entries(MODULES)) {
  for (const field of ['label', 'type', 'module', 'defaults', 'panels']) {
    if (!(field in def)) throw new Error(`${key}: missing "${field}"`);
  }
  if (def.module !== key) throw new Error(`${key}: module field mismatch`);
  if (!Array.isArray(def.panels) || !def.panels.length) {
    throw new Error(`${key}: panels must be a non-empty array`);
  }
}
if (MODULES.maskMedia.type !== 'mask') throw new Error('maskMedia.type !== "mask"');
if (!Array.isArray(MODULES.maskMedia.defaults.__maskMembers)) {
  throw new Error('maskMedia.defaults.__maskMembers missing');
}
console.log(`OK: ${keys.length} modules verified`);
```

- [ ] **Step 2: Убедиться, что проверка падает без файла**

Run: `node reference/filtr/tools/verify-modules.mjs`
Expected: FAIL — `Cannot find module '../modules.js'`.

- [ ] **Step 3: Извлечь реестр**

В `reference/filtr/bundle-pretty.js` найти объект реестра: якорь — строка `fillMedia: {` сразу после определения таблицы blend-режимов (`Normal: 0, Darken: 1, …`). Реестр заканчивается закрытием ключа `maskMedia`. Скопировать в `reference/filtr/modules.js` как:

```js
// Module registry extracted verbatim from the deployed filtr-tool bundle
// (bundle-pretty.js, anchor: `label: "Fill: Media File"`).
// Minified identifiers replaced by named constants below; !0/!1 → true/false.

export const BLEND_MODES = { /* объект cs из бандла: Normal: 0 … Luminosity: 25 */ };
// …остальные option-таблицы, на которые ссылаются panels (каналы, wrap modes,
// gradient modes, sine modes и т.п.) — найти каждую по имени переменной в
// бандле и вставить с содержательным именем.

export const MODULES = { /* реестр 19 модулей */ };
```

Правила конверсии: `!0`→`true`, `!1`→`false`; каждую минифицированную ссылку (например `options: f4`) заменить именованной константой, определённой выше; функции внутри panels (если встретятся format/callback) переносить дословно.

- [ ] **Step 4: Прогнать проверку**

Run: `node reference/filtr/tools/verify-modules.mjs`
Expected: `OK: 19 modules verified`. (Импорт также падает ReferenceError'ом, если осталась неразрешённая минифицированная ссылка.)

- [ ] **Step 5: Commit**

```bash
git add reference/filtr/modules.js reference/filtr/tools/verify-modules.mjs
git commit -m "ref: extract module registry (19 modules) as verified data"
```

---

### Task 5: Пресеты → presets.js

**Files:**
- Create: `reference/filtr/tools/verify-presets.mjs`
- Create: `reference/filtr/presets.js`

- [ ] **Step 1: Написать проверочный скрипт** `reference/filtr/tools/verify-presets.mjs`:

```js
// Verifies reference/filtr/presets.js against known preset inventory.
import { PRESETS } from '../presets.js';
import { MODULES } from '../modules.js';

const EXPECTED_NAMES = [
  'Avant-Garde Mirrors', 'Bioplastic Cell', 'Blazing Box', 'Braindance Loop',
  'Bubble Wrap', 'Chill Workflow', 'Chroma Modulation', 'Clay Rainbow Aesthetics',
  'Corrosive Spectrum Wave', 'Deadline Flexing', 'Gradient Plating', 'Hyper Ink',
  'Lofi Breezing', 'Magic Branding', 'Metaphysics Pool', 'Molten Scars Relief',
  'Mosaic Reflection', 'Noir Carbon Imprint', 'Plasma Drift', 'Printed Memories',
  'Rad Workflow', 'Radiant Plastique', 'Reflective Stack', 'Soft Errors',
  'Soft Metal Stream', 'Temporal Portrait', 'Toxic Atmosphere', 'UV Alloy',
];
// ВНИМАНИЕ: имена сверить с картой displayName→var в бандле (якорь
// `"User Preset": "userPreset"`); при расхождении правьте ЭТОТ список
// по факту из бандла и зафиксируйте отличие в сообщении коммита.

if (PRESETS.length !== EXPECTED_NAMES.length) {
  throw new Error(`Expected ${EXPECTED_NAMES.length} presets, got ${PRESETS.length}`);
}
const moduleKeys = new Set(Object.keys(MODULES));
for (const p of PRESETS) {
  if (p.toolId !== 'filtr-tool') throw new Error(`${p.name}: bad toolId`);
  if (typeof p.version !== 'number') throw new Error(`${p.name}: missing version`);
  if (!p.main?.cnv) throw new Error(`${p.name}: missing main.cnv`);
  if (!Array.isArray(p.modules)) throw new Error(`${p.name}: missing modules[]`);
  for (const m of p.modules) {
    if (!moduleKeys.has(m.name)) throw new Error(`${p.name}: unknown module "${m.name}"`);
    if (typeof m.ref !== 'string') throw new Error(`${p.name}: module without ref`);
  }
  if (!EXPECTED_NAMES.includes(p.name)) throw new Error(`Unexpected preset "${p.name}"`);
}
console.log(`OK: ${PRESETS.length} presets verified`);
```

- [ ] **Step 2: Убедиться, что проверка падает**

Run: `node reference/filtr/tools/verify-presets.mjs`
Expected: FAIL — `Cannot find module '../presets.js'`.

- [ ] **Step 3: Извлечь пресеты**

В `reference/filtr/bundle-pretty.js` каждый пресет — объект вида `{ toolId: "filtr-tool", version: 2, name: "…", createdAt: "…", main: {…}, modules: […] }` (grep `toolId: "filtr-tool"` даёт все вхождения; рядом карта displayName→имя переменной, якорь `"User Preset": "userPreset"`). Скопировать все встроенные пресеты (кроме `userPreset` — это слот пользователя, не данные) в `reference/filtr/presets.js`:

```js
// Built-in presets extracted verbatim from the deployed filtr-tool bundle.
// !0/!1 → true/false; порядок — как в карте displayName→var из бандла.
export const PRESETS = [ /* 28 объектов */ ];
```

- [ ] **Step 4: Прогнать проверку**

Run: `node reference/filtr/tools/verify-presets.mjs`
Expected: `OK: 28 presets verified`.

- [ ] **Step 5: Commit**

```bash
git add reference/filtr/presets.js reference/filtr/tools/verify-presets.mjs
git commit -m "ref: extract 28 built-in presets as verified data"
```

---

### Task 6: Архитектурные заметки → architecture.md

**Files:**
- Create: `reference/filtr/architecture.md`

- [ ] **Step 1: Исследовать бандл по якорям и записать заметки**

Обязательные разделы `architecture.md` (каждый — с номерами строк bundle-pretty.js, чтобы будущие фазы могли перепроверить):

1. **Пайплайн пассов** — функция с `getPasses` / `rebuildPassesAndRender` (якорь: grep `rebuildPassesAndRender`): как стек превращается в пассы, как модуль объявляет пасс(ы), где применяются blend/mix, как рендерятся члены маски.
2. **Разделение состояния** — `appState` / `runtimeState` / `uiState`, содержимое `cnv` и `rec` (якорь: grep `appState`, деструктуризация в `createWorkspace`).
3. **MASK-механика** — `__maskMembers`, валидационные предупреждения (якорь: grep `member-is-mask`), UI-классы `is-mask-group-start` / `is-mask-affected*`.
4. **Загрузчик ассетов** — пары loadShader, preview/full варианты медиа (по два хэша на img/text/noise), таблица key→файл.
5. **Blend-режимы** — таблица 26 режимов (имя→индекс) и где индекс уходит в шейдер (`u_blendMode`).
6. **Рекордер** — какие библиотеки в бандле (webm-muxer: якорь grep `EBML`), параметры (FPS, Bitrate Level, Frame Quality, Animation Length/Range).
7. **Watermark** — где используется `watermark-*.webp` (связан ли с лицензией); решение спеки: не переносится вместе с лицензированием — подтвердить/опровергнуть по коду.
8. **Известные проблемы старого кода** — всё замеченное по ходу (например, постоянный draw-цикл без dirty-flag) — это входные данные для оптимизаций из спеки.

- [ ] **Step 2: Самопроверка полноты**

Run: `grep -c '^## ' reference/filtr/architecture.md`
Expected: ≥ 8 (по разделу на пункт выше).

- [ ] **Step 3: Commit**

```bash
git add reference/filtr/architecture.md
git commit -m "ref: document filtr-tool architecture from bundle analysis"
```

---

### Task 7: README референса (запуск эталона и правила сверки)

**Files:**
- Create: `reference/filtr/README.md`

- [ ] **Step 1: Написать README** со следующим содержанием (дословно, дополнив фактами из Task 3/6):

```markdown
# reference/filtr — референс старого filtr-tool

Исходников старого инструмента нет; этот каталог — реверс-референс,
извлечённый из деплоя https://antlii.github.io/filtr-tool/.

## Состав
- `live/` — задеплоенный инструмент, скачанный «как есть» (эталон для A/B).
- `bundle-pretty.js` — отформатированный JS-бандл (все ссылки на строки в
  architecture.md указывают сюда; js-beautify@1.15.4).
- `shaders/` — оригинальные GLSL-шейдеры (WebGL2, #version 300 es).
- `modules.js` / `presets.js` — реестр модулей и пресеты, проверяются
  скриптами из `tools/`.
- `architecture.md` — как устроен старый пайплайн/состояние/маски/рекордер.

## Запуск эталона
    cd reference/filtr/live && python3 -m http.server 8123
    # открыть http://localhost:8123/filtr-tool/

## Правила сверки паритета (для всех последующих фаз)
1. Одинаковый вход: одно и то же изображение загружено и в эталон, и в Lumen.
2. Применить пресет в обоих; совпасть должны: композиция, характер эффекта,
   палитра. Допустимы расхождения из-за сидов рандома, если пресет их не фиксирует.
3. Расхождение → сверить порядок пассов и uniforms с architecture.md и
   shaders/*.frag, прежде чем менять новый код.

## Проверка целостности референса
    node reference/filtr/tools/verify-modules.mjs
    node reference/filtr/tools/verify-presets.mjs
```

- [ ] **Step 2: Прогнать обе проверки ещё раз (регресс всего каталога)**

Run: `node reference/filtr/tools/verify-modules.mjs && node reference/filtr/tools/verify-presets.mjs`
Expected: `OK: 19 modules verified` и `OK: 28 presets verified`.

- [ ] **Step 3: Commit**

```bash
git add reference/filtr/README.md
git commit -m "ref: add reference README with etalon usage and parity rules"
```

---

## Definition of Done (фаза 1)

- `reference/filtr/live/` открывается локально и инструмент работает (ручная проверка в браузере).
- 15 шейдеров с чистыми именами, все `#version 300 es` + `void main`.
- `modules.js` (19) и `presets.js` (28) проходят verify-скрипты.
- `architecture.md` покрывает 8 обязательных разделов.
- Следующая фаза (каркас проекта) планируется отдельным документом на базе этого референса.
