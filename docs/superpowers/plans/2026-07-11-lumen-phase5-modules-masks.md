# Lumen Phase 5: Remaining Modules + Mask Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Все 19 модулей эффектов работают в Lumen: +14 pass-модулей (Displace ×4, Blur ×3, Color ×4, Emboss/Lens/Warp) и maskMedia с механикой mask-стека рендера; группы масок видны в LayerList; старые пресеты применяются dev-хуком для сверки с эталоном.

**Architecture:** Пайплайн получает три расширения (дословный перенос из бандла): FBO-пул `getBuffer(name)` (bundle-pretty.js:46916-46934), mask-стек «маска действует на N следующих пассов» (bF/T8/vF, 46951-46986; выключенный пасс тоже списывает заряд — 47622-47626) и blur-движок (класс iIA, 88737-88846: двухпроходный сепарабельный Gaussian с curved-даунсемплингом + motion + copy-композит через blurComp.frag). Модули со сложным пассом (блюры, emboss/lens с пре-блюром, displaceTexture с медиа, maskMedia) получают опциональный хук `run(runCtx)` вместо дефолтного одношейдерного пасса; остальные — прежний `uniforms(params, env)`.

**Tech Stack:** прежний (p5 2.2.3 WEBGL2, vitest); шейдеры — дословно из reference/filtr/shaders/ (11 файлов) и reference/filtr/shaders/README.md §5 (4 инлайн-исходника, уже байт-верифицированы в фазе 1).

**Контекст для исполнителя без предыстории:**
- Repo: `/Users/andy/Documents/GitHub/lumen` (main; коммитить разрешено владельцем). Фазы 1-4 готовы: pipeline.js (ping-pong fboA/B, HALF_FLOAT через корневой `p`), 4 fill-модуля `{key,label,type,defaults,uniforms,controls}`, media.js реестр, инспектор/LayerList, optionTables.js.
- Источник истины: пасс-функции бандла `reference/filtr/bundle-pretty.js:47150-47522` (в плане приведены ключевые маппинги дословно), реестр `reference/filtr/modules.js` (defaults+panels 15 модулей), шейдеры `reference/filtr/shaders/` и README §4-5 там же.
- Хелперы бандла → наши: `ja(v,a,b,c,d)`=map (46940-46942), `Es`=radians, `Q()`=totalFrames, `A`=cnv (`A.scale.value`=env.scaleValue), `t`=rec, `s/n/r/o` = Math.sin/Math.cos/Math.max/2π (47088-47091), `p4(q)`=QUALITY[q] где QUALITY=[1,1.5,3,5] (39253-39258), `hI["Quad In"]`=t², `hI["Sine In"]`=1−cos(tπ/2), `Ii(p)`=1×1 белая заглушка (у нас maskPlaceholder), `B(p,slot)`/`l(key)`=media lookup (у нас env.media.get), `d.getBuffer`=FBO-пул, `d.blur`=blur-движок, `d.textures.blueNoise`.
- Конверсия controls та же, что в фазе 4: number→slider, bool→check, interval→два слайдера `.min`/`.max`, point2d→centerPoint (axes из reference), gradient→gradientMapper, media→select по DEFAULT_MEDIA, select→select (option-таблицы дословно; недостающие добавить в optionTables.js из reference/filtr/modules.js).
- Правила: zero-alloc в draw (scratch-объекты на уровне модуля), дефолты байт-в-байт с reference (verify-скрипт), трейлер коммитов `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Шейдеры (все оставшиеся) + math-хелперы + blue-noise текстура

**Files:**
- Create: `src/shaders/{blurComp,blurNoise,displaceCubic,displaceSimplex,displaceSine,embossEffect,gradientMap,lensGrid,lumaBands,rgbShift,warpGrid}.frag` (копии) и `src/shaders/{maskMedia,blurGaussianDir,displaceTexture,colorCorrection}.frag` (из README §5)
- Modify: `src/js/modules/uniformUtils.js` (+map, +EASE, +QUALITY_SCALE), `src/js/modules/uniformUtils.test.js`, `src/js/app.js` (blueNoise загрузка в env)

- [ ] **Step 1: Копии 11 фрагов**

```bash
for f in blurComp blurNoise displaceCubic displaceSimplex displaceSine embossEffect gradientMap lensGrid lumaBands rgbShift warpGrid; do
  cp "reference/filtr/shaders/$f.frag" "src/shaders/$f.frag"
  cmp "reference/filtr/shaders/$f.frag" "src/shaders/$f.frag" && echo "OK $f"
