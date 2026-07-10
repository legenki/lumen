# filtr-tool shaders — extraction notes

Source of truth: `reference/filtr/bundle-pretty.js` (89587 строк, вывод js-beautify по
минифицированному Vite-бандлу `filtr-bundle.js`; идентификаторы минифицированы, но
строковые литералы и структура кода сохранены как в оригинале).

Эти 15 `.frag`-файлов в этой директории — дословные копии файлов из
`reference/filtr/live/filtr-tool/assets/*.frag`, с хэшем Vite (`-Dg4rXJaa` и т.п.)
убранным из имени. Байты не менялись (см. Step 2 плана — обе проверки на `void main`
и `#version 300 es` прошли на всех 15 файлах).

## 1. Vertex-шейдер

Отдельного `.vert`-файла в ассетах нет. Vertex-источник — **инлайн-строка**,
закодированная как `data:application/octet-stream;base64,...` URL прямо в бандле
(js-beautify это не разворачивает, т.к. это строковый литерал). Переменная `Wt`,
объявлена в `bundle-pretty.js:46760`:

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

Это НЕ дефолтный vertex-шейдер p5.js (p5's default uses `uModelViewMatrix` /
`uProjectionMatrix`; здесь простой fullscreen-quad triangle-strip маппинг
`[0,1] → [-1,1]` без матриц). Один и тот же `Wt` переиспользуется для всех 19
шейдерных пар — в манифесте (см. ниже) вторым элементом каждого триплета всегда
стоит `Wt`.

**Важно для новой WebGL2-реализации:** атрибуты называются `aPosition`/`aTexCoord`,
varying — `vTexCoord`. Все fragment-шейдеры ожидают `in vec2 vTexCoord;` и пишут в
`out vec4 fragColor;` (не `gl_FragColor`) — это GLSL ES 3.00, требует WebGL2-контекст,
не WebGL1.

## 2. GLSL ES 3.00 ⇒ WebGL2

Все 15 `.frag`-файлов и inline-shader'ы начинаются с `#version 300 es` (проверено
`grep -L` — пусто, т.е. 100% покрытие). Это означает:

- Новый пайплайн переноса **обязан** создавать WebGL2 контекст (p5 в режиме
  `WEBGL` с `setAttributes`/canvas WebGL2, либо raw `canvas.getContext('webgl2')`).
- Синтаксис `in`/`out`, `texture()` вместо `texture2D()`, отсутствие `gl_FragColor` —
  всё это несовместимо с WebGL1/GLSL ES 1.00 без переписывания шейдеров.

## 3. Манифест loadShader (ключ → vert/frag)

`grep -n "loadShader(" bundle-pretty.js` даёт единственное вхождение:

```
88571:                const S = await A.loadShader(U, N);
```

внутри `tIA(...)` (loader, начинается `bundle-pretty.js:88527`). Он итерируется по
массиву `Q` — триплетам `[key, vertURL, fragURL]`, — построенному функцией `$QA`
(`bundle-pretty.js:88464-88488`) из ключей вида `shader.<name>.vert` /
`shader.<name>.frag`, отдаваемых адаптером `assets` через `getManifest()`
(`bundle-pretty.js:88451-88453`, сам `getManifest` — `bundle-pretty.js:46835`).

Фактический источник этих ключей — массив `Y8`, объявленный на
`bundle-pretty.js:46780-46800`, и передаваемый как `shaderAssets: Y8` в
`bundle-pretty.js:89159-89166` (`_8({ shaderAssets: Y8, textureAssets: M8, ... })`),
которая, судя по всему, и генерирует `shader.<key>.vert` / `shader.<key>.frag` ключи
из этого списка. Загруженные шейдеры кладутся в `A.shaders[key]` (используется затем
как `d.shaders.<name>` во всех pass-функциях, например `d.shaders.fillMedia` —
`bundle-pretty.js:47368`).

