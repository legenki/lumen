# Lumen Phase 3: WebGL2 Pipeline + Fill Modules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Работающий WebGL2-пайплайн шейдерных пассов (ping-pong framebuffers, как в старом filtr-tool) и четыре Fill-модуля (fillColor, fillGradient, fillMedia, fillNoise) с дословными шейдерами — первый видимый генеративный результат Lumen с временным dev-UI стека.

**Architecture:** Оффскрин-буфер становится WEBGL-графикой (`p.createGraphics(w, h, WEBGL)`) с тремя framebuffer'ами (`fboBlank/fboA/fboB`, HALF_FLOAT без depth — дословно параметры старого кода, bundle-pretty.js:47573-47588). Каждый модуль стека = шейдерный пасс: `fbo.begin() → clear → shader → setUniform'ы → rect → fbo.end()`, выход `fbo.color` — вход следующего (реестр пассов старого кода: bundle-pretty.js:47271-47420). Модули объявляют **чистую** функцию `uniforms(params, env)` → плоский объект имя→значение — это делает транскрипцию uniform-маппинга тестируемой в vitest без WebGL. Анимация: `scheduler.setAnimating(cnv.animation)`, кадр `frame=(frame+1)%totalFrames`, `env.time=frame/totalFrames`.

**Tech Stack:** p5 2.2.3 (WEBGL = WebGL2-контекст, createFramebuffer/createShader), GLSL ES 3.00 (дословные шейдеры из reference/filtr/shaders/), vitest.

**Контекст для исполнителя без предыстории:**
- Спека: `docs/superpowers/specs/2026-07-10-lumen-migration-design.md`; реверс: `reference/filtr/` (architecture.md §1 — пайплайн, shaders/README.md §1 — vertex); реестр модулей: `reference/filtr/modules.js`; пасс-функции старого кода: `reference/filtr/bundle-pretty.js:47271-47420` (читаются легко, сверяйся при любых сомнениях).
- Фаза 2 дала: state.js (`stack: []`, bufferSize), scheduler.js (noLoop/requestRender/setAnimating), viewport.js, app.js (2D тест-буфер — в этой фазе заменяется), panelBuilder, persistence, assets.js (DEFAULT_MEDIA).
- Правила AGENTS.md: instance mode; offline-first; восстановление режимов после resizeCanvas; **zero-allocation в draw** (в этой фазе включается loop() — правило становится горячим; все scratch-массивы хойстятся на уровень модуля).
- Маски — фаза 5: `u_maskUse=false`, `u_mask=placeholder` (1×1 белая картинка) во всех пассах; сигнатуры это уже учитывают.

---

### Task 1: Шейдеры (вендоринг дословно)

**Files:**
- Create: `src/shaders/lumen.vert`, `src/shaders/fillColor.frag`, `src/shaders/fillGradient.frag`, `src/shaders/fillMedia.frag`, `src/shaders/fillNoise.frag`

- [ ] **Step 1: Vertex-шейдер** `src/shaders/lumen.vert` — дословно из reference/filtr/shaders/README.md §1 (fullscreen-quad, БЕЗ матриц p5):

```glsl
#version 300 es
precision highp float;

in vec3 aPosition;
in vec2 aTexCoord;

out vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;

  vec4 pos = vec4(aPosition, 1.0);
  pos.xy = pos.xy * 2.0 - 1.0;

  gl_Position = pos;
}
```

- [ ] **Step 2: Копии fill-фрагов**

```bash
for f in fillColor fillGradient fillMedia fillNoise; do
  cp "reference/filtr/shaders/$f.frag" "src/shaders/$f.frag"
done
for f in fillColor fillGradient fillMedia fillNoise; do
  cmp "reference/filtr/shaders/$f.frag" "src/shaders/$f.frag" && echo "OK $f"
done
```
Expected: 4 × OK (байт-в-байт).

- [ ] **Step 3: Commit**

```bash
git add src/shaders
git commit -m "feat: vendor fill fragment shaders and fullscreen-quad vertex shader"
```

---

### Task 2: Zero-alloc viewport (out-параметр) + анимационная проводка scheduler

**Files:**
- Modify: `src/js/viewport.js`, `src/js/viewport.test.js`, `src/js/scheduler.js`, `src/js/scheduler.test.js`

- [ ] **Step 1: Обновить тесты viewport** — добавить в `src/js/viewport.test.js`:

```js
  it('writes into a reusable out-object (zero-alloc draw loop)', () => {
    const out = {};
    const v = computeViewport({ winW: 1920, winH: 1080, bufW: 1200, bufH: 1200 }, out);
    expect(v).toBe(out); // тот же объект, не новый
    expect(out.w).toBeCloseTo(918, 0);
  });
```

- [ ] **Step 2: Тест падает** — `npm test -- viewport` → FAIL (out игнорируется).

- [ ] **Step 3: Реализация** — сигнатура `computeViewport({...}, out = {})`; вместо возврата литерала:

```js
export function computeViewport({ winW, winH, bufW, bufH }, out = {}) {
  const availW = winW - PANEL_LEFT - PANEL_RIGHT;
  const availH = winH;
  const scale = Math.min(availW / bufW, availH / bufH) * FIT;
  out.w = bufW * scale;
  out.h = bufH * scale;
  out.x = PANEL_LEFT + (availW - out.w) / 2;
  out.y = (availH - out.h) / 2;
  return out;
}
```

- [ ] **Step 4: Тест анимационного кадра scheduler** — добавить в `src/js/scheduler.test.js`:

```js
  it('exposes animating state for the draw loop', () => {
    const p = fakeP5();
    const s = createRenderScheduler(p);
    s.init();
    expect(s.isAnimating()).toBe(false);
    s.setAnimating(true);
    expect(s.isAnimating()).toBe(true);
  });
