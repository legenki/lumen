#version 300 es
precision highp float;

in vec2 vTexCoord;
out vec4 fragColor;

uniform sampler2D u_src; // backdrop in PREMULT
uniform sampler2D u_mask;
uniform bool u_maskUse;

uniform int u_blendMode;
uniform float u_mix;
uniform float u_ditherStrength;
uniform vec2 u_resolution;

// ---------- Gradient params ----------
uniform int u_gradMode; // 0: linear, 1: radial, 2: conical(angular), 3: box(diamond), 4: triangle
uniform vec2 u_gradCenter; // UV [0..1]
uniform float u_gradAngle; // radians
uniform float u_aspect; // width/height
uniform vec2 u_gradScale; // anisotropic scale (parallel, perpendicular)
uniform bool u_gradReverse; // flip 0..1
uniform int u_wrapMode; // 0: CLAMP, 1: REPEAT, 2: MIRROR, 3: TRANSPARENCY
uniform int u_alphaMode; // 0 = Ignore Source Alpha, 1 = Fade by Source Alpha

const int MAX_GRADIENT_POINTS = 16;
uniform int u_gradStopCount; // >= 2
uniform float u_gradTime[MAX_GRADIENT_POINTS]; // 0..1, sorted
uniform vec4 u_gradColor[MAX_GRADIENT_POINTS]; // straight RGBA (0..1)

const float EPS = 1e-5;
const float PI = 3.14159265358979323846;
const float TWO_PI = 6.28318530717958647692;

// ---------- Blend helpers ----------
float lum(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}
float sat(vec3 c) {
  float mx = max(c.r, max(c.g, c.b));
  float mn = min(c.r, min(c.g, c.b));
  return mx - mn;
}
vec3 clipColor(vec3 c) {
  float L = lum(c);
  float mn = min(c.r, min(c.g, c.b));
  float mx = max(c.r, max(c.g, c.b));
  if (mn < 0.0) c = vec3(L) + (c - vec3(L)) * (L / max(L - mn, EPS));
  if (mx > 1.0) c = vec3(L) + (c - vec3(L)) * ((1.0 - L) / max(mx - L, EPS));
  return c;
}
vec3 setLum(vec3 c, float L) {
  return clipColor(c + (L - lum(c)));
}
vec3 setSat(vec3 c, float s) {
  float mn = min(c.r, min(c.g, c.b));
  float mx = max(c.r, max(c.g, c.b));
  float d = max(mx - mn, EPS);
  return (c - vec3(mn)) * (s / d);
}