Полный манифест (`bundle-pretty.js:46780-46799`), 19 пар `[key, vert, frag]` (все
`vert` = `Wt`, т.е. общий inline vertex-шейдер выше):

| key (module)       | vert | frag source                                                  | Наш файл |
|---------------------|------|---------------------------------------------------------------|----------|
| fillMedia           | Wt   | `assets/fillMedia-Dg4rXJaa.frag` (var `d8`)                    | `fillMedia.frag` |
| fillColor           | Wt   | `assets/fillColor-CHUbhfq3.frag` (var `p8`)                    | `fillColor.frag` |
| gradientMap         | Wt   | `assets/gradientMap-ySkbPprP.frag` (var `f8`)                  | `gradientMap.frag` |
| fillGradient        | Wt   | `assets/fillGradient-Dp8rbCk7.frag` (var `y8`)                 | `fillGradient.frag` |
| maskMedia           | Wt   | inline base64 (var `m8`, `bundle-pretty.js:46765`)             | — (нет своего .frag-ассета, см. §4) |
| blurComp            | Wt   | `assets/blurComp-ByMtstRX.frag` (var `w8`)                     | `blurComp.frag` |
| blurGaussian        | Wt   | inline base64 (var `D8`, `bundle-pretty.js:46767`)              | — (нет своего .frag-ассета, см. §4) |
| displaceSimplex     | Wt   | `assets/displaceSimplex-BpUUhkz0.frag` (var `F8`)              | `displaceSimplex.frag` |
| fillNoise           | Wt   | `assets/fillNoise-DjX6Fj2W.frag` (var `b8`)                    | `fillNoise.frag` |
| displaceCubic       | Wt   | `assets/displaceCubic-Dyi1MP3D.frag` (var `v8`)                | `displaceCubic.frag` |
| displaceSine        | Wt   | `assets/displaceSine-l4VGaZJI.frag` (var `U8`)                 | `displaceSine.frag` |
| displaceTexture     | Wt   | inline base64 (var `N8`, `bundle-pretty.js:46772`)              | — (нет своего .frag-ассета, см. §4) |
| lumaBands           | Wt   | `assets/lumaBands-CqFg_o5N.frag` (var `L8`)                    | `lumaBands.frag` |
| embossEffect        | Wt   | `assets/embossEffect-Cm20D6A6.frag` (var `S8`)                 | `embossEffect.frag` |
| colorCorrection     | Wt   | inline base64 (var `k8`, `bundle-pretty.js:46775`)              | — (нет своего .frag-ассета, см. §4) |
| rgbShift            | Wt   | `assets/rgbShift-D9ua9tbh.frag` (var `G8`)                     | `rgbShift.frag` |
| lensGrid            | Wt   | `assets/lensGrid-BlATGk1u.frag` (var `R8`)                     | `lensGrid.frag` |
| warpGrid            | Wt   | `assets/warpGrid-CQc9h_M_.frag` (var `x8`)                     | `warpGrid.frag` |
| blurNoise           | Wt   | `assets/blurNoise-CO-OBL7q.frag` (var `H8`)                    | `blurNoise.frag` |

Примечание: имя ассет-файла `blurNoise-CO-OBL7q.frag` содержит дефис внутри самого
хэша (`CO-OBL7q`), из-за чего наивное `${base%-*}` (снятие всего после последнего
`-`) даёт неверный результат `blurNoise-CO`. Копирование в Step 1 использует
белый список из 15 известных имён модулей и `sed`, а не наивное bash-разбиение по
последнему `-`, чтобы получить корректное `blurNoise.frag`.

Четыре записи манифеста (`maskMedia`, `blurGaussian`, `displaceTexture`,
`colorCorrection`) хранят фрагмент-шейдер как inline `data:` URL, а не как
отдельный файл в `assets/`, поэтому для них в этой директории нет `.frag`-файла —
их исходники приведены дословно в §5. Плюс есть `blurComp` — служебный
композитный шейдер (не соответствует ни одному из 19 модулей эффектов сам по
себе, используется как часть реализации blur-модулей, см. §4).