done
```
Expected: 11 × OK.

- [ ] **Step 2: 4 инлайн-шейдера из README §5** — открыть `reference/filtr/shaders/README.md`, секции §5.1 maskMedia, §5.2 blurGaussian (директиональный блюр движка — у нас имя файла `blurGaussianDir.frag`, чтобы не путать с модулем), §5.3 displaceTexture, §5.4 colorCorrection; скопировать GLSL-блоки ДОСЛОВНО в соответствующие файлы `src/shaders/*.frag`. Проверка: каждый начинается `#version 300 es` и содержит `void main`; число строк сверить с README-блоком.

- [ ] **Step 3: TDD math-хелперы** — добавить в `src/js/modules/uniformUtils.test.js`:

```js
import { map, EASE, QUALITY_SCALE } from './uniformUtils.js';

describe('map (транскрипция ja, bundle 46940-46942)', () => {
  it('remaps linearly', () => {
    expect(map(50, 0, 100, 0, 1)).toBeCloseTo(0.5, 10);
    expect(map(0.3, 0, 1, 0, 0.25)).toBeCloseTo(0.075, 10);
  });
  it('returns out-min when input range is degenerate', () => {
    expect(map(5, 2, 2, 7, 9)).toBe(7);
  });
});

describe('EASE (нужные подмножества hI)', () => {
  it('quadIn = t^2, sineIn = 1-cos(t·π/2)', () => {
    expect(EASE.quadIn(0.5)).toBeCloseTo(0.25, 10);
    expect(EASE.sineIn(1)).toBeCloseTo(1, 10);
    expect(EASE.sineIn(0.5)).toBeCloseTo(1 - Math.cos(Math.PI / 4), 10);
    expect(EASE.linear(0.7)).toBe(0.7);
  });
});

describe('QUALITY_SCALE (yF, bundle 39253)', () => {
  it('is [1, 1.5, 3, 5]', () => {
    expect(QUALITY_SCALE).toEqual([1, 1.5, 3, 5]);
  });
});
```

Реализация в `uniformUtils.js` (дописать):

```js
/** Транскрипция ja (bundle-pretty.js:46940-46942): линейный remap. */
export function map(v, inMin, inMax, outMin, outMax) {
  return inMax === inMin ? outMin : outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin);
}

/** Подмножество таблицы easings hI (bundle 47031-47064), используемое пассами. */
export const EASE = {
  linear: (t) => t,
  quadIn: (t) => t * t,
  sineIn: (t) => 1 - Math.cos((t * Math.PI) / 2),
};

/** Таблица качества блюра yF (bundle 39253); индекс = params.quality. */
export const QUALITY_SCALE = [1, 1.5, 3, 5];
```

- [ ] **Step 4: blueNoise в env** — в `src/js/app.js`: `import { BLUE_NOISE_URL } from './assets.js';`; в env добавить `textures: { blueNoise: null }`; в setup: `p.loadImage(BLUE_NOISE_URL, (img) => { env.textures.blueNoise = img; scheduler.requestRender(); }, () => console.warn('[lumen] blue-noise load failed'));`

- [ ] **Step 5:** `npm test` (все PASS, +3 новых), `npm run lint`, `npm run build` → чисто.

- [ ] **Step 6: Commit**

```bash
git add src/shaders src/js/modules/uniformUtils.js src/js/modules/uniformUtils.test.js src/js/app.js
git commit -m "feat: vendor remaining shaders, math helpers and blue-noise texture"
```

---

### Task 2: Пайплайн v2 — FBO-пул, mask-стек, blur-движок, хук run()

**Files:**
- Create: `src/js/maskStack.js` (+ test), `src/js/blurEngine.js`
- Modify: `src/js/pipeline.js`, `src/js/app.js` (env.scaleValue)

- [x] **Step 1: TDD mask-стек** — `src/js/maskStack.test.js`. Семантика — дословно bF/T8/vF (bundle 46951-46986) + сброс на кадр (47605):

```js
import { describe, it, expect } from 'vitest';
import { resetMaskStack, pushMask, activeMask, consumeMaskCharge } from './maskStack.js';

function ctx() {
  return { maskStack: [], releasedBufs: [] };
}

describe('mask stack (bF/T8/vF, bundle 46951-46986)', () => {
  it('pushMask + activeMask: верхняя запись с left>0', () => {
    const c = ctx();
    pushMask(c, { id: 'p02', bufName: 'p02', left: 2, tex: 'TEX' });
    expect(activeMask(c)).toMatchObject({ id: 'p02', tex: 'TEX' });
  });
  it('consumeMaskCharge списывает заряд и снимает маску на нуле', () => {
    const c = ctx();
    pushMask(c, { id: 'p02', bufName: 'p02', left: 2, tex: 'T' });
    consumeMaskCharge(c, true);
    expect(activeMask(c)).toBeTruthy(); // left 1
    consumeMaskCharge(c, true);
    expect(activeMask(c)).toBeNull(); // снята
    expect(c.maskStack).toHaveLength(0);
  });
  it('заряд списывается и когда пасс шёл без маски (used=false), как в эталоне', () => {
    const c = ctx();
    pushMask(c, { id: 'p02', bufName: 'p02', left: 1, tex: 'T' });
    consumeMaskCharge(c, false);
    expect(activeMask(c)).toBeNull();
  });
  it('вложенный push: активна верхняя', () => {
    const c = ctx();
    pushMask(c, { id: 'a', bufName: 'a', left: 3, tex: 'A' });
    pushMask(c, { id: 'b', bufName: 'b', left: 1, tex: 'B' });
    expect(activeMask(c).id).toBe('b');
    consumeMaskCharge(c, true);
    expect(activeMask(c).id).toBe('a');
  });
  it('resetMaskStack очищает без реаллокации', () => {
    const c = ctx();
    const ref = c.maskStack;
    pushMask(c, { id: 'a', bufName: 'a', left: 1, tex: 'A' });
    resetMaskStack(c);
    expect(c.maskStack).toHaveLength(0);
    expect(c.maskStack).toBe(ref);
  });
});
```

Реализация `src/js/maskStack.js`:

```js
// LUMEN — mask-стек рендера: маска действует на N следующих пассов
// (дословная семантика bF/T8/vF: bundle-pretty.js:46951-46986; выключенный
// пасс тоже списывает заряд — 47622-47626). Запись: { id, bufName, left, tex }.

