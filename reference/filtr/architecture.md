# filtr-tool — архитектурные заметки (реверс из бандла)

Источник истины: `reference/filtr/bundle-pretty.js` (89587 строк, js-beautify
минифицированного Vite-бандла; строки сохранены, идентификаторы минифицированы, но
строковые литералы и структура — как в оригинале). Все ссылки ниже — на номера строк
этого файла, чтобы фазы 2-5 могли перепроверить. Старый инструмент = p5.js
(instance mode, WEBGL2) + Tweakpane + фрагментные шейдеры.

Что уже задокументировано в соседних файлах (здесь не дублируется, только ссылки):
- `reference/filtr/shaders/README.md` — вершинный шейдер, карта модуль→шейдеры, инлайн-шейдеры;
- `reference/filtr/modules.js` — реестр 19 модулей (`Za`, bundle 39359-41282) с дефолтами/панелями и 15 option-таблиц;
- `reference/filtr/presets.js` — 28 встроенных пресетов (`h8`, bundle 42094-46719).

Ключевые фабрики движка (все — чистые функции-конструкторы с DI):
- `m9` = `createSketch` — рендер-ядро (draw/setup/renderFrame), bundle 47547-47656;
- `J8` = `createRenderContext` (объект `ctx`/`A`) — FBO-пул, ping-pong, mask-stack, bundle 46894-46941;
- `O9` = `createWorkspacePasses` (getPasses/rebuildPassesAndRender), bundle 50729-50764;
- `N9` — mask-члены (getMaskMembers/getMaskPassCount), bundle 48105-48249;
- `G4` — фабрика состояния (appState/uiState/runtimeState/runtime/stack), bundle 41597-41615.

---

## 1. Пайплайн пассов

**Стек → массив пассов.** `createWorkspacePasses.getPasses` (`O9.r`, 50739-50755, внутри
`O9` на 50729-50764) обходит `instanceOrder` и по каждому включённому
инстансу выдаёт плоский объект `{ id, type, module, params, enabled, passes }`. Поле
`passes` заполняется только для модулей `type === "mask"` — туда идёт
`getMaskPassCount(B)` (кол-во валидных членов маски, см. §3). `rebuildPassesAndRender`
(`O9.o`, 50757-50762) вызывает `replaceStack(getPasses())`, т.е. пересобирает `stack` и
триггерит перерисовку. Пересборка дёргается из `createCoreStateEffects.stack` (`b`,
41866-41873) при любой мутации стека.

**Как объявляется пасс.** Реализации всех эффектов лежат в объекте `MODULE_TYPES`
(`c`, 47149-47523) внутри `createModuleTypes`. Ключ = имя модуля, значение = функция
`(inputTex, params, ctx, extra) => outputTex`. Модуль обычно один пасс, но может быть и
без выхода (mask, см. ниже) — тогда возвращает исходный `h`.

**Цикл рендера (`renderFrame` = `m9.D`, 47601-47639).** Порядок:
1. `p(d)` (47645-47648) нормализует номер кадра и ставит `ctx.time = frame / totalFrames`.
2. `y.clear()`, затем `y.image(runtime.alphaImg, ...)` — рисует шахматный фон-«альфа»
   (созданный в `createAlphaImage`, `w9.I`, 47709-47724).
3. `maskStack.length = 0` — сброс стека масок на кадр.
4. `let v = runtime.fboBlank` — стартовый вход конвейера (пустой прозрачный FBO).
5. Цикл по `stack` (`a`):
   - `type === "mask"` (47607-47620): если включён, сбрасывает `maskStack`, вызывает
     модуль-маску (та кладёт member-текстуру в pool и пушит в `maskStack`, см. §3);
     `v` **не** меняется — маска не является звеном цепочки цвета.
   - `type === "pass"` (47621-47636): берёт активный mask-контекст `U = bF(ctx)`
     (верхняя запись с `left > 0`, 46951-46957), вызывает модуль `N = w(v, params, ctx, U)`;
     если вернулся тензор — `v = N`; затем `vF(ctx, !!U)` списывает один «заряд» маски.
     Выключенный пасс (47622-47626) всё равно вызывает `bF`/`vF` — чтобы счётчик масок
     не сбился.
6. `y.image(v, ...)` — финальный выход рисуется на главный canvas.