## 4. Модули без собственного `.frag`-ассета — фактическая карта модуль → шейдер(ы)

Реестр модулей (`MODULE_TYPES`) — объект `Za`, открывается `bundle-pretty.js:39359`
(`Za = {`; первая запись `fillMedia: {` — строка 39360). Последняя запись
`maskMedia: {` начинается на строке 41180 и закрывается на строке 41281; сам объект
реестра закрывается на строке 41282 (следом на строке 41283 идёт `b4 = {` — словарь
webp-ассетов). Полный список 19 модулей и номер строки их записи в реестре:

```
39363  fillMedia
39445  fillColor
39485  fillGradient
39600  fillNoise
39677  displaceSine
39810  displaceCubic
39909  displaceSimplex
40026  displaceTexture
40165  blurGaussian
40208  blurMotion
40251  blurNoise
40304  gradientMap
40387  colorCorrection
40434  rgbShift
40551  lumaBands
40634  embossEffect
40801  lensGrid
41013  warpGrid
41183  maskMedia
```

Реализация каждого модуля (pass-функция) находится в объекте `MODULE_TYPES.c`
внутри фабрики passes, начинающейся `bundle-pretty.js:47149` (`const c = {`).
Ниже — как каждый из 5 "особых" модулей реально реализован:

### blurGaussian (`bundle-pretty.js:47150-47166`)
Не рисует напрямую своим собственным фрагмент-шейдером в pass-функции — вызывает
`d.blur.gaussian(...)` (`bundle-pretty.js:47157`), метод класса `iIA`
(`bundle-pretty.js:88737-88846`). Класс `iIA` создаётся один раз при инициализации
рендерера: `A.blur = new iIA(L, O, A.shaders.blurComp, A.shaders.blurGaussian)`
(`bundle-pretty.js:89217`) — т.е. получает оба шейдера явно:
- `shCopy = A.shaders.blurComp` — используется в `iIA.copy()` (`88772-88779`) для
  финального compositing-прохода (mix/blendMode с исходным изображением через
  `blurComp.frag`, наш файл `blurComp.frag`).
- `shBlur = A.shaders.blurGaussian` — используется в `iIA._blurResampled()`
  (`88767-88771`) — это separable Gaussian blur (по одному направлению `u_dir` за
  проход), реализован inline-шейдером `blurGaussian` (var `D8`, §5.2).

`iIA.gaussian()` (`88783-88823`) делает два прохода `_blurResampled` (горизонталь +
вертикаль, с ресемплингом по вычисленному масштабу для производительности), затем
`copy()` с параметрами mix/blendMode модуля.

### blurMotion (`bundle-pretty.js:47167-47181`) — модуль БЕЗ записи в манифесте шейдеров
Единственный из 19 модулей, у которого нет пары `[key, vert, frag]` в `Y8`
(подтверждено: `Y8` содержит 19 ключей, но `blurMotion` среди них отсутствует, а
`blurComp` есть — т.е. количество совпадает, но состав другой). Вызывает
`d.blur.motion(...)` (`bundle-pretty.js:47173`), метод `iIA.motion()`
(`88824-88845`). Использует **те же два шейдера**, что и `blurGaussian`:
`this.shBlur` (=`A.shaders.blurGaussian`, inline `D8`) — один проход
`_blurResampled` с направлением `[cos θ, sin θ]` вместо раздельных X/Y-проходов
(т.е. однонаправленный "motion" blur вместо двунаправленного gaussian), и
`this.shCopy` (=`A.shaders.blurComp`) для финального compositing, если
`mix < 1` или `blendMode != 0`. Итог: **blurMotion не имеет своего шейдера — это
тот же `iIA`/blurGaussian.frag + blurComp.frag конвейер, но с другими uniform'ами
(один directional pass, угол из `p.angle`, sigma по кривой `Sine In` вместо
`Quad In`)**.