export function resetMaskStack(ctx) {
  ctx.maskStack.length = 0; // AGENTS.md §5: очистка без реаллокации
}

export function pushMask(ctx, entry) {
  ctx.maskStack.push(entry);
}

/** Верхняя запись с left > 0 или null. */
export function activeMask(ctx) {
  for (let i = ctx.maskStack.length - 1; i >= 0; i--) {
    if (ctx.maskStack[i].left > 0) return ctx.maskStack[i];
  }
  return null;
}

/** Списывает один заряд у активной маски; исчерпанные снимаются со стека. */
export function consumeMaskCharge(ctx, _wasUsed) {
  const top = activeMask(ctx);
  if (top) top.left -= 1;
  while (ctx.maskStack.length && ctx.maskStack[ctx.maskStack.length - 1].left <= 0) {
    ctx.maskStack.pop();
  }
}
```

- [x] **Step 2: blur-движок** — `src/js/blurEngine.js`: ДОСЛОВНАЯ транскрипция класса iIA (bundle 88737-88846) в наши имена. Конструктор `createBlurEngine(glc, p, shaders)` (shaders.blurComp — копи/композит, shaders.blurGaussianDir — директиональный); методы `gaussian(inputTex, targetFbo, opts)`, `motion(inputTex, targetFbo, opts)`, `copy(tex, targetFbo, w, h, opts)`, `resize(w, h)`. Переносить все константы (`FASTKERNEL_SIGMA_PCT=0.015`, `SCALE_CURVE_EXP=0.001`, `SHADER_MAX_RADIUS_PX=480`), формулы `_sigmaToPx`/`_scaleBySigmaPxCurved`/anti-overflow `y($,O)`, температурные FBO `tmpH/tmpHV/stage` (HALF_FLOAT через `p.HALF_FLOAT`!), `glc.textureWrap(glc.CLAMP)` перед пассами, ветки `t.color === A` (self-target через stage) и mix/blend-композит через copy. Открой bundle 88737-88846 рядом и переноси строка-в-строку; uniforms шейдера: u_tex,u_res,u_dir,u_sigmaPx,u_radiusPx,u_inputIsPremult,u_fastKernel,u_maskUse,u_mask (blurGaussianDir) и u_tex,u_useSrc,u_mix,u_blendMode,u_src (blurComp).

- [x] **Step 3: pipeline.js v2** — изменения:
  1. импортировать все новые фраги (?raw) и добавить в FRAG_SOURCES под ключами: blurComp, blurGaussianDir, blurNoise, displaceCubic, displaceSimplex, displaceSine, displaceTexture, gradientMap, colorCorrection, rgbShift, lumaBands, embossEffect, lensGrid, warpGrid, maskMedia;
  2. `const pool = {};` + `getBuffer(name)` — транскрипция bundle 46918-46934: дефолт-опции {width: glc.width, height: glc.height, format: p.HALF_FLOAT, depth: false, antialias: true}, ресайз при несовпадении, кэш в pool;
  3. `const blur = createBlurEngine(glc, p, shaders);`
  4. `const ctx = { glc, p, shaders, pool: {}, maskStack: [], blur, nextTarget, getBuffer, maskPlaceholder };` — runCtx, передаваемый в модульные хуки;
  5. `render(stack, env)`: в начале `resetMaskStack(ctx)`; цикл: для `type==='mask'` — если enabled, вызвать `mod.run({ ctx, inst, inputTex: tex, env })` (вход НЕ меняется); для `type==='pass'`: `const mask = activeMask(ctx); const maskTex = mask ? getBuffer(mask.bufName).color : null;` затем если `!inst.enabled` — только `consumeMaskCharge(ctx, !!mask)` и continue; иначе `tex = (mod.run ? mod.run({ ctx, inst, inputTex: tex, env, maskTex }) : runPass(inst, tex, env, maskTex)) ?? tex; consumeMaskCharge(ctx, !!mask);`
  6. `runPass(..., maskTex)`: `sh.setUniform('u_mask', maskTex ?? maskPlaceholder.color); sh.setUniform('u_maskUse', !!maskTex);`
  7. `resizeAll()` при rebuildBuffer (glc.resizeCanvas уже авторесайзит дефолтные FBO; пул и blur — вручную: `Object.values(pool).forEach(f => f.resize(w, h)); blur.resize(w, h);` — вызвать из app.js после resizeCanvas; экспортировать из createPipeline).
  8. env.scaleValue: в app.js draw — `env.scaleValue = state.cnv.scale.value;` (нужен blurNoise/rgbShift/emboss/lens).

- [x] **Step 4:** `npm test` (maskStack PASS, прежние живы), lint, build; dev-smoke curl. Рендер fills не должен измениться (регрессия — контроллер).

- [x] **Step 5: Commit**

```bash
git add src/js/maskStack.js src/js/maskStack.test.js src/js/blurEngine.js src/js/pipeline.js src/js/app.js
git commit -m "feat: pipeline v2 with fbo pool, mask stack and blur engine"
```

---

### Task 3: Color-группа — gradientMap, colorCorrection, rgbShift, lumaBands

**Files:**
- Create: `src/js/modules/{gradientMap,colorCorrection,rgbShift,lumaBands}.js`
- Modify: `src/js/modules/index.js`, `src/js/modules/optionTables.js` (недостающие таблицы из reference)
- Test: `src/js/modules/colorGroup.test.js`

Дефолты и controls — транскрипция из `reference/filtr/modules.js` (как фаза 4; сверка node-скриптом). Uniform-маппинги дословно из бандла:

**gradientMap** (47328-47348): u_resolution [w,h]; u_mix; u_blendMode; u_ditherStrength 10/255; u_mapMode p.mapMode; u_mapReverse p.mapReverse; u_mapGamma p.mapGamma; u_mapRange [p.mapRange.min, p.mapRange.max]; u_alphaMode; u_gradStopCount min(len,16); u_gradColor/u_gradTime packGradient. Тип контрола mapRange — interval → два слайдера. gradient → gradientMapper.

**colorCorrection** (47371-47387): u_mix; u_brightness; u_contrast; u_saturation. (Только 4 + служебные.)

**rgbShift** (47388-47404): u_mix; u_texelSize [1/w, 1/h]; u_abStrength p.abStrength × env.scaleValue; u_maxStrength 50 × env.scaleValue; u_abMode; u_abAngle radians(p.abAngle); u_abFocus [p.abFocus.x+0.5, p.abFocus.y+0.5]; u_abChannel [p.abChannel.x*3, p.abChannel.y*3, p.abChannel.z*3]; u_abHueShift p.hueShift; u_wrapMode. (env.scaleValue обязателен в env!)

**lumaBands** (47405-47420): u_time env.time; u_blendMode; u_contrast; u_weight; u_weightAmp; u_weightFreq; u_mix; u_phase; u_phaseFreq.

- [ ] **Step 1: Тесты** (`colorGroup.test.js`) — по образцу fills.test.js: реестр содержит 4 новых ключа; uniforms(defaults, ENV) → проверка КАЖДОГО маппинга с конкретными числами (ENV = {width:1200, height:960, time:0.25, frameRate:60, totalFrames:600, scaleValue:2.5, media:{}}; например rgbShift: u_texelSize [1/1200, 1/960], u_maxStrength 125, u_abFocus сдвиг +0.5; gradientMap: u_ditherStrength 10/255); zero-alloc identity; controls: каждый path резолвится в defaults; сверка defaults против reference (обновить общий node-скрипт: перечислить все ключи src MODULES).
- [ ] **Step 2:** FAIL → реализация 4 модулей (паттерн fillGradient: module-level scratch, uniforms()) + index.js + optionTables (добавить недостающие ИЗ reference/filtr/modules.js: RGB_SHIFT_MODES, EMBOSS_* пока не нужны — только то, что требуют panels этих 4 модулей; сверить по их panels) → PASS.
- [ ] **Step 3:** Полный test/lint + node-сверка defaults (8 модулей OK).
- [ ] **Step 4: Commit** — `feat: color group modules (gradientMap, colorCorrection, rgbShift, lumaBands)`

---

### Task 4: Displace-группа — sine, cubic, simplex, texture

**Files:**
- Create: `src/js/modules/{displaceSine,displaceCubic,displaceSimplex,displaceTexture}.js`
- Modify: `src/js/modules/index.js`, `optionTables.js` (SINE_MODES, FREQ_MODES, SIMPLEX_NOISE_MODES, DISPLACE_TEXTURE_SOURCE_MODES из reference)
- Test: `src/js/modules/displaceGroup.test.js`

Маппинги дословно из бандла:

**displaceSine** (47215-47233): amp = map(p.amp, 0,100, 0,0.25); freq = p.freqMode===0 ? p.freqLow : p.freqHigh; u_time env.time; u_mode p.sineMode; u_amp [amp,amp]; u_compress p.compress; u_aspect p.aspect; u_freq [freq,freq]; u_speed [p.cycle,p.cycle]; u_phase [p.phase,p.phase]; u_angle radians(p.angle); u_center [p.center.x, p.center.y]; u_wrapMode; u_srcRes.

**displaceCubic** (47198-47214): u_tileXY [p.tile.x,p.tile.y]; u_ampXY [p.amp.x,p.amp.y]; u_aspect; u_angle radians(p.angle); u_time; u_speedXY [p.cycle.x,p.cycle.y]; u_phase; u_wrapMode; u_srcRes.

**displaceSimplex** (47234-47253): amp = map(p.amp,0,100,0,1); freq по freqMode; speed = map(p.speed,0,100,0,0.01) × env.totalFrames; u_time; u_mode p.noiseMode; u_aspect; u_angleDomain radians(p.angleDomain); u_angleVector radians(p.angleVector); u_amp/[..]; u_freq; u_speed [speed,speed]; u_seed p.seed; u_octaves p.octaves; u_wrapMode; u_srcRes.

**displaceTexture** (47254-47269): модуль с `run()`-хуком (нужны 2 медиа-текстуры): texture-слот p.texture (карта смещения; not-ready → пасс прозрачен), source-слот p.source (что сэмплим; null/'' → использовать ту же texture — семантика `B(p,"source") ?? L` бандла; select в панели «Previous Pass|Media File» управляет тем, задан ли source-слот — сверься с reference panels и шейдером src/shaders/displaceTexture.frag). Uniform'ы: u_disp/u_dispRes (texture), u_img/u_imgRes (source), u_dispMode 1; u_weight [p.weight.x,p.weight.y]; u_mode p.mode; u_scale p.scale/100; u_angle radians(0); u_offset [p.position.x/100,p.position.y/100]; u_wrapMode; u_srcScale p.scaleSrc/100; u_srcAngle radians(p.rotateSrc); u_srcOffset [p.positionSrc.x/100,p.positionSrc.y/100]; u_srcWrapMode p.wrapModeSrc; u_srcRes [w,h]. `run()` использует ctx.nextTarget/shaders/maskTex по образцу runPass (вернуть fbo.color).

- [ ] Шаги TDD как в Task 3 (тесты с конкретными числами: sine amp 50→0.125; simplex speed 50→0.005×600=3; texture scale/offset деления на 100), реализация, node-сверка defaults (12 OK), commit `feat: displace group modules`.

---

### Task 5: Blur-группа — gaussian, motion, noise

**Files:**
- Create: `src/js/modules/{blurGaussian,blurMotion,blurNoise}.js`
- Modify: `src/js/modules/index.js`
- Test: `src/js/modules/blurGroup.test.js`

**blurGaussian** (47150-47166) — `run()`-хук: sigma = map(EASE.quadIn(p.radius/100), 0,1, 0, 0.1×QUALITY_SCALE[p.quality]); вызывает `ctx.blur.gaussian(inputTex, target, { sigma, aspect: p.aspect, minScale: 1, inputIsPremult: true, mask: maskTex, mix: p.mix ?? 1, blendMode: p.blendMode ?? 0 })`, target = ctx.nextTarget(); return target.color.

**blurMotion** (47167-47181) — `run()`: sigma = map(EASE.sineIn(p.radius/100), 0,1, 0, 0.2); `ctx.blur.motion(inputTex, target, { sigma, angleDeg: p.angle, inputIsPremult: true, mask: maskTex, mix, blendMode })`.

**blurNoise** (47182-47197) — обычный uniforms() + guard в run? Нет: нужна текстура blueNoise (env.textures.blueNoise; не загружена → пасс прозрачен) ⇒ `run()`-хук с дефолтной схемой пасса. Uniform'ы: u_noise env.textures.blueNoise; u_mix; u_blendMode; u_resolution [w,h]; u_radius p.radius × env.scaleValue; u_noiseIndependence 0.15; u_noiseScale map(EASE.quadIn(p.scale), 0,1, 0.01,5); u_samples p.samples.

- [ ] Шаги TDD (числовые проверки формул сигм: radius 50, quality 2 → sigma = 0.25²=0.0625→map→0.0625×0.3=0.01875; motion radius 100 → sineIn(1)=1→0.2), реализация, defaults-сверка (15 OK), commit `feat: blur group modules on blur engine`.

---

### Task 6: Прочее — embossEffect, lensGrid, warpGrid

**Files:**
- Create: `src/js/modules/{embossEffect,lensGrid,warpGrid}.js`
- Modify: `src/js/modules/index.js`, `optionTables.js` (EMBOSS_*, WARP_GRID_* таблицы из reference)
- Test: `src/js/modules/fxGroup.test.js`

**embossEffect** (47421-47446) — `run()`: preBlurPx = p.heightSize × p.softness × env.scaleValue; minDim = max(1,(w+h)/2); если preBlurPx>0 → героям blur.gaussian(input, ctx.nextTarget(), {sigma: preBlurPx/minDim, minDimOverride: minDim, minScale:1, inputIsPremult:true, mask: maskTex}) → heightTex=его color, иначе input. Основной пасс шейдером embossEffect: u_src input; u_heightTex; u_heightUseTex true; u_srcRes; u_mix; u_glossContourMode p.contourMode; u_heightSource p.heightSource; u_depth p.depthSize×0.1; u_sizePx p.heightSize×env.scaleValue; u_heightDeg p.lightAlt; u_angleDeg p.lightAngle; u_blendMode; u_colorMode p.colorMode; u_highlightColor hexToRgb(p.highColor, scratch3); u_highlightBlendMode p.highMode; u_highlightOpacity p.highOpacity; u_shadowColor hexToRgb(p.shadColor, scratch3b); u_shadowBlendMode p.shadMode; u_shadowOpacity p.shadOpacity. (`hexToRgb(hex, outFloat32x3)` — vec3-вариант hexToRgba: добавить в uniformUtils с тестом `Array.from(hexToRgb('#FF0000', new Float32Array(3))) → [1,0,0]`; транскрипция C/f бандла 47526-47538; каждый модуль держит свои scratch-массивы.)

**lensGrid** (47447-47475) — `run()`: preBlurPx = p.blur × p.strength × env.scaleValue (та же пре-блюр схема, blurUse=true если был); u_src input (НЕ блюренный!); u_aspect w/h; u_blurUse; u_blur blurredTex|input; u_mix; u_strength; u_lensScale; u_squircle; u_edgeSoftness; u_gridCells [x,y]; u_gridScale; u_gridAngle radians; u_ior; u_curvature; u_aberration; lightAngle = p.lightDir.x × 2π → u_lightDir [sin(lightAngle), cos(lightAngle), p.lightDir.y]; u_specColor hexToRgb3; u_specAmount; u_specPower p.specPower×25; u_shadowColor hexToRgb3; u_shadowAmount; u_shadowPower p.shadowPower×5; u_wrapMode.

**warpGrid** (47476-47497) — обычный uniforms(): gridCells по gridMode (0→[p.gridCell,1]; 1→[p.gridCell,p.gridCell]; 2→[p.gridCells.x,p.gridCells.y]); falloffFocus (0→[p.falloffFocus1D+0.5, 0.5]; иначе [p.falloffFocus2D.x+0.5, p.falloffFocus2D.y+0.5]); u_strength EASE.sineIn(p.strength); u_aspect w/h; u_mix; u_gridScale; u_gridAngle radians; u_blendEdge p.cellFeather; u_falloffMode; u_falloffRange [min,max]; u_wrapMode. Controls: showIf-логика warpGrid из reference panels (falloffFocus1D при gridMode 0, falloffFocus2D иначе — см. reference/filtr/modules.js, там showIf с in-массивами: наш inspector поддерживает notEquals — добавить в inspector поддержку `showIf: { path, equals }` и `{ path, in: [...] }` ЕСЛИ reference так требует; сверься и реализуй минимально необходимое, с тестом в fxGroup.test.js на видимость).

- [ ] Шаги TDD (формулы: depth×0.1, specPower×25, shadowPower×5, lightDir тройка, warp falloffFocus+0.5), реализация, defaults-сверка (18 OK), commit `feat: emboss, lens grid and warp grid modules`.

---

### Task 7: maskMedia + группы в LayerList + инспектор маски

**Files:**
- Create: `src/js/modules/maskMedia.js`
- Modify: `src/js/modules/index.js`, `src/js/stack.js` (+maskMembers при создании mask-инстанса), `src/js/layersPanel.js` (группы + members-UI), `src/js/pipeline.js` (только если что-то не учтено Task 2)
- Test: `src/js/modules/maskGroup.test.js`, дополнение `src/js/stack.test.js`

- [ ] **Step 1: модуль maskMedia** (bundle 47498-47522): `type: 'mask'`, defaults из reference (`__maskMembers` у нас — поле инстанса `maskMembers`, НЕ params; из params reference-дефолтов его исключить, см. Step 2). `run({ ctx, inst, inputTex, env })`: media-слот p.image (нет → return inputTex, ничего не пушить); рисовать шейдером maskMedia в `ctx.getBuffer(inst.id)` через `.draw(() => {...})`: u_mask media.tex; u_maskRes media.res; u_compRes [w,h]; u_channel p.useChannel; u_maskRange [p.maskRange.min/100, p.maskRange.max/100]; u_wrapMode; u_scale p.scale/100; u_rotate radians(p.rotate); u_offset [p.position.x/100, p.position.y/100]; u_invert p.invert; u_contrast [p.contrast.min/100, p.contrast.max/100]; затем passes = число членов: `const n = inst.maskMembers.length; if (n > 0) pushMask(ctx, { id: inst.id, bufName: inst.id, left: n, tex: ctx.getBuffer(inst.id).color });` return inputTex. Controls: из reference panels (media select + interval'ы → пары слайдеров + select канала (MASK_CHANNELS в optionTables из reference) + invert check + scale/rotate/position(centerPoint ±50)/wrapMode).

- [ ] **Step 2: stack.js** — `createModuleInstance`: если `def.type === 'mask'` → инстанс получает `maskMembers: []`; `defaults` maskMedia в модуле НЕ содержит `__maskMembers` (это поле инстанса; сверку defaults с reference для maskMedia вести против reference-дефолтов БЕЗ `__maskMembers` — в node-скрипте сверки исключить этот ключ у maskMedia и задокументировать). Тест: инстанс maskMedia имеет maskMembers: [], duplicateModule копирует maskMembers независимо.

- [ ] **Step 3: layersPanel.js группы** — display-модель: члены маски = НЕПРЕРЫВНЫЙ блок инстансов, чьи id входят в maskMembers ближайшей маски выше (семантика getMaskBlockMemberIds, bundle 48168-48182: подсветка — только непрерывный блок сразу после маски). Простая реализация: идя по стеку, если предыдущая-маска.maskMembers включает текущий id и цепочка непрерывна от маски — indent:true. badge маски = maskMembers.length. **Members-UI (осознанное упрощение фазы 5, drag-в-группу — фаза 6):** в инспекторе для type==='mask' добавить секцию Members — чекбокс на каждый pass-инстанс стека НИЖЕ маски (label + id); toggle мутирует inst.maskMembers (add/remove, порядок по стеку) → onParamChange + refresh LayerList. Реализовать в inspector.js отдельной ветвью (после схемных контролов, только для mask-инстансов), код по образцу buildPaletteSection div/checkbox.

- [ ] **Step 4:** Тесты: display-модель групп (юнит на функцию buildLayerRows(state), вынести её из layersPanel как экспорт: маска с members [p03,p04] подряд → indent у обоих, badge 2; разрыв цепочки → indent только у непрерывного блока); maskMedia uniforms-числа (maskRange /100, contrast /100); стек-инстанс.

- [ ] **Step 5:** Полный test/lint/build; сверка defaults 19/19 (с оговоркой __maskMembers). Commit `feat: maskMedia module, mask groups in layer list and members editor`.

---

### Task 8: Пресеты (данные + конвертер) и dev-хук применения

**Files:**
- Create: `src/js/presets.js` (данные), `src/js/presetConvert.js` (+ test)
- Modify: `src/js/main.js` (dev-хук)

- [ ] **Step 1:** `src/js/presets.js` — копия массива PRESETS из `reference/filtr/presets.js` ДОСЛОВНО (шапка: `// LUMEN — встроенные пресеты (дословно из reference/filtr/presets.js, старый формат filtr-tool v2). Конвертация — presetConvert.js.`). Проверка: `node -e` сравнение JSON.stringify обоих массивов → identical.

