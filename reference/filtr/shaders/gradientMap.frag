#version 300 es
precision highp float;

in vec2 vTexCoord;
out vec4 fragColor;

// ---------- Inputs ----------
uniform sampler2D u_src; // backdrop in PREMULT
uniform sampler2D u_mask;
uniform bool u_maskUse;

uniform int u_blendMode;
uniform float u_mix; // 0..1, overall effect strength
uniform float u_ditherStrength; // 0..1, dithering strength
uniform vec2 u_resolution;

uniform int u_alphaMode; // 0 = Ignore Source Alpha, 1 = Fade by Source Alpha

// ---------- Gradient stops ----------
const int MAX_GRADIENT_POINTS = 16;
uniform int u_gradStopCount; // >= 2
uniform float u_gradTime[MAX_GRADIENT_POINTS]; // 0..1, sorted
uniform vec4 u_gradColor[MAX_GRADIENT_POINTS]; // straight RGBA (0..1)

// ---------- Gradient map params ----------
uniform int u_mapMode; // 0=Luma, 1=R, 2=G, 3=B, 4=minRGB, 5=maxRGB, 6=Alpha
uniform bool u_mapReverse; // invert direction
uniform float u_mapGamma; // input gamma (1.0 = no change)
uniform vec2 u_mapRange; // input levels: [low, high], both in 0..1

const float EPS = 1e-5;

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
}
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

// ---------- Dither (fast hash, triangular) ----------
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

// ---------- Gradient map: source -> t ----------
float getMapT(vec3 c, float a) {
  float v;

  if (u_mapMode == 0) {
    // Luma
    v = lum(c);
  } else if (u_mapMode == 1) {
    v = c.r;
  } else if (u_mapMode == 2) {
    v = c.g;
  } else if (u_mapMode == 3) {
    v = c.b;
  } else if (u_mapMode == 4) {
    v = min(c.r, min(c.g, c.b));
  } else if (u_mapMode == 5) {
    v = max(c.r, max(c.g, c.b));
  } else {
    // 6 or anything else -> alpha
    v = a;
  }

  // Levels
  float low = u_mapRange.x;
  float high = u_mapRange.y;
  float inv = 1.0 / max(high - low, EPS);
  v = (v - low) * inv;
  v = clamp(v, 0.0, 1.0);

  // Gamma (1/gamma, like in Levels)
  if (abs(u_mapGamma - 1.0) > 0.0001) {
    v = pow(v, 1.0 / max(u_mapGamma, EPS));
  }

  if (u_mapReverse) {
    v = 1.0 - v;
  }

  return v;
}

// ---------- Main ----------
void main() {
  // --- Backdrop (premultiplied -> straight)
  vec4 Bpm = texture(u_src, vTexCoord);
  float Ab = Bpm.a;
  vec3 Cb = Ab > EPS ? Bpm.rgb / Ab : vec3(0.0);

  // --- Mask
  float mask = u_maskUse ? texture(u_mask, vTexCoord).a : 1.0;

  // --- 1) t from source (gradient map)
  float t = getMapT(Cb, Ab);

  // --- 2) Dither t
  float t_dithered = t;
  if (u_ditherStrength > 0.0) {
    vec2 screenCoord = vTexCoord * u_resolution;
    float slope = fwidth(t);
    const float LSB = 1.0 / 255.0;

    float targetAmp = LSB * u_ditherStrength;
    float amp = clamp(targetAmp - slope, 0.0, targetAmp);

    float d = triangularDitherFast(screenCoord) * amp;
    t_dithered = clamp(t + d, 0.0, 1.0);
  }

  // --- 3) Sample gradient
  vec4 grad = sampleGradient(t_dithered);

  // Effect strength
  float As = clamp(u_mix * mask * grad.a, 0.0, 1.0);
  if (As <= EPS) {
    fragColor = vec4(Bpm.rgb, Ab);
    return;
  }

  vec3 Cs = grad.rgb;

  // --- 4) Blend (straight colors)
  vec3 Bcs = applyBlend(u_blendMode, Cb, Cs);

  // --- 5) Composite in PREMULT
  vec3 PM_out;
  float Aout;

  if (u_alphaMode == 0) {
    // Mode 0: Ignore Source Alpha — treat as a separate layer with its own alpha (As)
    PM_out = Ab * (1.0 - As) * Cb + As * (1.0 - Ab) * Cs + Ab * As * Bcs;
    Aout = Ab + As - Ab * As;
  } else {
    // Mode 1: Fade by Source Alpha — recolor the existing layer (alpha = Ab)
    float k = As; // effect amount 0..1
    vec3 Cout = mix(Cb, Bcs, k); // base -> gradient/blend

    PM_out = Cout * Ab; // PREMULT
    Aout = Ab;
  }

  fragColor = vec4(PM_out, Aout);
}