### maskMedia (`bundle-pretty.js:47498-47522`)
Имеет собственный шейдер `d.shaders.maskMedia` (`bundle-pretty.js:47513`) — но он
хранится как inline base64 (var `m8`, `bundle-pretty.js:46765`), а не как файл в
`assets/`. Рендерит маску в именованный персистентный буфер
`d.getBuffer(`${id}`)` (`47511`), с опциональным blur-затуханием через `T8(...)`
(`47517`) при `passes > 0`. Исходник шейдера — §5.1.

### colorCorrection (`bundle-pretty.js:47371-47387`)
Прямолинейный single-pass модуль, использует `d.shaders.colorCorrection`
(`47385`) — тоже inline base64 (var `k8`, `bundle-pretty.js:46775`), не файл.
Исходник — §5.4.

### displaceTexture (`bundle-pretty.js:47254-47270`)
Использует `d.shaders.displaceTexture` (`47268`) — inline base64 (var `N8`,
`bundle-pretty.js:46772`), не файл. В отличие от displaceSine/displaceCubic/
displaceSimplex (у которых карта смещения генерируется процедурно в самом
шейдере), displaceTexture берёт карту смещения из внешней текстуры/медиа
(`u_disp`, привязанной к `B(p, "texture")`) — отсюда и различие в реализации
и в том, что этот шейдер не имеет процедурного шума внутри. Исходник — §5.3.

### Дополнительно: embossEffect и lensGrid тоже дергают blur.gaussian
Хотя оба модуля имеют собственный `.frag`-файл (`embossEffect.frag`,
`lensGrid.frag`), их pass-функции ПЕРЕД применением своего шейдера вызывают
`d.blur.gaussian(...)` как препроцессинг-шаг:
- `embossEffect` (`bundle-pretty.js:47421-47445`): блюрит высоту/héightmap
  (`W`) через `d.blur.gaussian` (`47434`) перед подачей в `embossEffect.frag`
  как `u_heightTex`.
- `lensGrid` (`bundle-pretty.js:47447-47474`): блюрит источник (`O`) через
  `d.blur.gaussian` (`47461`) перед подачей в `lensGrid.frag` как `u_blur`.

Итого фактическая карта "модуль → шейдер(ы)":

| Модуль | Шейдер(ы) в рантайме |
|---|---|
| fillMedia | `fillMedia.frag` |
| fillColor | `fillColor.frag` |
| fillGradient | `fillGradient.frag` |
| fillNoise | `fillNoise.frag` |
| displaceSine | `displaceSine.frag` |
| displaceCubic | `displaceCubic.frag` |
| displaceSimplex | `displaceSimplex.frag` |
| displaceTexture | inline `displaceTexture` (§5.3) — нет отдельного файла |
| blurGaussian | inline `blurGaussian` (§5.2) для blur-прохода + `blurComp.frag` для compositing |
| blurMotion | те же inline `blurGaussian` (§5.2) + `blurComp.frag` — свой шейдер отсутствует, только другие uniform'ы/геометрия прохода |
| blurNoise | `blurNoise.frag` (плюс текстура `blueNoise`) |
| gradientMap | `gradientMap.frag` |
| colorCorrection | inline `colorCorrection` (§5.4) — нет отдельного файла |
| rgbShift | `rgbShift.frag` |
| lumaBands | `lumaBands.frag` |
| embossEffect | `embossEffect.frag` + препроцессинг `d.blur.gaussian` (inline `blurGaussian`, §5.2) |
| lensGrid | `lensGrid.frag` + препроцессинг `d.blur.gaussian` (inline `blurGaussian`, §5.2) |
| warpGrid | `warpGrid.frag` |
| maskMedia | inline `maskMedia` (§5.1) — нет отдельного файла |