```
(isAnimating уже реализован — тест закрепляет контракт; должен пройти сразу.)

- [ ] **Step 5: Прогнать** — `npm test` → PASS все; `npm run lint` → чисто.

- [ ] **Step 6: Commit**

```bash
git add src/js/viewport.js src/js/viewport.test.js src/js/scheduler.test.js
git commit -m "feat: zero-alloc viewport out-param for the hot draw loop"
```

---

### Task 3: stack.js + uniformUtils.js (TDD)

**Files:**
- Create: `src/js/stack.js`, `src/js/modules/uniformUtils.js`
- Test: `src/js/stack.test.js`, `src/js/modules/uniformUtils.test.js`

- [ ] **Step 1: Тесты stack** (`src/js/stack.test.js`):

```js
import { describe, it, expect } from 'vitest';
import { createModuleInstance, addModule, removeModule, getRenderPasses } from './stack.js';
import { createDefaultState } from './state.js';
import { MODULES } from './modules/index.js';

describe('createModuleInstance', () => {
  it('builds an instance with cloned defaults and unique id', () => {
    const a = createModuleInstance('fillColor', ['p01']);
    expect(a).toMatchObject({ id: 'p02', type: 'pass', module: 'fillColor', enabled: true });
    expect(a.params).toEqual(MODULES.fillColor.defaults);
    a.params.mix = 0.5;
    expect(MODULES.fillColor.defaults.mix).toBe(1); // дефолты не мутируются
  });
  it('generates sequential ids p01, p02… skipping existing', () => {
    expect(createModuleInstance('fillColor', []).id).toBe('p01');
    expect(createModuleInstance('fillColor', ['p01', 'p03']).id).toBe('p04');
  });
  it('throws on unknown module key', () => {
    expect(() => createModuleInstance('nope', [])).toThrow(/Unknown module/);
  });
});

describe('addModule / removeModule', () => {
  it('appends to state.stack and removes by id', () => {
    const s = createDefaultState();
    const inst = addModule(s, 'fillGradient');
    expect(s.stack).toHaveLength(1);
    expect(s.stack[0]).toBe(inst);
    removeModule(s, inst.id);
    expect(s.stack).toHaveLength(0);
  });
});

describe('getRenderPasses', () => {
  it('returns only enabled pass-type entries, preserving order', () => {
    const s = createDefaultState();
    const a = addModule(s, 'fillColor');
    const b = addModule(s, 'fillGradient');
    b.enabled = false;
    const c = addModule(s, 'fillNoise');
    expect(getRenderPasses(s.stack).map((m) => m.id)).toEqual([a.id, c.id]);
  });
});
```

- [ ] **Step 2: Тесты uniformUtils** (`src/js/modules/uniformUtils.test.js`) — транскрипция хелперов старого кода (bundle-pretty.js:47526-47542: `C` hex→rgb01, `D` hex+mix→vec4; `Es` = radians; упаковка градиента 47321-47323):

```js
import { describe, it, expect } from 'vitest';
import { hexToRgba, radians, packGradient, GRADIENT_MAX } from './uniformUtils.js';

describe('hexToRgba', () => {
  it('converts #RRGGBB + alpha into reused [r,g,b,a] 0..1', () => {
    const out = new Float32Array(4);
    const r = hexToRgba('#FF0000', 0.5, out);
    expect(r).toBe(out);
    expect(Array.from(r)).toEqual([1, 0, 0, 0.5]);
  });
  it('supports #RGB shorthand', () => {
    const r = hexToRgba('#0F0', 1, new Float32Array(4));
    expect(Array.from(r)).toEqual([0, 1, 0, 1]);
  });
});

describe('radians', () => {
  it('converts degrees', () => {
    expect(radians(90)).toBeCloseTo(Math.PI / 2, 10);
    expect(radians(-180)).toBeCloseTo(-Math.PI, 10);
  });
});

describe('packGradient', () => {
  it('packs stops into 16-slot time/color arrays (colors /255, alpha as-is)', () => {
    expect(GRADIENT_MAX).toBe(16);
    const times = new Array(GRADIENT_MAX).fill(0);
    const colors = new Array(GRADIENT_MAX * 4).fill(0);
    const stops = [
      { time: 0, value: { r: 255, g: 255, b: 255, a: 1 } },
      { time: 1, value: { r: 0, g: 0, b: 0, a: 0.5 } },
    ];
    const count = packGradient(stops, times, colors);
    expect(count).toBe(2);
    expect(times.slice(0, 2)).toEqual([0, 1]);
    expect(colors.slice(0, 8)).toEqual([1, 1, 1, 1, 0, 0, 0, 0.5]);
    expect(times[2]).toBe(0); // хвост занулён
  });
});
```

- [ ] **Step 3: Убедиться, что падают** — `npm test -- stack uniformUtils` → FAIL (модулей нет; stack.test также упадёт на import modules/index.js — его создаёт Task 4; на этом шаге допустимо, что stack.test падает именно на отсутствующем импорте).

- [ ] **Step 4: Реализация**

`src/js/modules/uniformUtils.js`:

```js
// LUMEN — хелперы транскрипции uniform'ов (дословная семантика старого кода:
// bundle-pretty.js:47526-47542 (hex→vec), 47321-47323 (упаковка градиента)).
// Все функции пишут в переданные буферы — zero-alloc в горячем цикле.