**Где blend/mix.** Смешивание — внутри самого пасса, через uniform'ы. Пример
`blurNoise` (47182-47196): `u_mix` = `p.mix ?? 1`, `u_blendMode` = `p.blendMode ?? 0`.
`fillNoise` (47286) передаёт `u_blendMode`, `u_mix`. Blur-модули (`blurGaussian`/`blurMotion`,
47150-47180) прокидывают `mix`/`blendMode` в класс блюра `iIA`. То есть композитинг
«поверх предыдущего кадра конвейера» делает шейдер; хост только выбирает целевой FBO и
подставляет входную текстуру.

**Ping-pong.** Два FBO `fboA`/`fboB` (создаются в `setup` = `m9.C`, 47576-47588, формат
`HALF_FLOAT`, без depth). `ctx.nextTarget()` (46916-46918) делает
`runtime.pingFBO ^= 1` и возвращает `pingFBO ? fboA : fboB`. Каждый пасс берёт входом
предыдущий `v` (color-attachment прошлого таргета) и пишет в `nextTarget()` — классический
пинг-понг. Плюс `fboBlank` (стартовый пустой) и пул именованных FBO `ctx.pool` под маски.

## 2. Разделение состояния

Фабрика `G4` (41597-41615) собирает единый объект `{ appState, uiState, runtimeState,
runtime, stack }`:

- **`appState`** (`U4`, 41438-41469) — сериализуемое пользовательское состояние. Два раздела:
  - **`cnv`** (41440-41449): `ratio` (ключ из таблицы `Sc`), `animation` (bool, вкл/выкл
    анимации), `scale` (`{value, min, max, step}`, дефолт 2.5).
  - **`rec`** (41450-41467): параметры экспорта/таймлайна — `preset` ("mp4-web"),
    `frameRate` (60), `frameCount` (0), `length` (`{value:10, min:1, max:60}` — длина
    анимации в секундах), `quality` (0.95), `bitrate` (50 Мбит), `h264` (20 — QP),
    `zip` (`{use, frames:300}`).
- **`uiState`** (`k4`, 41584-41587) — глубокая копия `appState` через `Js` (41483-41492),
  где `Js` вырезает поля-медиа (объекты с `.elt`/`.canvas`/`._renderer`). Это «чистое»
  зеркало appState для Tweakpane, без ссылок на живые p5-объекты.
- **`runtimeState`** (`N4`, 41471-41481) — эфемерное: `rec` (`{status:"Ready", detail,
  frame}` — текущий кадр и статус записи), `isReady`, `forceFrameOnce` (dirty-flag, см. §8).
- **`runtime`** (41605-41612) — не-сериализуемые GPU/p5-хендлы: `alphaImg`, `regularFont`,
  `fboBlank`, `fboA`, `fboB`, `pingFBO`.
- **`stack`** (41613) — плоский массив пассов (результат `getPasses`, см. §1).

Разбор в `createSketch` (`m9`, 47554-47566): `const { appState:n, runtimeState:r,
runtime:o, stack:a } = i`, затем `const { cnv:B, rec:l } = n` и `const { rec:Q } = r`.
То есть `l` (`appState.rec`) — настройки записи, `Q` (`runtimeState.rec`) — живой курсор
кадра/статус. Мердж-хелперы для пресетов/скоупов: `HS` (41494-41502), `Ml` (41511-41527),
`wF`/`S4` (41563-41595). Скоуп-таблица `b9` (48031+) и группы `41669-41671`
(`timeline`, `export`) описывают, какие пути `appState` к какому scope относятся.

## 3. MASK-механика

**`__maskMembers`.** У mask-модуля (`maskMedia`, дефолты 41180-41204) в `params` есть
массив `__maskMembers: []` — id инстансов-«членов», к которым применяется маска.
Модуль `N9` (`createMaskMembers`, 48105-48249) — вся логика:
- `getMaskMembers` (`r`, 48113-48124) — фильтрует `__maskMembers`: только существующие
  инстансы и **не сами маски** (`n(p)` отсекает вложенные маски).
- `getMaskPassCount` (`a`, 48138-48140) = `r(E).length` — именно это число едет в `passes`
  пасса-маски (§1).
- `getMaskBlockMemberIds` (`Q`, 48168-48182) — непрерывный блок членов сразу после маски
  в `instanceOrder`.
- `computeMaskDecorations` (`c`, 48211-48238) — карты `affect`/`last`/`start` для UI-подсветки.