// ---------- Blend modes (RGB only) ----------
vec3 blend_normal(vec3 b, vec3 c) {
  return c;
}
vec3 blend_multiply(vec3 b, vec3 c) {
  return b * c;
}
vec3 blend_screen(vec3 b, vec3 c) {
  return 1.0 - (1.0 - b) * (1.0 - c);
}
vec3 blend_overlay(vec3 b, vec3 c) {
  vec3 lo = 2.0 * b * c;
  vec3 hi = 1.0 - 2.0 * (1.0 - b) * (1.0 - c);
  return mix(lo, hi, step(0.5, b));
}
vec3 blend_add(vec3 b, vec3 c) {
  return clamp(b + c, 0.0, 1.0);
}
vec3 blend_sub(vec3 b, vec3 c) {
  return clamp(b - c, 0.0, 1.0);
}
vec3 blend_hardLight(vec3 b, vec3 c) {
  vec3 lo = 2.0 * b * c;
  vec3 hi = 1.0 - 2.0 * (1.0 - b) * (1.0 - c);
  return mix(lo, hi, step(0.5, c));
}
vec3 blend_softLight(vec3 b, vec3 c) {
  return mix(
    b - (1.0 - 2.0 * c) * b * (1.0 - b),
    b + (2.0 * c - 1.0) * (sqrt(max(b, 0.0)) - b),
    step(0.5, c)
  );
}
vec3 blend_colorDodge(vec3 b, vec3 c) {
  return clamp(b / max(1.0 - c, vec3(EPS)), 0.0, 1.0);
}
vec3 blend_colorBurn(vec3 b, vec3 c) {
  return clamp(1.0 - (1.0 - b) / max(c, vec3(EPS)), 0.0, 1.0);
}
vec3 blend_darken(vec3 b, vec3 c) {
  return min(b, c);
}
vec3 blend_lighten(vec3 b, vec3 c) {
  return max(b, c);
}
vec3 blend_darkerColor(vec3 b, vec3 c) {
  return lum(c) < lum(b)
    ? c
    : b;
}
vec3 blend_lighterColor(vec3 b, vec3 c) {
  return lum(c) > lum(b)
    ? c
    : b;
}
vec3 blend_difference(vec3 b, vec3 c) {
  return abs(b - c);
}
vec3 blend_exclusion(vec3 b, vec3 c) {
  return b + c - 2.0 * b * c;
}
vec3 blend_hue(vec3 b, vec3 c) {
  return setLum(setSat(c, sat(b)), lum(b));
}
vec3 blend_saturation(vec3 b, vec3 c) {
  return setLum(setSat(b, sat(c)), lum(b));
}
vec3 blend_color(vec3 b, vec3 c) {
  return setLum(c, lum(b));
}
vec3 blend_luminosity(vec3 b, vec3 c) {
  return setLum(b, lum(c));
}
vec3 blend_linearBurn(vec3 b, vec3 c) {
  return max(b + c - 1.0, 0.0);
}
vec3 blend_vividLight(vec3 b, vec3 c) {
  vec3 low = step(c, vec3(0.5));
  vec3 high = 1.0 - low;
  vec3 clow = 2.0 * c;
  vec3 chigh = 2.0 * c - 1.0;
  vec3 burn = 1.0 - (1.0 - b) / max(clow, vec3(EPS));
  vec3 dodge = b / max(1.0 - chigh, vec3(EPS));
  return clamp(low * burn + high * dodge, 0.0, 1.0);
}
vec3 blend_linearLight(vec3 b, vec3 c) {
  vec3 low = step(c, vec3(0.5));
  vec3 burn = max(b + 2.0 * c - 1.0, 0.0);
  vec3 dodge = clamp(b + (2.0 * c - 1.0), 0.0, 1.0);
  return low * burn + (1.0 - low) * dodge;
}
vec3 blend_pinLight(vec3 b, vec3 c) {
  vec3 low = step(c, vec3(0.5));
  vec3 darken = min(b, 2.0 * c);
  vec3 lighten = max(b, 2.0 * c - 1.0);
  return low * darken + (1.0 - low) * lighten;
}
vec3 blend_hardMix(vec3 b, vec3 c) {
  return step(0.5, blend_vividLight(b, c));
} // NB: uses C in vividLight
vec3 blend_divide(vec3 b, vec3 c) {
  return clamp(b / max(c, vec3(EPS)), 0.0, 1.0);
}

vec3 applyBlend(int m, vec3 B, vec3 C) {
  switch (m) {
    case 1:
      return blend_darken(B, C);
    case 2:
      return blend_multiply(B, C);
    case 3:
      return blend_colorBurn(B, C);
    case 4:
      return blend_linearBurn(B, C);
    case 5:
      return blend_darkerColor(B, C);
    case 6:
      return blend_lighten(B, C);
    case 7:
      return blend_screen(B, C);
    case 8:
      return blend_colorDodge(B, C);
    case 9:
      return blend_add(B, C);
    case 10:
      return blend_lighterColor(B, C);
    case 11:
      return blend_overlay(B, C);
    case 12:
      return blend_softLight(B, C);
    case 13:
      return blend_hardLight(B, C);
    case 14:
      return blend_vividLight(B, C);
    case 15:
      return blend_linearLight(B, C);
    case 16:
      return blend_pinLight(B, C);
    case 17:
      return blend_hardMix(B, C);
    case 18:
      return blend_difference(B, C);
    case 19:
      return blend_exclusion(B, C);
    case 20:
      return blend_sub(B, C);
    case 21:
      return blend_divide(B, C);
    case 22:
      return blend_hue(B, C);
    case 23:
      return blend_saturation(B, C);
    case 24:
      return blend_color(B, C);
    case 25:
      return blend_luminosity(B, C);
    default:
      return C; // normal
  }
}