Все 19 модулей покрыты в этой таблице.

## 5. Инлайн-шейдеры (дословно, декодированы из base64 в `bundle-pretty.js`)

### 5.1 maskMedia (var `m8`, объявлена `bundle-pretty.js:46765`)

```glsl
#version 300 es
precision highp float;

in vec2 vTexCoord;
out vec4 fragColor;

#define ALPHA_FLOOR 0.0

uniform sampler2D u_mask;
uniform vec2 u_maskRes;
uniform vec2 u_compRes;

uniform int u_channel; // 0=Luma, 1=Alpha, 2=R, 3=G, 4=B
uniform vec2 u_maskRange;
uniform bool u_invert;
uniform vec2 u_contrast;
uniform float u_scale;
uniform float u_rotate;
uniform vec2 u_offset;
uniform int u_wrapMode;

// ---------- UV Utilities ----------

float mirrorWrap1D(float x) {
  float t = floor(x);
  float f = x - t;
  float isOdd = mod(t, 2.0);
  return mix(f, 1.0 - f, isOdd);
}

vec2 wrapUV(vec2 uv, int mode, out float visible) {
  visible = 1.0;
  if (mode == 0) {
    // CLAMP
    return clamp(uv, 0.0, 1.0);
  } else if (mode == 1) {
    // REPEAT
    return fract(uv);
  } else if (mode == 2) {
    // MIRROR
    return vec2(mirrorWrap1D(uv.x), mirrorWrap1D(uv.y));
  } else {
    // 3: TRANSPARENT-CLAMP
    visible = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
    return clamp(uv, 0.0, 1.0);
  }
}

vec2 mapUV(vec2 uv, vec2 src, vec2 map, vec2 offset, float scale, float angle) {
  float srcAspect = src.x / src.y;
  float mapAspect = map.x / map.y;

  if (srcAspect > mapAspect) {
    float s = mapAspect / srcAspect;
    uv.y = 0.5 + (uv.y - 0.5) * s;
  } else {
    float s = srcAspect / mapAspect;
    uv.x = 0.5 + (uv.x - 0.5) * s;
  }

  vec2 p = uv - 0.5;
  p.x *= mapAspect;
  p += -offset;

  float sa = sin(angle);
  float ca = cos(angle);
  p = mat2(ca, -sa, sa, ca) * p;

  p /= max(scale, 1e-6);

  p.x /= mapAspect;
  return p + 0.5;
}

// ---------- Mask helpers ----------

float luma(vec3 rgb) {
  return dot(rgb, vec3(0.2126, 0.7152, 0.0722));
}

float pickMaskChannel(vec4 c, int s) {
  if (s == 0) return luma(c.rgb); // Luma
  if (s == 1) return c.a; // Alpha
  if (s == 2) return c.r; // R
  if (s == 3) return c.g; // G
  if (s == 4) return c.b; // B
  return luma(c.rgb);
}

void main() {
  vec2 uvMapped = mapUV(vTexCoord, u_compRes, u_maskRes, u_offset, u_scale, u_rotate);

  float visible;
  vec2 uvWrapped = wrapUV(uvMapped, u_wrapMode, visible);

  vec4 c = texture(u_mask, uvWrapped);

  float a = c.a > ALPHA_FLOOR ? c.a : 0.0;
  float src = pickMaskChannel(c, u_channel);

  float m;
  if (u_channel == 1) {
    // Alpha-only
    m = a;
    if (u_invert) m = 1.0 - m;
  } else {
    // Channels → invert → alpha gating
    m = src;
    if (u_invert) m = 1.0 - m;
    m *= a;
  }

  m *= visible; // TRANSPARENT mode
  m = smoothstep(u_contrast.x, u_contrast.y, m);
  m = clamp(m, 0.0, 1.0);

  vec2 r = clamp(u_maskRange, 0.0, 1.0);
  if (r.x > r.y) r = r.yx;
  m = mix(r.x, r.y, m);

  fragColor = vec4(m);
}
```