- [ ] **Step 2: TDD конвертер** — `src/js/presetConvert.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { convertOldPreset } from './presetConvert.js';
import { PRESETS } from './presets.js';
import { MODULES } from './modules/index.js';
import { createDefaultState } from './state.js';

describe('convertOldPreset', () => {
  it('converts modules[] to stack instances with params over defaults', () => {
    const preset = PRESETS.find((p) => p.name === 'Gradient Plating');
    const res = convertOldPreset(preset);
    expect(res.stack.length).toBe(preset.modules.length);
    const first = res.stack[0];
    expect(first.module).toBe(preset.modules[0].name);
    expect(first.id).toBe(preset.modules[0].ref);
    expect(first.enabled).toBe(preset.modules[0].enabled);
    // параметры пресета поверх дефолтов: отсутствующие в пресете ключи — из defaults
    for (const key of Object.keys(MODULES[first.module].defaults)) {
      expect(first.params[key]).not.toBeUndefined();
    }
  });
  it('maps mask modules: type mask + maskMembers from __maskMembers', () => {
    const withMask = PRESETS.find((p) => p.modules.some((m) => m.name === 'maskMedia'));
    const res = convertOldPreset(withMask);
    const mask = res.stack.find((m) => m.module === 'maskMedia');
    expect(mask.type).toBe('mask');
    expect(Array.isArray(mask.maskMembers)).toBe(true);
    expect('__maskMembers' in mask.params).toBe(false);
  });
  it('carries cnv ratio/scale when present', () => {
    const preset = PRESETS.find((p) => p.main?.cnv?.ratio);
    const res = convertOldPreset(preset);
    expect(res.cnv.ratio).toBe(preset.main.cnv.ratio);
  });
  it('every preset converts without unknown modules', () => {
    for (const p of PRESETS) {
      const res = convertOldPreset(p);
      for (const inst of res.stack) {
        expect(MODULES[inst.module], `${p.name}: ${inst.module}`).toBeTruthy();
      }
    }
  });
  it('applyPresetToState replaces stack in place and resets selection', () => {
    const s = createDefaultState();
    s.ui.selectedId = 'zzz';
    const stackRef = s.stack;
    const preset = PRESETS.find((p) => p.name === 'Gradient Plating');
    applyPresetToState(s, preset);
    expect(s.stack).toBe(stackRef); // на месте, без реаллокации
    expect(s.stack.length).toBe(preset.modules.length);
    expect(s.ui.selectedId).toBeNull();
    if (preset.main?.cnv?.ratio) expect(s.cnv.ratio).toBe(preset.main.cnv.ratio);
  });
});
```
(Импорт в шапке теста: `import { convertOldPreset, applyPresetToState } from './presetConvert.js';`)