// ---------- Gradient helpers ----------
vec4 sampleGradient(float t) {
  t = clamp(t, 0.0, 1.0);
  int n = u_gradStopCount;
  if (n <= 0) return vec4(0.0);
  if (t <= u_gradTime[0]) return u_gradColor[0];
  for (int i = 1; i < MAX_GRADIENT_POINTS; ++i) {
    if (i >= n) break;
    float t0 = u_gradTime[i - 1];
    float t1 = u_gradTime[i];
    if (t <= t1) {
      float inv = 1.0 / max(t1 - t0, EPS);
      float k = (t - t0) * inv;
      return mix(u_gradColor[i - 1], u_gradColor[i], k);
    }
  }
  return u_gradColor[n - 1];
}

// Mirror wrap for 1D
float mirrorWrap1D(float x) {
  float t = floor(x);
  float f = x - t;
  float isOdd = mod(t, 2.0);
  return mix(f, 1.0 - f, isOdd);
}

// Wrap t into [0..1] with clamp/repeat/mirror modes
float wrapT(float t, int mode) {
  if (mode == 0) {
    // CLAMP
    return clamp(t, 0.0, 1.0);
  } else if (mode == 1) {
    // REPEAT
    return fract(t);
  } else if (mode == 2) {
    // MIRROR
    return mirrorWrap1D(t);
  } else {
    // 3: TRANSPARENCY (1D gate)
    return clamp(t, 0.0, 1.0);
  }
}

// ---------- Dither (fast hash, triangular)
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float triangularDitherFast(vec2 coord) {
  float r1 = hash12(coord);
  float r2 = hash12(coord + vec2(1.618, 0.577));
  return (r1 + r2 - 1.0) * 0.5;
}