**Применение в рендере.** Пасс-маска в `MODULE_TYPES.maskMedia` (47498-47522): рендерит
member-текстуру маски в именованный FBO `ctx.getBuffer(id)` шейдером `maskMedia` (канал/
инверсия/контраст/wrap), затем при `passes > 0` вызывает `T8(ctx, {id, bufName, left})`
(46959-46973) — пушит в `maskStack` запись `{tex, left: passes, used:false}`. Дальше в
цикле §1 каждый следующий цветовой пасс через `bF` получает верхнюю активную маску как
`extra` (её `.tex` идёт в шейдерный `u_mask`/`u_maskUse`), а `vF` (46975-46986) после
пасса делает `left -= 1` и, когда `left <= 0`, очищает FBO и снимает маску со стека. Итог:
маска действует ровно на N последующих пассов = число её членов.

**Валидация.** `P9` = валидатор пресета (`validatePreset`, 49779-49859). Предупреждение
`member-is-mask` (49851): член указывает на mask-модуль — игнорируется. Также
`unknown-member-ref` (49847), `bad-member-ref` (49829), `bad-members` (49825). При
импорте (`49757-49763`) `members` конвертируются в `__maskMembers` c тем же отсевом масок.

**UI-классы.** Проставляются в 49431-49436: `is-mask` (сам инстанс — маска),
`is-mask-group-start` (начало группы члена, из карты `start`), `is-mask-affected`
(член затронут маской, из `affect`), `is-mask-affected-active` (из `d`),
`is-mask-affected-last` (последний член блока, из `last`). Данные берутся из
`computeMaskDecorations` (§выше).

## 4. Загрузчик ассетов

**Манифесты.**
- Шейдеры `Y8` (46783-46799, README shaders §): массив из 19 триплетов
  `[name, vertURL, fragURL]`. `vertURL` = `Wt` — один общий инлайн-вершинник
  (`data:...base64`, 46760). `fragURL` — либо `/filtr-tool/assets/<name>-<hash>.frag`,
  либо инлайн `data:application/octet-stream;base64` (4 инлайновых, см. shaders README §5).
- Текстуры `M8` (46801-46803): единственная — `blueNoise`
  (`blue-noise-256x256-*.png`), нужна модулю `blurNoise` (47183).
- Медиа `Ih` (41331+) — 24 записи вида `{text, value, previewSrc, fullSrc}`. Источники —
  два словаря: `b4` (preview, 41283-41305) и `v4` (full, 41306-41328), резолверы
  `Pt = i => b4[i]` и `Kt = i => v4[i]` (41329-41330). У большинства `img*/text*/noise*`
  — по два хэша (preview vs full, разные файлы). Часть preview (white/gradient*/shape*)
  зашита как `data:image/webp;base64` прямо в `b4`.
- Watermark (extra): `Bo.watermarkUrl` (48087) — `watermark-DRuBhAP_.webp` (см. §7).

**Единый манифест `_8`** (`createAssetManifest`, 46815-46837): собирает плоскую Map
ключей: `shader.<name>.vert`/`.frag`, `texture.<key>`, `media.<value>.preview`/`.full`/`.src`,
плюс extra (`watermark`). Даёт `getUrl/listKeys/getManifest`.

**Загрузчик `tIA`** (`createAssetLoader`, 88527+): `loadAll({onProgress})` грузит
шейдеры парами `await p5.loadShader(vertURL, fragURL)` (88571) и складывает в
`targets.shaders[name]` (= `ctx.shaders`, 46904). Текстуры/медиа — через `loadImage`
(48334, 48381). `mediaPreload:"preview"` (89173) — сперва грузятся preview-варианты.
Вызов сборки в 89159-89180: `_8({shaderAssets:Y8, textureAssets:M8, mediaArray:Ih,
extraUrls:{watermark:bU}})` → `tIA(...).loadAll(...)`. Реестр текстур/шейдеров живёт в
`ctx.shaders`/`ctx.textures` (объекты, 46904-46905); FBO-текстуры под маски — в
`ctx.pool` (46906, 46919-46935).

## 5. Blend-режимы