Реализация `src/js/presetConvert.js`:

```js
// LUMEN — конвертация пресетов старого формата (filtr-tool v2: {toolId, version,
// name, main:{cnv,rec}, modules:[{ref,name,enabled,params}]}) в state Lumen.
// Значения params пресета ложатся ПОВЕРХ дефолтов модуля (в пресетах не все ключи).
import { MODULES } from './modules/index.js';

export function convertOldPreset(preset) {
  const stack = preset.modules.map((m) => {
    const def = MODULES[m.name];
    if (!def) throw new Error(`Unknown module in preset: ${m.name}`);
    const params = structuredClone(def.defaults);
    const src = { ...m.params };
    const maskMembers = Array.isArray(src.__maskMembers) ? [...src.__maskMembers] : [];
    delete src.__maskMembers;
    deepAssign(params, src);
    const inst = {
      id: m.ref,
      type: def.type,
      module: m.name,
      enabled: m.enabled !== false,
      params,
    };
    if (def.type === 'mask') inst.maskMembers = maskMembers;
    return inst;
  });
  const cnv = {};
  if (preset.main?.cnv?.ratio) cnv.ratio = preset.main.cnv.ratio;
  if (preset.main?.cnv?.scale?.value != null) cnv.scaleValue = preset.main.cnv.scale.value;
  return { stack, cnv };
}

export function applyPresetToState(state, preset) {
  const { stack, cnv } = convertOldPreset(preset);
  state.stack.length = 0;
  state.stack.push(...stack);
  if (cnv.ratio) state.cnv.ratio = cnv.ratio;
  if (cnv.scaleValue != null) state.cnv.scale.value = cnv.scaleValue;
  state.ui.selectedId = null;
}

// Рекурсивное наложение значений пресета поверх дефолтов (массивы — заменой).
function deepAssign(target, src) {
  for (const key of Object.keys(src)) {
    const s = src[key];
    if (
      s && typeof s === 'object' && !Array.isArray(s) &&
      target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])
    ) {
      deepAssign(target[key], s);
    } else {
      target[key] = structuredClone(s);
    }
  }
}
```