export const GRADIENT_MAX = 16; // MAX_GRADIENT_POINTS в fillGradient.frag:26

export function hexToRgba(hex, alpha, out) {
  const o = hex[0] === '#' ? 1 : 0;
  const short = hex.length - o === 3;
  const ch = (i) => parseInt(short ? hex[o + i] + hex[o + i] : hex.substr(o + i * 2, 2), 16);
  out[0] = ch(0) / 255;
  out[1] = ch(1) / 255;
  out[2] = ch(2) / 255;
  out[3] = alpha;
  return out;
}

export function radians(deg) {
  return (deg * Math.PI) / 180;
}

/** Пакует стопы градиента в 16-слотовые массивы шейдера; возвращает их число. */
export function packGradient(stops, timesOut, colorsOut) {
  timesOut.fill(0);
  colorsOut.fill(0);
  const n = Math.min(stops.length, GRADIENT_MAX);
  for (let i = 0; i < n; i++) {
    timesOut[i] = stops[i].time;
    colorsOut[i * 4] = stops[i].value.r / 255;
    colorsOut[i * 4 + 1] = stops[i].value.g / 255;
    colorsOut[i * 4 + 2] = stops[i].value.b / 255;
    colorsOut[i * 4 + 3] = stops[i].value.a;
  }
  return n;
}
```

`src/js/stack.js`:

```js
// LUMEN — операции над стеком модулей (спека §2: stack — ядро модели).
// Формат инстанса: { id, type: 'pass'|'mask', module, enabled, params }.
import { MODULES } from './modules/index.js';

