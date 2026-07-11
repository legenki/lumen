#version 300 es
precision highp float;

in vec2 vTexCoord;
out vec4 fragColor;

uniform sampler2D u_src;
uniform vec2 u_srcRes; // (w, h)

// -------- params
uniform vec2 u_tileXY; // >=0, tile density per axis (px-space)
uniform float u_angle; // grid rotation (rad)
uniform vec2 u_speedXY; // speed per axis in "tile" units (px-space)
uniform float u_time; // time
uniform float u_phase; // universal phase (shared for X/Y)
uniform vec2 u_ampXY; // [0..1] per-axis mosaic depth: X and Y separately

// -------- wrap & mask
uniform int u_wrapMode; // 0=Clamp, 1=Repeat, 2=Mirror, 3=Transparent
uniform bool u_maskUse;
uniform sampler2D u_mask;

const int MAX_STEPS = 6;
const float EPS = 1e-4;

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
    // Clamp
    return clamp(uv, 0.0, 1.0);
  } else if (mode == 1) {
    // Repeat
    return fract(uv);
  } else if (mode == 2) {
    // Mirror
    return vec2(mirrorWrap1D(uv.x), mirrorWrap1D(uv.y));
  } else {
    // Transparent
    visible = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
    return clamp(uv, 0.0, 1.0);
  }
}

// ---------- Rec.709 luma ----------
float luma709(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

// ---------- Orientation-aware "px-space" ----------
vec2 toPxSpace(vec2 centerUV, vec2 res) {
  // input: UV relative to center [-0.5..0.5]
  float ar = res.x / max(res.y, 1e-6);
  vec2 s = res.y > res.x ? vec2(1.0, 1.0 / ar) : vec2(ar, 1.0);
  return centerUV * s;
}

vec2 fromPxSpace(vec2 px, vec2 res) {
  float ar = res.x / max(res.y, 1e-6);
  vec2 s = res.y > res.x ? vec2(1.0, 1.0 / ar) : vec2(ar, 1.0);
  return px / s; // returns coords relative to center
}

// ---------- Curves ----------
float sCurve01(float x) {
  return x * x * (3.0 - 2.0 * x);
} // smoothstep without clamp

float repeatedSCurve1(float x, int n) {
  for (int i = 0; i < MAX_STEPS; i++) {
    if (i >= n) break;
    x = sCurve01(x);
  }
  return x;
}

void main() {
  // 0) base UV and centering
  vec2 uv0 = vTexCoord;
  vec2 centerUV = uv0 - 0.5;

  // 1) into px-space
  vec2 centerPX = toPxSpace(centerUV, u_srcRes);

  // 2) rotation (px-space)
  float c = cos(u_angle),
    s = sin(u_angle);
  mat2 R = mat2(c, -s, s, c);
  mat2 Rneg = transpose(R); // inverse of R
  vec2 rotPX = R * centerPX;

  // 3) tiling in px-space (per axis)
  vec2 tiles = max(u_tileXY, vec2(EPS));
  vec2 uvTilesPX = rotPX * tiles;

  // offset/animation — in the same "tile" units of px-space
  vec2 offsetTiles = vec2(u_phase) + u_speedXY * u_time;
  uvTilesPX += offsetTiles;

  // 4) "mosaic" (per-axis depth)
  vec2 iuv = floor(uvTilesPX);
  vec2 frac = fract(uvTilesPX);

  // independent steps per axis (gamma=1.5 for a "soft start")
  vec2 steps = 6.0 * pow(clamp(u_ampXY, vec2(0.0), vec2(1.0)), vec2(1.5));
  int nX = int(floor(steps.x));
  int nY = int(floor(steps.y));
  float tX = fract(steps.x);
  float tY = fract(steps.y);

  // smoothing separately for X and Y
  float ax0 = repeatedSCurve1(frac.x, clamp(nX, 0, MAX_STEPS));
  float ax1 = repeatedSCurve1(frac.x, clamp(nX + 1, 0, MAX_STEPS));
  float ay0 = repeatedSCurve1(frac.y, clamp(nY, 0, MAX_STEPS));
  float ay1 = repeatedSCurve1(frac.y, clamp(nY + 1, 0, MAX_STEPS));

  vec2 fracSmoothed = vec2(mix(ax0, ax1, tX), mix(ay0, ay1, tY));
  vec2 mixedPX = iuv + fracSmoothed;

  // 5) reverse path: from tiles -> remove tiles -> remove rotation
  vec2 backPX = (mixedPX - offsetTiles) / tiles;
  vec2 centerPX_fin = Rneg * backPX;

  // 6) MASK: scale the displacement vector in px-space
  float mask = u_maskUse ? texture(u_mask, vTexCoord).a : 1.0;
  vec2 deltaPX = centerPX_fin - centerPX; // displacement in px-space
  vec2 centerPX_masked = centerPX + mask * deltaPX;

  // 7) back to UV
  vec2 centerUV_fin = fromPxSpace(centerPX_masked, u_srcRes);
  vec2 uvEffect = centerUV_fin + 0.5;

  // 8) wrap + sampling
  float visible;
  vec2 wrapped = wrapUV(uvEffect, u_wrapMode, visible);
  vec4 col = texture(u_src, wrapped);
  col.a *= visible;

  fragColor = col;
}