- [ ] **Step 3: dev-хук** — в main.js: `import { PRESETS } from './presets.js'; import { applyPresetToState } from './presetConvert.js';` и после создания state:

```js
// dev-хук сверки с эталоном (UI пресетов — фаза 6)
window.__lumenApplyPreset = (name) => {
  const preset = PRESETS.find((p) => p.name === name);
  if (!preset) return `not found; known: ${PRESETS.map((p) => p.name).join(', ')}`;
  applyPresetToState(state, preset);
  api?.rebuildBuffer();
  api?.scheduler.requestRender();
  saveState();
  buildUI(); // перестроить Layers-список
  refreshInspector();
  return `applied: ${name} (${state.stack.length} modules)`;
};
```
(buildUI очищает и перестраивает левую панель — проверь, что повторный вызов не дублирует слушатели: root.innerHTML='' в начале уже есть; PNG-кнопка вне root — при повторном вызове addEventListener дублируется! Оберни навешивание PNG-слушателя защитой: `btn.onclick = () => applyChange(...)` вместо addEventListener — правь при необходимости и отметь в отчёте.)

- [ ] **Step 4:** test/lint/build. Commit `feat: built-in preset data, converter and dev apply hook`.

---

### Task 9: Сквозной DoD (контроллер, браузер + эталон)