### 5.2 blurGaussian (var `D8`, объявлена `bundle-pretty.js:46767`)

Разделяемое (separable) Gaussian blur по одному направлению за проход
(`u_dir`); используется и модулем `blurGaussian` (два прохода: X, затем Y —
см. `iIA.gaussian`), и модулем `blurMotion` (один directional проход — см.
`iIA.motion`), и препроцессингом в `embossEffect`/`lensGrid`.

```glsl
#version 300 es
precision highp float;

in vec2 vTexCoord;
out vec4 fragColor;

uniform sampler2D u_tex;
uniform vec2 u_res;
uniform vec2 u_dir;
uniform float u_sigmaPx;
uniform int u_radiusPx;
uniform bool u_inputIsPremult;
uniform bool u_fastKernel;

uniform bool u_maskUse;
uniform sampler2D u_mask;

const int MAX_RADIUS = 256;

float gaussSafe(float x, float s) {
  s = max(s, 1e-4);
  return exp(-0.5 * (x * x) / (s * s));
}

// --- mask ---
float readMask(vec2 uv) {
  return clamp(texture(u_mask, uv).a, 0.0, 1.0);
}

void accumSample(vec2 uv, float w, inout vec3 accPremultRGB, inout float accA, bool premult) {
  vec4 c = texture(u_tex, uv);
  vec3 rgbPremult = premult ? c.rgb : c.rgb * c.a;
  accPremultRGB += w * rgbPremult;
  accA += w * c.a;
}

void main() {
  vec2 uv = vTexCoord;
  vec2 texel = 1.0 / u_res;
  int R = min(u_radiusPx, MAX_RADIUS);
  float eps = 1e-6;

  // Local σ: u_sigmaPx * mask(uv), if mask is used
  float sigma = u_maskUse ? max(1e-4, u_sigmaPx * readMask(uv)) : u_sigmaPx;

  vec3 accRGB = vec3(0.0);
  float accA = 0.0;
  float sumW = 0.0;

  float w0 = gaussSafe(0.0, sigma);
  accumSample(uv, w0, accRGB, accA, u_inputIsPremult);
  sumW += w0;

  if (!u_fastKernel) {
    for (int i = 1; i <= MAX_RADIUS; i++) {
      if (i > R) break;
      float w = gaussSafe(float(i), sigma);
      vec2 off = float(i) * (u_dir * texel);
      accumSample(uv + off, w, accRGB, accA, u_inputIsPremult);
      accumSample(uv - off, w, accRGB, accA, u_inputIsPremult);
      sumW += 2.0 * w;
    }
  } else {
    for (int i = 1; i <= MAX_RADIUS; i += 2) {
      if (i > R) break;
      float wi = gaussSafe(float(i), sigma);
      bool hasJ = i + 1 <= R;
      float wj = hasJ ? gaussSafe(float(i + 1), sigma) : 0.0;
      float W = wi + wj;
      float offPix = W > eps ? (float(i) * wi + float(i + 1) * wj) / W : float(i);
      vec2 off = offPix * (u_dir * texel);

      accumSample(uv + off, W, accRGB, accA, u_inputIsPremult);
      accumSample(uv - off, W, accRGB, accA, u_inputIsPremult);
      sumW += 2.0 * W;
    }
  }

  vec3 premultRGB = accRGB / max(sumW, eps);
  float A = accA / max(sumW, eps);

  fragColor = vec4(premultRGB, clamp(A, 0.0, 1.0));
}
```

### 5.3 displaceTexture (var `N8`, объявлена `bundle-pretty.js:46772`)