Таблица `cs` (39331-39358) — 26 режимов, индексы 0-25: Normal(0), Darken, Multiply,
Color Burn, Linear Burn, Darker Color, Lighten, Screen, Color Dodge, Linear Dodge (Add),
Lighter Color, Overlay, Soft Light, Hard Light, Vivid Light, Linear Light, Pin Light,
Hard Mix, Difference, Exclusion, Subtract, Divide, Hue, Saturation, Color, Luminosity(25).
Photoshop-совместимый набор. В `modules.js` эта таблица названа `BLEND_MODES`.

**Путь индекса в шейдер.** `params.blendMode` (число из `cs`, выбирается select-контролом
модуля) → в хост-функции пасса передаётся как uniform `u_blendMode`. Примеры:
`blurNoise` (47194: `W.setUniform("u_blendMode", $)`, где `$ = p.blendMode ?? 0`),
`fillNoise` (47286). В шейдерах индекс диспетчеризуется функцией `applyBlend(u_blendMode,
Cb, Cs)` — подтверждено в `reference/filtr/shaders/*.frag`: `u_blendMode` объявлен как
`uniform int` (напр. `blurComp.frag:11`, `blurNoise.frag:20`, `fillColor.frag:12`,
`embossEffect.frag:40`, `fillMedia.frag:16`) и используется в `applyBlend(...)`
(`blurComp.frag:207`, `blurNoise.frag:267`, `fillColor.frag:203/214`,
`embossEffect.frag:393`). То есть выбор режима целиком выполняется на GPU по int-индексу.

## 6. Рекордер

**Библиотеки в бандле.** Мультиплексоры webm/mp4 включены целиком: webm-muxer — таблица
тегов EBML (78771), mp4-muxer — ISO-BMFF боксы (`Pe(...)`, 77672+, `_createMuxer`
79562/79610, `finalize` 78088). Кодирование — WebCodecs `VideoEncoder`
(проверка `w1 = typeof window.VideoEncoder == "function"`, 80068; конфиг 85246-85346).
Обёртка над всем — класс `Gd`/`fU` (`CanvasRecorder`-подобный, 84841-85458) с внутренними
`runner`/`encoder`/`overlay`.

**Пресеты экспорта `IH`** (75622-75629): `mp4-web` (WebCodecs), `mp4-h264` (H.264),
`png-sequence`, `jpg-sequence`, `webp-sequence`, `png-frame` (single). Доступность
фильтруется по фичам браузера в `getAvailablePresets` (84911-84916).

**Параметры.** Из `appState.rec` (§2) в конфиг энкодера (`nIA`, 88902-88921):
- Bitrate: `webcodecs.bitrate = rec.bitrate * 1e6` (88915), `bitrateMode:"constant"`.
- Frame Quality / H.264: `h264.quantizationParameter = rec.h264` (88919), профиль High,
  level 5.2 (88911-88913).
- FPS: `getFrameRate: () => rec.frameRate` (88893).
- Animation Length: `rec.length.value` (сек) — «timeline» scope (41669). Общее число
  кадров = `Math.max(1, Math.round(length.value * frameRate))` (`totalFrames`,
  `m9.h`/47641-47643, дубль 47133-47135).
- (Примечание: option-подпись «Animation Range» на 40588 — это параметр `weightAmp`
  модуля embossEffect, к рекордеру отношения не имеет.)

**Цикл записи.** Драйвер `VlA` (P5-driver, 85460-85503): `renderOnce(cb)` подменяет
`p5.draw` на один прогон и зовёт `A.redraw()` (85480-85498); `setPaused` дергает
`noLoop()`/`loop()` (85499-85501). Источник кадров `E` (88887-88896):
`render: ({frameIndex}) => sketch.renderFrame(frameIndex)` — рекордер сам продвигает
`runtimeState.rec.frame` (`setCurrentFrame`, 88890) и по каждому кадру вызывает
`renderFrame`, читает пиксели с canvas и кормит энкодер. Инициализация экспорт-сервиса —
`nIA` (88867-88938), сборка в `F()` на 89182-89225 (`$ = nIA(...)`). Перед записью —
пауза видео-медиа и снапшот офсетов (`sIA`, 88931-88937; `mediaManager.snapshot`, §media).

## 7. Watermark

Все упоминания: 48087 (URL `watermarkUrl`), 85679/88960/89164/89189/89235 (проброс),
87270/87472 (тексты «Unlicensed version adds watermark on export»), 87496/87939
(`bU = Bo.watermarkUrl`, source "watermark").