Проверяет контроллер:

- [ ] Каждый из 15 новых модулей добавляется из Layers и заметно влияет на рендер (стек: fillMedia(img0) + модуль); инспектор каждого рендерит все контролы без ошибок консоли.
- [ ] blurGaussian: radius 50 даёт мягкий блюр; blurMotion — направленный; blurNoise — зернистый (blueNoise загружен).
- [ ] embossEffect/lensGrid — рельеф/линза поверх fillMedia; warpGrid — сетка искажения.
- [ ] MASK: стек fillMedia → maskMedia(gradient-linear) → colorCorrection(saturation 0) c member=colorCorrection: обесцвечивание только там, где маска белая; без члена (maskMembers пуст) — colorCorrection действует на весь кадр; LayerList показывает бейдж 1 и отступ «↳» у члена.
- [ ] Пресеты: `__lumenApplyPreset('Gradient Plating')` и ещё 2 пресета без видео-медиа — рендер Lumen против эталона (reference/filtr/live, тот же пресет выбрать в Preset List) — композиция/характер/палитра совпадают (сиды/кадр могут отличаться); расхождения фиксируются с указанием модуля.
- [ ] Persistence: пресет-стек с maskMembers переживает reload.
- [ ] lint/test/build чистые; сверка defaults 19/19; чекбоксы плана.

## Definition of Done (фаза 5)
Все пункты Task 9 зелёные; 19 модулей в реестре; тестов ≥ 120; известные упрощения зафиксированы в плане (drag-в-группу — фаза 6; UI пресетов — фаза 6).