// Семантика id — максимум+1 (ref'ы монотонны, как в пресетах старого кода):
// nextId(['p01','p03']) → 'p04', а не «первый свободный» p02.
function nextId(existingIds) {
  let max = 0;
  for (const id of existingIds) {
    const m = /^p(\d+)$/.exec(id);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `p${String(max + 1).padStart(2, '0')}`;
}

export function createModuleInstance(moduleKey, existingIds) {
  const def = MODULES[moduleKey];
  if (!def) throw new Error(`Unknown module: ${moduleKey}`);
  return {
    id: nextId(existingIds),
    type: def.type,
    module: moduleKey,
    enabled: true,
    params: structuredClone(def.defaults),
  };
}

export function addModule(state, moduleKey) {
  const inst = createModuleInstance(moduleKey, state.stack.map((m) => m.id));
  state.stack.push(inst);
  return inst;
}

export function removeModule(state, id) {
  const i = state.stack.findIndex((m) => m.id === id);
  if (i >= 0) state.stack.splice(i, 1);
}

/** Включённые цветовые пассы в порядке стека (маски — фаза 5). */
export function getRenderPasses(stack) {
  return stack.filter((m) => m.enabled && m.type === 'pass');
}
```


- [ ] **Step 5: Прогнать** — `npm test -- stack uniformUtils`: uniformUtils PASS; stack.test всё ещё падает ТОЛЬКО на `./modules/index.js` (нет файла) — это ожидаемо до Task 4. Если падает на чём-то другом — чинить сейчас.

- [ ] **Step 6: Commit**

```bash
git add src/js/stack.js src/js/stack.test.js src/js/modules/uniformUtils.js src/js/modules/uniformUtils.test.js
git commit -m "feat: stack operations and uniform transcription helpers (TDD)"
```

---

### Task 4: Четыре Fill-модуля + реестр (TDD)

**Files:**
- Create: `src/js/modules/fillColor.js`, `src/js/modules/fillGradient.js`, `src/js/modules/fillMedia.js`, `src/js/modules/fillNoise.js`, `src/js/modules/index.js`
- Test: `src/js/modules/fills.test.js`

Каждый модуль: `{ key, label, type: 'pass', defaults, uniforms(params, env) }`. `defaults` — ДОСЛОВНО из `reference/filtr/modules.js` (импортировать нельзя — reference вне src; скопировать значения, ниже они приведены). `uniforms` возвращает переиспользуемый плоский объект имя→значение (scratch-объект и массивы хойстнуты на уровень модуля — zero-alloc; пайплайн только читает его синхронно). `env` = `{ width, height, time, frameRate, totalFrames, media }`.

Маппинг uniform'ов — дословная транскрипция bundle-pretty.js:47271-47369 (fillNoise 47286, fillColor 47303, fillGradient 47320-47326, fillMedia 47369). `u_src`/`u_mask`/`u_maskUse` НЕ входят в `uniforms()` — их ставит пайплайн (вход цепочки и маска — его зона).

- [ ] **Step 1: Тесты** (`src/js/modules/fills.test.js`):

```js
import { describe, it, expect } from 'vitest';
import { MODULES } from './index.js';
import { GRADIENT_MAX } from './uniformUtils.js';

const ENV = { width: 1200, height: 960, time: 0.25, frameRate: 60, totalFrames: 600, media: {} };

describe('MODULES registry', () => {
  it('has exactly the four fill modules, keyed consistently', () => {
    expect(Object.keys(MODULES).sort()).toEqual(
      ['fillColor', 'fillGradient', 'fillMedia', 'fillNoise'],
    );
    for (const [key, def] of Object.entries(MODULES)) {
      expect(def.key).toBe(key);
      expect(def.type).toBe('pass');
      expect(typeof def.uniforms).toBe('function');
    }
  });
});

describe('fillColor.uniforms (bundle 47303)', () => {
  it('maps defaults verbatim', () => {
    const u = MODULES.fillColor.uniforms(MODULES.fillColor.defaults, ENV);
    expect(Array.from(u.u_color)).toEqual([1, 1, 1, 1]); // #FFFFFF, mix 1
    expect(u.u_blendMode).toBe(0);
    expect(u.u_alphaMode).toBe(0);
  });
  it('bakes mix into color alpha', () => {
    const u = MODULES.fillColor.uniforms({ ...MODULES.fillColor.defaults, color: '#FF0000', mix: 0.5 }, ENV);
    expect(Array.from(u.u_color)).toEqual([1, 0, 0, 0.5]);
  });
});

describe('fillGradient.uniforms (bundle 47320-47326)', () => {
  it('maps defaults verbatim', () => {
    const p = MODULES.fillGradient.defaults;
    const u = MODULES.fillGradient.uniforms(p, ENV);
    expect(u.u_aspect).toBeCloseTo(1200 / 960, 10);
    expect(u.u_resolution).toEqual([1200, 960]);
    expect(u.u_mix).toBe(1);
    expect(u.u_ditherStrength).toBeCloseTo(10 / 255, 10);
    expect(u.u_gradMode).toBe(0);
    expect(u.u_gradCenter).toEqual([0, 0]);
    expect(u.u_gradAngle).toBe(0);
    expect(u.u_gradScale).toEqual([1, 1]); // скаляр дублируется в vec2
    expect(u.u_gradReverse).toBe(false);
    expect(u.u_wrapMode).toBe(0);
    expect(u.u_gradStopCount).toBe(2);
    expect(u.u_gradTime).toHaveLength(GRADIENT_MAX);
    expect(u.u_gradColor).toHaveLength(GRADIENT_MAX * 4);
    expect(u.u_gradColor.slice(0, 8)).toEqual([1, 1, 1, 1, 0, 0, 0, 1]);
  });
  it('converts angle degrees to radians', () => {
    const u = MODULES.fillGradient.uniforms({ ...MODULES.fillGradient.defaults, gradAngle: 90 }, ENV);
    expect(u.u_gradAngle).toBeCloseTo(Math.PI / 2, 10);
  });
});

describe('fillMedia.uniforms (bundle 47369)', () => {
  it('maps params verbatim (scale /100, rotate rad, offset /100)', () => {
    const p = { ...MODULES.fillMedia.defaults, scale: 150, rotate: 45, position: { x: 10, y: -20 } };
    const u = MODULES.fillMedia.uniforms(p, ENV);
    expect(u.u_scale).toBeCloseTo(1.5, 10);
    expect(u.u_rotate).toBeCloseTo(Math.PI / 4, 10);
    expect(u.u_offset).toEqual([0.1, -0.2]);
    expect(u.u_wrapMode).toBe(3); // дефолт fillMedia
    expect(u.u_blendMode).toBe(0);
    expect(u.u_mix).toBe(1);
    expect(u.u_srcRes).toEqual([1200, 960]);
  });
});

describe('fillNoise.uniforms (bundle 47286)', () => {
  it('maps defaults + env verbatim', () => {
    const u = MODULES.fillNoise.uniforms(MODULES.fillNoise.defaults, ENV);
    expect(u.u_mix).toBeCloseTo(0.2, 10);
    expect(u.u_blendMode).toBe(0);
    expect(u.u_contrast).toBe(1);
    expect(u.u_grainPx).toBe(1); // p.size
    expect(u.u_colorNoise).toBe(false);
    expect(u.u_alphaMode).toBe(0);
    expect(u.u_threshRange).toEqual([0, 1]);
    expect(u.u_threshSoft).toBe(0.25); // константа старого кода
    expect(u.u_fps).toBe(0);
    expect(u.u_time).toBe(0.25);
    expect(u.u_clipFps).toBe(60);
    expect(u.u_totalFrames).toBe(600);
    expect(u.u_seed).toBe(0); // константа старого кода
    expect(u.u_srcRes).toEqual([1200, 960]);
  });
});

describe('zero-alloc contract', () => {
  it('uniforms() returns the same object on repeated calls', () => {
    const m = MODULES.fillGradient;
    const a = m.uniforms(m.defaults, ENV);
    const b = m.uniforms(m.defaults, ENV);
    expect(b).toBe(a);
  });
});
```

- [ ] **Step 2: Падают** — `npm test -- fills` → FAIL (модулей нет).

- [ ] **Step 3: Реализация.** Дефолты — дословно из reference/filtr/modules.js:

`src/js/modules/fillColor.js`:

```js
// Транскрипция пасса fillColor (bundle-pretty.js:47288-47304).
import { hexToRgba } from './uniformUtils.js';

const colorVec = new Float32Array(4);
const U = { u_color: colorVec, u_blendMode: 0, u_alphaMode: 0 };

export const fillColor = {
  key: 'fillColor',
  label: 'Fill: Color',
  type: 'pass',
  defaults: { blendMode: 0, mix: 1, color: '#FFFFFF', alphaMode: 0 },
  uniforms(p, _env) {
    hexToRgba(p.color, p.mix, colorVec); // старый D(): mix уходит в альфу цвета
    U.u_blendMode = p.blendMode;
    U.u_alphaMode = p.alphaMode;
    return U;
  },
};
```

`src/js/modules/fillGradient.js`:

```js
// Транскрипция пасса fillGradient (bundle-pretty.js:47305-47327).
import { radians, packGradient, GRADIENT_MAX } from './uniformUtils.js';

const DITHER_STRENGTH = 10 / 255; // fF, bundle-pretty.js:39180

const times = new Array(GRADIENT_MAX).fill(0);
const colors = new Array(GRADIENT_MAX * 4).fill(0);
const U = {
  u_aspect: 1, u_resolution: [0, 0], u_mix: 1, u_blendMode: 0,
  u_ditherStrength: DITHER_STRENGTH, u_gradMode: 0, u_gradCenter: [0, 0],
  u_gradAngle: 0, u_gradScale: [1, 1], u_gradReverse: false, u_wrapMode: 0,
  u_alphaMode: 0, u_gradStopCount: 2, u_gradTime: times, u_gradColor: colors,
};

export const fillGradient = {
  key: 'fillGradient',
  label: 'Fill: Gradient',
  type: 'pass',
  defaults: {
    mix: 1,
    gradient: [
      { time: 0, value: { r: 255, g: 255, b: 255, a: 1 } },
      { time: 1, value: { r: 0, g: 0, b: 0, a: 1 } },
    ],
    gradMode: 0, alphaMode: 0, blendMode: 0, gradScale: 1,
    gradCenter: { x: 0, y: 0 }, gradAngle: 0, gradReverse: false, wrapMode: 0,
  },
  uniforms(p, env) {
    U.u_aspect = env.width / env.height;
    U.u_resolution[0] = env.width;
    U.u_resolution[1] = env.height;
    U.u_mix = p.mix;
    U.u_blendMode = p.blendMode;
    U.u_gradMode = p.gradMode;
    U.u_gradCenter[0] = p.gradCenter.x;
    U.u_gradCenter[1] = p.gradCenter.y;
    U.u_gradAngle = radians(p.gradAngle);
    U.u_gradScale[0] = p.gradScale; // скаляр в обе оси, как в старом коде
    U.u_gradScale[1] = p.gradScale;
    U.u_gradReverse = p.gradReverse;
    U.u_wrapMode = p.wrapMode;
    U.u_alphaMode = p.alphaMode;
    U.u_gradStopCount = packGradient(p.gradient, times, colors);
    return U;
  },
};
```

`src/js/modules/fillMedia.js`:

```js
// Транскрипция пасса fillMedia (bundle-pretty.js:47350-47370).
// Текстуру u_img/u_imgRes ставит пайплайн (media-lookup — его зона, см. pipeline.js);
// здесь только числовые параметры.
import { radians } from './uniformUtils.js';

const U = {
  u_srcRes: [0, 0], u_blendMode: 0, u_mix: 1,
  u_scale: 1, u_rotate: 0, u_offset: [0, 0], u_wrapMode: 3,
};

export const fillMedia = {
  key: 'fillMedia',
  label: 'Fill: Media File',
  type: 'pass',
  defaults: {
    image: 'text0', blendMode: 0, mix: 1, scale: 100, rotate: 0,
    position: { x: 0, y: 0 }, wrapMode: 3,
  },
  uniforms(p, env) {
    U.u_srcRes[0] = env.width;
    U.u_srcRes[1] = env.height;
    U.u_blendMode = p.blendMode;
    U.u_mix = p.mix;
    U.u_scale = p.scale / 100;
    U.u_rotate = radians(p.rotate);
    U.u_offset[0] = p.position.x / 100;
    U.u_offset[1] = p.position.y / 100;
    U.u_wrapMode = p.wrapMode;
    return U;
  },
};
```

`src/js/modules/fillNoise.js`:

```js
// Транскрипция пасса fillNoise (bundle-pretty.js:47271-47287).
const U = {
  u_srcRes: [0, 0], u_mix: 0.2, u_blendMode: 0, u_contrast: 1, u_grainPx: 1,
  u_colorNoise: false, u_alphaMode: 0, u_threshRange: [0, 1],
  u_threshSoft: 0.25, // константа старого кода (47286)
  u_fps: 0, u_time: 0, u_clipFps: 60, u_totalFrames: 1,
  u_seed: 0, // константа старого кода (47286)
};

export const fillNoise = {
  key: 'fillNoise',
  label: 'Fill: Noise Grain',
  type: 'pass',
  defaults: {
    mix: 0.2, blendMode: 0, threshold: { min: 0, max: 1 }, alphaMode: 0,
    contrast: 1, colorNoise: false, size: 1, fps: 0,
  },
  uniforms(p, env) {
    U.u_srcRes[0] = env.width;
    U.u_srcRes[1] = env.height;
    U.u_mix = p.mix;
    U.u_blendMode = p.blendMode;
    U.u_contrast = p.contrast;
    U.u_grainPx = p.size;
    U.u_colorNoise = p.colorNoise;
    U.u_alphaMode = p.alphaMode;
    U.u_threshRange[0] = p.threshold.min;
    U.u_threshRange[1] = p.threshold.max;
    U.u_fps = p.fps;
    U.u_time = env.time;
    U.u_clipFps = env.frameRate;
    U.u_totalFrames = env.totalFrames;
    return U;
  },
};
```

`src/js/modules/index.js`:

```js
// LUMEN — реестр модулей (фаза 3: четыре Fill; остальные 15 — фазы 5+).
import { fillColor } from './fillColor.js';
import { fillGradient } from './fillGradient.js';
import { fillMedia } from './fillMedia.js';
import { fillNoise } from './fillNoise.js';

export const MODULES = {
  fillColor,
  fillGradient,
  fillMedia,
  fillNoise,
};
```

- [ ] **Step 4: Прогнать** — `npm test` → PASS все (включая отложенный stack.test из Task 3); `npm run lint` → чисто.

- [ ] **Step 5: Сверка дефолтов с reference**

```bash
node -e "
Promise.all([import('./reference/filtr/modules.js'), import('./src/js/modules/index.js')]).then(([r, s]) => {
  for (const k of Object.keys(s.MODULES)) {
    const a = JSON.stringify(r.MODULES[k].defaults);
    const b = JSON.stringify(s.MODULES[k].defaults);
    if (a !== b) { console.error('MISMATCH', k, a, b); process.exit(1); }
    console.log('OK', k);
  }
})"
```
Expected: 4 × OK.

- [ ] **Step 6: Commit**

```bash
git add src/js/modules src/js/stack.test.js
git commit -m "feat: four fill modules with tested verbatim uniform transcription"
```

---

### Task 5: media.js — загрузка дефолтных медиа

**Files:**
- Create: `src/js/media.js`
- Test: `src/js/media.test.js`

- [ ] **Step 1: Тест** (`src/js/media.test.js`) — логика реестра с инжектированным загрузчиком (без браузера):

```js
import { describe, it, expect } from 'vitest';
import { createMediaRegistry } from './media.js';

function fakeLoader(fail = new Set()) {
  return (url, ok, err) => {
    setTimeout(() => {
      if (fail.has(url)) err(new Error('404'));
      else ok({ width: 64, height: 32 }); // как p5.Image
    }, 0);
  };
}

describe('createMediaRegistry', () => {
  it('loads sources and exposes ready entries with resolution', async () => {
    const reg = createMediaRegistry({ img0: '/a.webp', text0: '/b.webp' }, fakeLoader());
    await reg.whenReady();
    const e = reg.get('text0');
    expect(e.ready).toBe(true);
    expect(e.res).toEqual([64, 32]);
    expect(e.tex).toBeTruthy();
  });
  it('marks failed loads as not ready without throwing', async () => {
    const reg = createMediaRegistry({ img0: '/a.webp' }, fakeLoader(new Set(['/a.webp'])));
    await reg.whenReady();
    expect(reg.get('img0').ready).toBe(false);
  });
  it('returns undefined for unknown keys', async () => {
    const reg = createMediaRegistry({}, fakeLoader());
    await reg.whenReady();
    expect(reg.get('nope')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Падает** — `npm test -- media` → FAIL.

- [ ] **Step 3: Реализация** `src/js/media.js`:

```js
// LUMEN — реестр медиа-текстур (фаза 3: только дефолтные ассеты из assets.js;
// пользовательская загрузка/видео — фаза 6). Ошибка загрузки не валит приложение:
// слот остаётся not-ready, fillMedia-пасс просто пропускается (как в старом коде,
// bundle-pretty.js:47353,47364 — «if (!R?.ready) return h»).

export function createMediaRegistry(sources, loadImage) {
  const entries = new Map();
  const jobs = [];
  for (const [key, url] of Object.entries(sources)) {
    const entry = { key, url, ready: false, tex: null, res: [0, 0] };
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
  return {
    get: (key) => entries.get(key),
    whenReady: () => all,
  };
}
```

- [ ] **Step 4: Прогнать** — `npm test -- media` → PASS; полный `npm test`, `npm run lint` → чисто.

- [ ] **Step 5: Commit**

```bash
git add src/js/media.js src/js/media.test.js
git commit -m "feat: media registry for default assets with graceful failures"
```

---

### Task 6: pipeline.js + перевод app.js на WebGL2

**Files:**
- Create: `src/js/pipeline.js`
- Modify: `src/js/app.js` (полная замена), `src/js/graphicsModes.js` (добавить WEBGL-вариант)
- Copy: `src/shared/utils/alphaCheckerboard.js` (из divix, дословно)

- [ ] **Step 1: Вендорить шахматку**

```bash
cp /Users/andy/Documents/GitHub/divix/src/shared/utils/alphaCheckerboard.js src/shared/utils/alphaCheckerboard.js
```

- [ ] **Step 2: WEBGL-вариант восстановления режимов** — добавить в `src/js/graphicsModes.js`:

```js
// WEBGL-буфер после resizeCanvas: p5 сбрасывает stroke/density; framebuffer'ы
// p5 по умолчанию автоследуют размеру канваса — пересоздавать их не нужно.
export function restoreGlModes(g) {
  g.pixelDensity(1);
  g.noStroke();
}
```

- [ ] **Step 3: `src/js/pipeline.js`**

```js
// LUMEN — пайплайн шейдерных пассов: ping-pong между fboA/fboB внутри
// WEBGL-графики. Дословный перенос схемы старого filtr-tool:
// setup fbo — bundle-pretty.js:47573-47588 (HALF_FLOAT, depth:false, antialias:true);
// схема пасса — 47271-47420 (begin/clear/shader/uniforms/rect/end → fbo.color);
// nextTarget — 46916-46918 (pingFBO ^= 1).
import { MODULES } from './modules/index.js';

import lumenVert from '../shaders/lumen.vert?raw';
import fillColorFrag from '../shaders/fillColor.frag?raw';
import fillGradientFrag from '../shaders/fillGradient.frag?raw';
import fillMediaFrag from '../shaders/fillMedia.frag?raw';
import fillNoiseFrag from '../shaders/fillNoise.frag?raw';

const FRAG_SOURCES = {
  fillColor: fillColorFrag,
  fillGradient: fillGradientFrag,
  fillMedia: fillMediaFrag,
  fillNoise: fillNoiseFrag,
};

export function createPipeline(glc, p) {
  // ВАЖНО: p5.Graphics НЕ наследует константы p5.prototype (p5 2.2.3) —
  // glc.HALF_FLOAT === undefined и формат молча деградирует в UNSIGNED_BYTE.
  // Константу берём с корневого инстанса p.
  const fboOpts = { format: p.HALF_FLOAT, depth: false, antialias: true };
  const fboBlank = glc.createFramebuffer(fboOpts);
  const fbos = [glc.createFramebuffer(fboOpts), glc.createFramebuffer(fboOpts)];
  let ping = 0;

  const shaders = {};
  for (const [key, frag] of Object.entries(FRAG_SOURCES)) {
    shaders[key] = glc.createShader(lumenVert, frag);
  }

  // 1×1 белая заглушка для неиспользуемого u_mask (маски — фаза 5).
  const maskPlaceholder = glc.createFramebuffer({ width: 1, height: 1, depth: false });

  function nextTarget() {
    ping ^= 1;
    return fbos[ping];
  }

  function runPass(inst, inputTex, env) {
    const mod = MODULES[inst.module];
    if (!mod) return inputTex;
    if (inst.module === 'fillMedia') {
      const entry = env.media.get(inst.params.image);
      if (!entry?.ready) return inputTex; // как старый код: медиа нет — пасс прозрачен
    }
    const fbo = nextTarget();
    const sh = shaders[inst.module];
    fbo.begin();
    glc.clear();
    glc.shader(sh);
    sh.setUniform('u_src', inputTex);
    sh.setUniform('u_mask', maskPlaceholder.color);
    sh.setUniform('u_maskUse', false);
    const u = mod.uniforms(inst.params, env);
    for (const name in u) sh.setUniform(name, u[name]);
    if (inst.module === 'fillMedia') {
      const entry = env.media.get(inst.params.image);
      sh.setUniform('u_img', entry.tex);
      sh.setUniform('u_imgRes', entry.res);
    }
    glc.rect(-glc.width / 2, -glc.height / 2, glc.width, glc.height);
    fbo.end();
    return fbo.color;
  }

  /** Прогоняет стек; возвращает текстуру финального пасса (или пустую).
   *  Итерация инлайн без .filter() — zero-alloc в горячем цикле (AGENTS.md §5);
   *  getRenderPasses из stack.js — для холодных путей (UI/тесты). */
  function render(stack, env) {
    let tex = fboBlank.color;
    for (let i = 0; i < stack.length; i++) {
      const inst = stack[i];
      if (!inst.enabled || inst.type !== 'pass') continue;
      tex = runPass(inst, tex, env);
    }
    return tex;
  }

  return { render, fboBlank };
}
```

- [ ] **Step 4: Переписать `src/js/app.js`**

```js
// LUMEN — главный контроллер: экранный 2D-canvas на всё окно; WEBGL2-графика
// фиксированного разрешения с пайплайном пассов; шахматка прозрачности под
// результатом (как в старом инструменте); рендер по требованию + анимация.
import { bufferSize } from './state.js';
import { computeViewport } from './viewport.js';
import { createRenderScheduler } from './scheduler.js';
import { restoreGlModes } from './graphicsModes.js';
import { createPipeline } from './pipeline.js';
import { createMediaRegistry } from './media.js';
import { DEFAULT_MEDIA } from './assets.js';
import { createAlphaImage } from '../shared/utils/alphaCheckerboard.js';

export function lumenSketch(p, { state, onReady }) {
  let glc = null; // WEBGL-графика пайплайна
  let pipeline = null;
  let media = null;
  let alphaImg = null;
  const scheduler = createRenderScheduler(p);
  const vp = {}; // zero-alloc: переиспользуемый viewport-объект
  const env = { width: 0, height: 0, time: 0, frameRate: 60, totalFrames: 1, media: null };

  function totalFrames() {
    return Math.max(1, Math.round(state.rec.length.value * state.rec.frameRate));
  }

  function rebuildBuffer() {
    const { width, height } = bufferSize(state.cnv);
    if (!glc) {
      glc = p.createGraphics(width, height, p.WEBGL);
      restoreGlModes(glc);
      pipeline = createPipeline(glc, p);
    } else if (glc.width !== width || glc.height !== height) {
      glc.resizeCanvas(width, height);
      restoreGlModes(glc); // FBO p5 автоследуют размеру канваса
    }
    if (alphaImg) alphaImg.remove();
    alphaImg = createAlphaImage(p, width, height, 1);
    state.runtime.buffer = glc;
  }

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
    media = createMediaRegistry(DEFAULT_MEDIA, (url, ok, err) => p.loadImage(url, ok, err));
    env.media = media;
    media.whenReady().then(() => scheduler.requestRender()); // дозарисовка fillMedia
    rebuildBuffer();
    scheduler.init();
    scheduler.setAnimating(state.cnv.animation);
    scheduler.requestRender();
    if (onReady) {
      onReady({
        scheduler,
        rebuildBuffer,
        getBuffer: () => glc,
        syncAnimation: () => scheduler.setAnimating(state.cnv.animation),
      });
    }
  };

  p.draw = () => {
    scheduler.consumeFrame();
    if (scheduler.isAnimating()) {
      state.runtime.frame = (state.runtime.frame + 1) % totalFrames();
    }
    env.width = glc.width;
    env.height = glc.height;
    env.frameRate = state.rec.frameRate;
    env.totalFrames = totalFrames();
    env.time = state.runtime.frame / env.totalFrames;

    const outTex = pipeline.render(state.stack, env);
    glc.clear();
    glc.image(outTex, -glc.width / 2, -glc.height / 2, glc.width, glc.height);

    computeViewport({ winW: p.width, winH: p.height, bufW: glc.width, bufH: glc.height }, vp);
    p.clear();
    p.image(alphaImg, vp.x, vp.y, vp.w, vp.h);
    p.image(glc, vp.x, vp.y, vp.w, vp.h);
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    scheduler.requestRender();
  };
}
```

Примечание: объект-аргумент `computeViewport({...}, vp)` — единственная оставшаяся аллокация литерала в draw; допустимо (короткоживущий, движки такие не промоутят), НО если хочется строго — хойстни и его. `state.runtime.frame` уже есть в state фазы 2.

- [ ] **Step 5: Smoke**
`npm run lint && npm test && npm run build` → чисто. Dev: `npm run dev -- --port 3211 --strictPort` в фоне; curl 200; убить. Поведение в браузере проверит контроллер (пустой стек = шахматка; добавление модулей — Task 7).

- [ ] **Step 6: Commit**

```bash
git add src/js/pipeline.js src/js/app.js src/js/graphicsModes.js src/shared/utils/alphaCheckerboard.js
git commit -m "feat: WebGL2 ping-pong pass pipeline and app shell on shader buffer"
```

---

### Task 7: Dev-UI стека + анимационный toggle + persistence стека

**Files:**
- Modify: `src/js/controls.js`, `src/js/main.js`

- [ ] **Step 1: Секции** — в `src/js/controls.js` добавить к Canvas-секции чекбокс анимации и новую dev-секцию стека:

```js
// В controls-массив Canvas-секции добавить ПОСЛЕ слайдера scale:
      {
        type: 'check', id: 'lm-cnv-animation', label: 'Animation',
        path: 'cnv.animation', regen: 'animation',
      },
```

и новую секцию в конец LEFT_SECTIONS:

```js
  {
    title: 'Stack (dev)',
    controls: [
      {
        type: 'select', id: 'lm-stack-module', label: 'Module List',
        path: 'ui.devModule',
        options: {
          'Fill: Color': 'fillColor',
          'Fill: Gradient': 'fillGradient',
          'Fill: Media File': 'fillMedia',
          'Fill: Noise Grain': 'fillNoise',
        },
      },
      { type: 'button', id: 'lm-stack-add', label: 'Add To Stack' },
      { type: 'button', id: 'lm-stack-clear', label: 'Clear Stack' },
    ],
  },
```

В `src/js/state.js` НИЧЕГО менять не нужно, кроме одного поля: в `createDefaultState().ui` добавить `devModule: 'fillGradient'` (не сериализуется — ui и так вне PERSISTED). Прогони `npm test` — state-тесты не должны сломаться (они не перечисляют ui-ключи).

- [ ] **Step 2: Диспетчер** — в `src/js/main.js`:

```js
// добавить импорты:
import { addModule } from './stack.js';

// applyChange заменить на:
function applyChange(ctrl) {
  if (ctrl.id === 'lm-btn-save-png') return exportPNG();
  if (ctrl.id === 'lm-stack-add') {
    addModule(state, state.ui.devModule);
    api?.scheduler.requestRender();
    saveState();
    return;
  }
  if (ctrl.id === 'lm-stack-clear') {
    state.stack.length = 0; // AGENTS.md §5: очистка без реаллокации
    api?.scheduler.requestRender();
    saveState();
    return;
  }
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

// в buildUI: openSections(root, [0, 1]); // Canvas + Stack (dev)
```

- [ ] **Step 3: Проверки** — `npm run lint && npm test && npm run build` → чисто; dev-сервер curl 200.

- [ ] **Step 4: Commit**

```bash
git add src/js/controls.js src/js/main.js src/js/state.js
git commit -m "feat: dev stack section, animation toggle and stack persistence"
```

---

## Definition of Done (фаза 3) — проверяет контроллер в браузере

- Пустой стек: шахматка прозрачности по центру рабочей области.
- Add To Stack → Fill: Gradient — бело-чёрный линейный градиент поверх шахматки; Fill: Color (#FFFFFF) — белая заливка; Fill: Media File — текстура text0; Fill: Noise Grain — зерно (при mix 0.2 — слабое поверх предыдущего).
- Порядок пассов: Gradient затем Color — итог белый (Color с mix 1 Normal перекрывает); наоборот — виден градиент.
- Animation toggle: с fillNoise (fps > 0 выставить руками в консоли) зерно меняется по кадрам; выключение — стоп; в покое draw не крутится (runtime.frame стоит при animation=false).
- Persistence: перезагрузка восстанавливает стек.
- **Сверка с эталоном** (reference/filtr/live, http://localhost:8123/filtr-tool/): в эталоне собрать стек fillGradient (дефолт) — визуально идентичный градиент в Lumen (направление, распределение, дизеринг незаметен на глаз). Расхождение → сверить порядок/значения uniform'ов с bundle-pretty.js:47320-47326 до правки кода.
- `npm run lint && npm test && npm run build` — чистые; PNG-экспорт работает с новым WEBGL-буфером.