**Связь с лицензией — подтверждена.** Watermark инициализируется в `rIA`
(`initLicenseService`, 88941-88962): создаётся `KlA(p5, {pngUrl:s, scale:0.1,
paddingRatio:0.035, ...})` — рисователь PNG-оверлея, возвращается вместе с
`license.client`. Привязка к экспортёру — только в `w()` (89228-89237):
```
R || !Y?.client || !Y?.watermark || JlA(L, { client: Y.client, watermark: Y.watermark })
```
т.е. водяной знак навешивается на экспортёр **только если** нет license-bypass (`R`) и
есть валидный `license.client` — иначе (лицензия активна / bypass) он не подключается.
Тексты 87270/87472 прямо гласят: «Unlicensed version adds watermark on export». Также
`useLicenseOverlay` (85002+) переключает оверлей по `service.valid`.

**Вывод для спеки — подтверждаю:** watermark — часть механики лицензирования (оверлей
для нелицензированной версии), а не самостоятельный ассет пайплайна. Его следует
переносить/удалять вместе с лицензионным слоем, а не как обычный ассет. В новой
архитектуре без лицензирования он не нужен.

## 8. Известные проблемы старого кода (входные данные для оптимизаций)

Каждый пункт подтверждён кодом со ссылкой.

1. **Нет полноценного dirty-flag; p5-draw крутится всегда.** Главная p5-instance
   не переводится в `noLoop()` в штатном режиме — `noLoop()` дёргается только
   экспорт-драйвером через `setPaused` (85499-85501). Штатный `draw` (`m9.f`,
   47591-47599) вызывается каждый RAF-тик и лишь рано выходит: рендер идёт, только если
   `forceFrameOnce` (dirty-flag, 47593-47596) или `appState.cnv.animation` (47597). То есть
   в статике RAF-цикл впустую крутится, а `forceFrameOnce` (41844, 41863, 41872, 41881) —
   лишь одноразовый триггер поверх постоянного цикла, а не остановка петли. **Для новой
   архитектуры:** заменить на явный dirty-flag + остановку RAF (перерисовка только по
   изменению состояния/при animation), как заложено в плане (pipeline.js с dirty-flag).

2. **Пересборка всего стека на любую мутацию.** `rebuildPassesAndRender` (50757-50762)
   вызывает `getPasses()` целиком и `replaceStack(...)` при каждом изменении
   (`createCoreStateEffects.stack`, 41866-41873) — полный обход `instanceOrder` и
   пересоздание массива пассов даже при смене одного параметра. Кандидат на
   инкрементальное обновление.

3. **Аллокации в горячем цикле (per-frame / per-pass).**
   - `renderFrame` каждый кадр рисует шахматный `alphaImg` (47603) — статичный фон
     перерисовывается всегда.
   - `createAlphaImage` (`w9.I`, 47709-47724) создаёт `createGraphics`, гоняет
     вложенный цикл `rect()` и делает `h.get()` + `h.remove()` — дорого; вызывается из
     `updateAlphaImage`/`updateCanvas` (47673-47684) на каждый resize.
   - Цветовые хелперы `f`/`D` (47533-47541) аллоцируют `new Float32Array(3|4)` на каждый
     вызов (в отличие от `C`, 47526, который переиспользует общий буфер `E`). Модули с
     цветовыми uniform'ами (lensGrid 47474, fillColor и т.п.) вызывают их каждый кадр.

4. **`ctx.getBuffer` может ресайзить FBO внутри рендера.** `getBuffer` (46919-46935)
   при несовпадении размера делает `resize()` прямо в горячем пути пасса-маски (47511) —
   потенциальный GPU-столл в кадре записи. Ресайзы стоит выносить в resize-хендлер.

5. **`vF`/`bF` линейно сканируют `maskStack` каждый пасс** (46951-46986). При коротком
   стеке некритично, но логика «выключенный пасс тоже списывает заряд маски» (47622-47626)
   легко ломается при рефакторинге — стоит вынести в явную модель «маска → диапазон пассов».

**Не удалось установить точно:** детальный внутренний цикл энкодера (`runner`) —
третьесторонняя библиотека (canvas-record-подобная, `Gd`/`fU` 84841+), идентификаторы
сильно минифицированы; задокументирован контракт (source/driver/encoder, §6), но не
пошаговый цикл кодирования кадров внутри runner. Для новой архитектуры это и не нужно —
рекордер переиспользуется как чёрный ящик через тот же контракт `renderFrame(frameIndex)`.