void main() {
  // --- Backdrop (premultiplied -> straight)
  vec4 Bpm = texture(u_src, vTexCoord);
  float Ab = Bpm.a;
  vec3 Cb = Ab > EPS ? Bpm.rgb / Ab : vec3(0.0);

  // --- Mask
  float mask = u_maskUse ? texture(u_mask, vTexCoord).a : 1.0;

  // --- Common local space: aspect -> rotate -> anisotropic scale
  vec2 S = vec2(max(u_aspect, EPS), 1.0);
  vec2 rel = (vTexCoord - 0.5 - u_gradCenter) * S;

  float ca = cos(u_gradAngle);
  float sa = sin(u_gradAngle);

  vec2 loc;
  loc.x = ca * rel.x - sa * rel.y;
  loc.y = sa * rel.x + ca * rel.y;

  vec2 invScale = 1.0 / max(u_gradScale, vec2(EPS));
  loc *= invScale;

  // Half extents of rotated reference rectangle (analytical)
  vec2 halfS = 0.5 * S;
  float ex = abs(halfS.x * ca) + abs(halfS.y * sa);
  float ey = abs(halfS.x * sa) + abs(halfS.y * ca);

  // --- t_raw + visibility gate (for TRANSPARENCY)
  float t_raw = 0.0;
  float visibleGate = 1.0;

  if (u_gradMode == 0) {
    // LINEAR
    float ex = abs(halfS.x * ca) + abs(halfS.y * sa);
    float ey = abs(halfS.x * sa) + abs(halfS.y * ca);
    float inv2ex = 1.0 / max(2.0 * ex, EPS);
    float inv2ey = 1.0 / max(2.0 * ey, EPS);
    vec2 uvL = vec2((loc.x + ex) * inv2ex, (loc.y + ey) * inv2ey);
    t_raw = uvL.x;
    if (u_wrapMode == 3) {
      visibleGate = step(0.0, uvL.x) * step(uvL.x, 1.0) * step(0.0, uvL.y) * step(uvL.y, 1.0);
    }
  } else if (u_gradMode == 1) {
    // RADIAL
    float invMax = 1.0 / max(length(halfS), EPS);
    float t_rad = length(loc) * invMax; // 0..1 at farthest corner
    t_raw = t_rad;
    if (u_wrapMode == 3) {
      visibleGate = step(0.0, t_rad) * step(t_rad, 1.0);
    }
  } else if (u_gradMode == 2) {
    // CONICAL (ANGULAR)
    float invMax = 1.0 / max(length(halfS), EPS);
    float t_rad = length(loc) * invMax;
    float ang = atan(loc.y, loc.x); // (-PI, PI]
    float ang01 = ang < 0.0 ? ang + TWO_PI : ang; // [0, TWO_PI)
    float t_ang = ang01 / TWO_PI; // [0,1)
    t_raw = t_ang;
    if (u_wrapMode == 3) {
      visibleGate = step(0.0, t_rad) * step(t_rad, 1.0);
    }
  } else if (u_gradMode == 3) {
    // BOX (SQUARE)
    float ex = abs(halfS.x * ca) + abs(halfS.y * sa);
    float ey = abs(halfS.x * sa) + abs(halfS.y * ca);
    float invEx = 1.0 / max(ex, EPS);
    float invEy = 1.0 / max(ey, EPS);
    float t_box = max(abs(loc.x) * invEx, abs(loc.y) * invEy);
    t_raw = t_box;
    if (u_wrapMode == 3) {
      visibleGate = step(0.0, t_box) * step(t_box, 1.0);
    }
  } else {
    // TRIANGLE (equilateral, centered)
    float invMaxExt = 1.0 / max(max(ex, ey), EPS);
    vec2 triP = loc * invMaxExt;
    triP.y = -triP.y;

    const float TRI_INR = 0.5; // distance from center to each edge in normalized space
    const float TRI_INV_INR = 2.0; // 1 / TRI_INR
    const vec2 TRI_N0 = vec2(0.0, 1.0);
    const vec2 TRI_N1 = vec2(-0.8660254, -0.5);
    const vec2 TRI_N2 = vec2(0.8660254, -0.5);

    float d0 = dot(TRI_N0, triP) + TRI_INR;
    float d1 = dot(TRI_N1, triP) + TRI_INR;
    float d2 = dot(TRI_N2, triP) + TRI_INR;
    float minD = min(d0, min(d1, d2));

    t_raw = 1.0 - minD * TRI_INV_INR; // 0 at center, 1 on edges, >1 outside
    if (u_wrapMode == 3) {
      visibleGate = step(0.0, minD);
    }
  }

  // --- Wrap (clamp/repeat/mirror/transparency)
  float t = wrapT(t_raw, u_wrapMode);
  if (u_gradReverse) {
    t = 1.0 - t;
  }

  // Final visibility (for TRANSPARENCY, taking gate; otherwise 1.0)
  float visible = u_wrapMode == 3 ? visibleGate : 1.0;

  // --- Adaptive dither on gradient param (hide banding, minimize noise in later passes)
  float t_dithered = t;
  if (u_ditherStrength > 0.0) {
    vec2 screenCoord = vTexCoord * u_resolution;
    float slope = fwidth(t); // how fast t changes per pixel
    const float LSB = 1.0 / 255.0; // 8-bit step in t-space
    float targetAmp = LSB * u_ditherStrength;
    float amp = clamp(targetAmp - slope, 0.0, targetAmp) * visible;
    float d = triangularDitherFast(screenCoord) * amp;
    t_dithered = wrapT(t + d, u_wrapMode == 3 ? 0 : u_wrapMode);
  }

  // --- Gradient (straight)
  vec4 grad = sampleGradient(t_dithered);
  float As = clamp(u_mix * mask * grad.a * visible, 0.0, 1.0);
  if (As <= EPS) {
    fragColor = vec4(Bpm.rgb, Ab);
    return;
  }
  vec3 Cs = grad.rgb;

  // --- Photoshop-style blend on straight colors
  vec3 Bcs = applyBlend(u_blendMode, Cb, Cs);

  vec3 PM_out;
  float Aout;

  if (u_alphaMode == 0) {
    // Mode 0: Ignore Source Alpha — classic layer PS-composit
    PM_out = Ab * (1.0 - As) * Cb + As * (1.0 - Ab) * Cs + Ab * As * Bcs;
    Aout = Ab + As - Ab * As;
  } else {
    // Mode 1: Fade by Source Alpha — coloring layer, alpha = Ab
    float k = As; // effect amount 0..1
    vec3 Cout = mix(Cb, Bcs, k); // color: base -> gradient/blend

    PM_out = Cout * Ab; // PREMULT
    Aout = Ab;
  }

  fragColor = vec4(PM_out, Aout);
}