```glsl
#version 300 es
precision highp float;

in vec2 vTexCoord;
out vec4 fragColor;

// --- Displacement & Mask ---
uniform sampler2D u_disp;
uniform vec2 u_dispRes;
uniform int u_wrapMode; // 0=CLAMP, 1=REPEAT, 2=MIRROR, 3=CLAMP->transparent

uniform bool u_maskUse;
uniform sampler2D u_mask;

// --- Sources ---
uniform sampler2D u_src;
uniform vec2 u_srcRes;

uniform sampler2D u_img;
uniform vec2 u_imgRes;

uniform int u_mode; // 0 = Prev Source (u_src), 1 = Image (u_img)

// --- Source transform (source) ---
uniform vec2 u_srcOffset; // mapUV space
uniform float u_srcScale; // > 0
uniform float u_srcAngle; // radians
uniform int u_srcWrapMode; // 0/1/2/3

// --- Displacement transform (u_disp) ---
uniform vec2 u_offset; // mapUV space
uniform float u_scale; // > 0
uniform float u_angle; // radians

// --- Effect params ---
uniform vec2 u_weight; // UV offset along XY
uniform int u_dispMode; // 0 = Luma, 1 = RG

// ---------- Utils ----------
float luma(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

float mirrorWrap1D(float x) {
  float t = floor(x);
  float f = x - t;
  float isOdd = mod(t, 2.0);
  return mix(f, 1.0 - f, isOdd);
}

vec2 wrapUV(vec2 uv, int mode, out float visible) {
  visible = 1.0;
  if (mode == 0) {
    // CLAMP
    return clamp(uv, 0.0, 1.0);
  } else if (mode == 1) {
    // REPEAT
    return fract(uv);
  } else if (mode == 2) {
    // MIRROR
    return vec2(mirrorWrap1D(uv.x), mirrorWrap1D(uv.y));
  } else {
    // 3: TRANSPARENT-CLAMP
    visible = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
    return clamp(uv, 0.0, 1.0);
  }
}

vec2 mapUV(vec2 uv, vec2 src, vec2 map, vec2 offset, float scale, float angle) {
  float srcAspect = src.x / src.y;
  float mapAspect = map.x / map.y;

  if (srcAspect > mapAspect) {
    float s = mapAspect / srcAspect;
    uv.y = 0.5 + (uv.y - 0.5) * s;
  } else {
    float s = srcAspect / mapAspect;
    uv.x = 0.5 + (uv.x - 0.5) * s;
  }

  vec2 p = uv - 0.5;
  p.x *= mapAspect;
  p += -offset;

  float sa = sin(angle);
  float ca = cos(angle);
  p = mat2(ca, -sa, sa, ca) * p;

  p /= max(scale, 1e-6);

  p.x /= mapAspect;
  return p + 0.5;
}

// ---------- Main ----------
void main() {
  // Source (u_src)
  vec4 srcOrig = texture(u_src, vTexCoord);
  vec3 baseRgb = srcOrig.rgb;
  float aSrc = srcOrig.a;

  // Mask
  float mask = u_maskUse ? texture(u_mask, vTexCoord).a : 1.0;

  // Displace: bound to u_src
  vec2 dispUV = mapUV(vTexCoord, u_srcRes, u_dispRes, u_offset, u_scale, u_angle);
  float visibleDisp;
  vec2 dispUVWrapped = wrapUV(dispUV, u_wrapMode, visibleDisp);
  vec4 dcol = texture(u_disp, dispUVWrapped);

  // Displace vector
  vec2 d =
    u_dispMode == 1
      ? (dcol.rg * 2.0 - 1.0) * 0.5 // RG
      : vec2(luma(dcol.rgb) - 0.5); // Luma

  float dispVisK = u_wrapMode == 3 ? visibleDisp : 1.0;
  vec2 offset = d * u_weight * dcol.a * mask * dispVisK;

  // Source of the effect (color + alpha of the displaced source)
  bool useImg = u_mode == 1;
  vec2 srcBaseUV = useImg
    ? mapUV(dispUV, u_dispRes, u_imgRes, u_srcOffset, u_srcScale, u_srcAngle)
    : mapUV(vTexCoord, u_srcRes, u_srcRes, u_srcOffset, u_srcScale, u_srcAngle);

  float visSrcFinal;
  vec2 srcWrapped = wrapUV(srcBaseUV - offset, u_srcWrapMode, visSrcFinal);

  vec4 srcFx = useImg ? texture(u_img, srcWrapped) : texture(u_src, srcWrapped);

  // Taking transparency into account in the coefficient (rather than in RGB).
  float visImg = useImg && u_srcWrapMode == 3 ? visSrcFinal : 1.0;

  // Effect multiplier (color)
  // Mask is not applied in the final mix
  float kBase = dispVisK * dcol.a * visImg;
  if (useImg) kBase *= srcFx.a;

  // Alternative option: Mask is used in the final mix
  // float kBase = mask * dispVisK * dcol.a * visImg;
  // if (useImg) kBase *= srcFx.a;

  float k = clamp(kBase, 0.0, 1.0);

  // --- Alpha ---
  float aFx = srcFx.a * (u_srcWrapMode == 3 ? visSrcFinal : 1.0);
  float aOut = mix(aSrc, aFx, k);

  // Color
  vec3 outRgb = mix(baseRgb, srcFx.rgb, k);

  fragColor = vec4(outRgb, aOut);
}
```

