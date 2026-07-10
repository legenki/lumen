#version 300 es
precision highp float;

in vec2 vTexCoord;
out vec4 fragColor;

#define TWO_PI 6.283185307179586

uniform sampler2D u_src;

// Mask and blending
uniform bool u_maskUse;
uniform sampler2D u_mask;
uniform float u_mix; // 0..1

// Blend mode
uniform int u_blendMode; // see applyBlend

// Iso-luminance params
uniform float u_weight; // band frequency
uniform float u_phase; // 0..1

// Animation
uniform float u_time; // global time-cycle 0..1
uniform float u_weightAmp; // amplitude of deviation from u_weight
uniform float u_weightFreq; // cycles per one pass of u_time
uniform float u_phaseFreq; // phase cycles per one pass of u_time

// Band shaping
uniform float u_contrast; // contrast for bands

// ---------- Rec.709 luma ----------
float luma709(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

// ---------- Blend Modes Utilities (Rec.601) ----------
float luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

float lum(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}
float sat(vec3 c) {
  float maxc = max(c.r, max(c.g, c.b));
  float minc = min(c.r, min(c.g, c.b));
  return maxc - minc;
}
vec3 clipColor(vec3 c) {
  float L = lum(c);
  float minc = min(c.r, min(c.g, c.b));
  float maxc = max(c.r, max(c.g, c.b));
  if (minc < 0.0) c = vec3(L) + (c - vec3(L)) * (L / (L - minc));
  if (maxc > 1.0) c = vec3(L) + (c - vec3(L)) * ((1.0 - L) / (maxc - L));
  return c;
}
vec3 setLum(vec3 c, float L) {
  return clipColor(c + (L - lum(c)));
}
vec3 setSat(vec3 c, float s) {
  float minc = min(c.r, min(c.g, c.b));
  float maxc = max(c.r, max(c.g, c.b));
  float d = max(maxc - minc, 1e-5);
  return (c - vec3(minc)) * (s / d);
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
  vec3 denom = max(1.0 - c, vec3(1e-5));
  return clamp(b / denom, 0.0, 1.0);
}
vec3 blend_colorBurn(vec3 b, vec3 c) {
  vec3 denom = max(c, vec3(1e-5));
  return clamp(1.0 - (1.0 - b) / denom, 0.0, 1.0);
}
vec3 blend_darken(vec3 b, vec3 c) {
  return min(b, c);
}
vec3 blend_lighten(vec3 b, vec3 c) {
  return max(b, c);
}
vec3 blend_darkerColor(vec3 b, vec3 c) {
  return luma(c) < luma(b)
    ? c
    : b;
}
vec3 blend_lighterColor(vec3 b, vec3 c) {
  return luma(c) > luma(b)
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
  vec3 lowMask = step(c, vec3(0.5));
  vec3 highMask = 1.0 - lowMask;
  vec3 c_low = 2.0 * c;
  vec3 c_high = 2.0 * c - 1.0;
  vec3 burn = 1.0 - (1.0 - b) / max(c_low, vec3(1e-5));
  vec3 dodge = b / max(1.0 - c_high, vec3(1e-5));
  burn = clamp(burn, 0.0, 1.0);
  dodge = clamp(dodge, 0.0, 1.0);
  return lowMask * burn + highMask * dodge;
}
vec3 blend_linearLight(vec3 b, vec3 c) {
  vec3 lowMask = step(c, vec3(0.5));
  vec3 burn = max(b + 2.0 * c - 1.0, 0.0);
  vec3 dodge = clamp(b + (2.0 * c - 1.0), 0.0, 1.0);
  return lowMask * burn + (1.0 - lowMask) * dodge;
}
vec3 blend_pinLight(vec3 b, vec3 c) {
  vec3 lowMask = step(c, vec3(0.5));
  vec3 darken = min(b, 2.0 * c);
  vec3 lighten = max(b, 2.0 * c - 1.0);
  return lowMask * darken + (1.0 - lowMask) * lighten;
}
vec3 blend_hardMix(vec3 b, vec3 c) {
  return step(0.5, blend_vividLight(b, c));
}
vec3 blend_divide(vec3 b, vec3 c) {
  return clamp(b / max(c, vec3(1e-5)), 0.0, 1.0);
}

vec3 applyBlend(int mode, vec3 baseRGB, vec3 colorRGB) {
  if (mode == 0) return blend_normal(baseRGB, colorRGB);
  if (mode == 1) return blend_darken(baseRGB, colorRGB);
  if (mode == 2) return blend_multiply(baseRGB, colorRGB);
  if (mode == 3) return blend_colorBurn(baseRGB, colorRGB);
  if (mode == 4) return blend_linearBurn(baseRGB, colorRGB);
  if (mode == 5) return blend_darkerColor(baseRGB, colorRGB);
  if (mode == 6) return blend_lighten(baseRGB, colorRGB);
  if (mode == 7) return blend_screen(baseRGB, colorRGB);
  if (mode == 8) return blend_colorDodge(baseRGB, colorRGB);
  if (mode == 9) return blend_add(baseRGB, colorRGB);
  if (mode == 10) return blend_lighterColor(baseRGB, colorRGB);
  if (mode == 11) return blend_overlay(baseRGB, colorRGB);
  if (mode == 12) return blend_softLight(baseRGB, colorRGB);
  if (mode == 13) return blend_hardLight(baseRGB, colorRGB);
  if (mode == 14) return blend_vividLight(baseRGB, colorRGB);
  if (mode == 15) return blend_linearLight(baseRGB, colorRGB);
  if (mode == 16) return blend_pinLight(baseRGB, colorRGB);
  if (mode == 17) return blend_hardMix(baseRGB, colorRGB);
  if (mode == 18) return blend_difference(baseRGB, colorRGB);
  if (mode == 19) return blend_exclusion(baseRGB, colorRGB);
  if (mode == 20) return blend_sub(baseRGB, colorRGB);
  if (mode == 21) return blend_divide(baseRGB, colorRGB);
  if (mode == 22) return blend_hue(baseRGB, colorRGB);
  if (mode == 23) return blend_saturation(baseRGB, colorRGB);
  if (mode == 24) return blend_color(baseRGB, colorRGB);
  if (mode == 25) return blend_luminosity(baseRGB, colorRGB);
  return colorRGB;
}

void main() {
  vec4 src = texture(u_src, vTexCoord);
  vec3 tex = src.rgb;
  float a = src.a;

  // Gate by source alpha — apply effect only where a visible pixel exists
  float eps = 1e-6;
  float aGate = step(eps, a);

  // Mask
  float mask = u_maskUse ? texture(u_mask, vTexCoord).a : 1.0;

  // Source luminance
  vec3 texGated = tex * aGate;
  float lum709 = luma709(texGated);
  float lumSafe = max(lum709, eps);

  // Iso-chroma direction
  vec3 chromaIso = texGated / lumSafe;

  // Smooth transition "black as white" → iso-chroma
  float tShadow = 0.05; // luminance threshold for soft transition
  float w = smoothstep(0.0, tShadow, lumSafe); // 0 → white direction, 1 → chromaIso
  vec3 dir = mix(vec3(1.0), chromaIso, w);

  // -------- PARAMETER ANIMATION --------
  float time01 = fract(u_time); // keep 0..1

  // u_weight with animation
  float weight = u_weight;
  if (u_weightAmp > 0.0 && u_weightFreq != 0.0) {
    float t = time01 * u_weightFreq; // t in cycles
    weight = u_weight + u_weightAmp * sin(TWO_PI * t);
  }

  // u_phase with cyclic animation
  float phase = u_phase;
  if (u_phaseFreq != 0.0) {
    phase = fract(u_phase + time01 * u_phaseFreq);
  }

  // -------- BANDS WITH GAMMA --------
  float osc = cos(TWO_PI * (weight * lum709 + phase)); // [-1..1]
  float bands01 = 0.5 - 0.5 * osc; // [0..1]
  bands01 = clamp(bands01, 0.0, 1.0);

  // u_contrast → use as contrast around 0.5
  // 1.0 — neutral, >1.0 — harder, <1.0 — softer
  float contrast = max(u_contrast, 0.0);

  // Contrast around 0.5: push values away from the middle
  float bands = (bands01 - 0.5) * contrast + 0.5;
  bands = clamp(bands, 0.0, 1.0);

  // Iso-chroma: fix luminance to bands and multiply by color direction
  vec3 colEff = dir * bands;
  colEff = clamp(colEff, 0.0, 1.0);

  // Effect strength factoring mask and source alpha gate
  float k = clamp(u_mix, 0.0, 1.0) * mask * aGate;

  // -------- APPLY BLEND MODE --------
  vec3 blended = applyBlend(u_blendMode, tex, colEff);
  vec3 finalRgb = mix(tex, blended, k) * aGate;

  fragColor = vec4(finalRgb, a);
}