### 5.4 colorCorrection (var `k8`, объявлена `bundle-pretty.js:46775`)

```glsl
#version 300 es
precision highp float;

in vec2 vTexCoord;
out vec4 fragColor;

uniform sampler2D u_src;

// Correction parameters
uniform float u_brightness; // ~[-1..1] added to brightness
uniform float u_contrast; // ~[-1..1] 0=no changes, 1≈2x contrast
uniform float u_saturation; // 0=gray, 1=orig, >1=over-sat

// Mask and blending
uniform bool u_maskUse;
uniform sampler2D u_mask;
uniform float u_mix; // 0..1

// Rec.709 luma
float luma709(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
  vec4 src = texture(u_src, vTexCoord);
  vec3 tex = src.rgb;
  float a = src.a;

  // Gate by source alpha — apply effect only where a visible pixel exists
  float aGate = step(1e-6, a);

  // Mask
  float mask = u_maskUse ? texture(u_mask, vTexCoord).a : 1.0;

  // -------- BRIGHTNESS / CONTRAST / SATURATION CORRECTION --------

  // 1) Brightness (additive shift)
  vec3 col = tex + vec3(u_brightness);

  // 2) Contrast around 0.5
  // u_contrast ~ [-1..1] → factor = 1 + u_contrast (0..2)
  float contrastFactor = 1.0 + u_contrast;
  col = (col - vec3(0.5)) * contrastFactor + vec3(0.5);

  // 3) Saturation: interpolate between gray and current color
  float lum = luma709(col);
  vec3 gray = vec3(lum);
  col = mix(gray, col, u_saturation);

  // Clamp to working range
  col = clamp(col, 0.0, 1.0);

  // -------- BLEND WITH MASK AND ALPHA --------

  float k = clamp(u_mix, 0.0, 1.0) * mask * aGate;

  vec3 finalRgb = mix(tex, col, k) * aGate;

  fragColor = vec4(finalRgb, a);
}
```

## 6. Файлы в этой директории

```
blurComp.frag
blurNoise.frag
displaceCubic.frag
displaceSimplex.frag
displaceSine.frag
embossEffect.frag
fillColor.frag
fillGradient.frag
fillMedia.frag
fillNoise.frag
gradientMap.frag
lensGrid.frag
lumaBands.frag
rgbShift.frag
warpGrid.frag
```

15 файлов, все проверены (`grep -L "void main"` и `grep -L "#version 300 es"` дают
пустой вывод — 100% покрытие обоими маркерами).
