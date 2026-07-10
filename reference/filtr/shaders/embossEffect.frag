#version 300 es
precision highp float;

in vec2 vTexCoord;
out vec4 fragColor;

// --- Inputs (premultiplied) ---
uniform sampler2D u_src; // PREMULT input
uniform sampler2D u_heightTex; // optional blurred height input
uniform bool u_heightUseTex;
uniform vec2 u_srcRes; // (w, h)

// Light / geometry
uniform float u_angleDeg; // 0..360
uniform float u_heightDeg; // 0..89.9 (altitude)
uniform float u_sizePx; // blur radius/size in px
uniform int u_heightSource; // 0=luma,1=alpha,2=luma×alpha
uniform float u_depth; // 0..1 normal scale

// Gloss contour (one selector)
uniform int u_glossContourMode; // 0..11

// Mask
uniform bool u_maskUse;
uniform sampler2D u_mask; // mask in ALPHA

// Color
uniform int u_colorMode; // 0=gray, 1=color

uniform vec3 u_highlightColor; // unpremult
uniform vec3 u_shadowColor; // unpremult

uniform int u_highlightBlendMode; // only for color mode
uniform int u_shadowBlendMode; // only for color mode

uniform float u_highlightOpacity; // 0..1
uniform float u_shadowOpacity; // 0..1

// Blend
uniform int u_blendMode;
uniform float u_mix; // 0..1

// ----------------- helpers -----------------
float luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

vec4 readSrcUnpremult(vec2 uv) {
  vec4 c = texture(u_src, uv); // premult
  float a = c.a;
  vec3 rgb = a > 1e-6 ? c.rgb / a : vec3(0.5);
  return vec4(rgb, a);
}

vec4 readHeightTex(vec2 uv) {
  vec4 c = u_heightUseTex ? texture(u_heightTex, uv) : texture(u_src, uv);
  float a = c.a;
  vec3 rgb = a > 1e-6 ? c.rgb / a : vec3(0.5);
  return vec4(rgb, a);
}

float remapLevels(float x, vec2 levels) {
  float lo = levels.x;
  float hi = levels.y;
  float denom = max(hi - lo, 1e-4);
  return clamp((x - lo) / denom, 0.0, 1.0);
}

float maskAt(vec2 uv) {
  return u_maskUse
    ? texture(u_mask, uv).a
    : 1.0;
}

float heightAt(vec2 uv) {
  vec4 c = readHeightTex(uv);
  float hSrc = u_heightSource == 0 ? luma(c.rgb) : u_heightSource == 1 ? c.a : luma(c.rgb) * c.a;
  float m = maskAt(uv);
  float hInner = hSrc * m;
  return hInner; // Inner default
}

// Sobel 3×3
vec2 gradSobel(vec2 uv, vec2 texel, float heightPx) {
  vec2 k = texel * max(heightPx, 0.0);
  float h00 = heightAt(uv + k * vec2(-1.0, -1.0));
  float h10 = heightAt(uv + k * vec2(0.0, -1.0));
  float h20 = heightAt(uv + k * vec2(1.0, -1.0));
  float h01 = heightAt(uv + k * vec2(-1.0, 0.0));
  float h11 = heightAt(uv + k * vec2(0.0, 0.0));
  float h21 = heightAt(uv + k * vec2(1.0, 0.0));
  float h02 = heightAt(uv + k * vec2(-1.0, 1.0));
  float h12 = heightAt(uv + k * vec2(0.0, 1.0));
  float h22 = heightAt(uv + k * vec2(1.0, 1.0));
  float gx = h20 + 2.0 * h21 + h22 - (h00 + 2.0 * h01 + h02);
  float gy = h02 + 2.0 * h12 + h22 - (h00 + 2.0 * h10 + h20);
  return vec2(gx, gy);
}

vec3 normalFromGrad(vec2 g, float depthScale) {
  float k = max(depthScale, 1e-4);
  return normalize(vec3(-g * k, 1.0));
}

// -------- 12 PS style contours (0..1 -> 0..1) --------
float contour(float x, int mode) {
  x = clamp(x, 0.0, 1.0);
  if (mode == 0) {
    return x;
  } // Linear
  else if (mode == 1) {
    float t = 2.0 * x - 1.0;
    return clamp(1.0 - t * t, 0.0, 1.0);
  } // Cone
  else if (mode == 2) {
    float t = 2.0 * x - 1.0;
    return clamp(t * t, 0.0, 1.0);
  } // Cone Inverted
  else if (mode == 3) {
    float t = abs(2.0 * x - 1.0);
    return 1.0 - sqrt(clamp(t, 0.0, 1.0));
  } // Cove Deep
  else if (mode == 4) {
    return sin(1.57079632679 * x);
  } // Cove Shallow
  else if (mode == 5) {
    return abs(sin(6.28318530718 * x));
  } // Ring Double
  else if (mode == 6) {
    return abs(sin(9.42477796077 * x));
  } // Ring Triple
  else if (mode == 7) {
    return pow(x, 0.5);
  } // Arch
  else if (mode == 8) {
    float d = (x - 0.5) / 0.25;
    return clamp(exp(-d * d), 0.0, 1.0);
  } // Bump
  else if (mode == 9) {
    return sin(3.14159265359 * x);
  } // Half Round
  else if (mode == 10) {
    return abs(sin(6.28318530718 * x));
  } // Notch
  else if (mode == 11) {
    float tri = abs(fract(x * 2.0) - 0.5) * 2.0;
    return tri;
  } // Triangle
  return x;
}

// ---------- Blend utils ----------
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
  if (minc < 0.0) c = vec3(L) + (c - vec3(L)) * (L / max(L - minc, 1e-5));
  if (maxc > 1.0) c = vec3(L) + (c - vec3(L)) * ((1.0 - L) / max(maxc - L, 1e-5));
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

// --- Blend modes (RGB only) ---
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
  // Base (premult & unpremult)
  vec4 C = readSrcUnpremult(vTexCoord);
  float aOut = C.a;

  // Light
  float ang = radians(u_angleDeg);
  vec2 dir = vec2(cos(ang), sin(ang));
  float elev = radians(clamp(u_heightDeg, 0.0, 89.9));

  // Sobel gradient -> normal -> lambert -> contour with simple 2x2 AA
  vec2 texel = 1.0 / u_srcRes;
  vec2 offsets[4];
  offsets[0] = vec2(0.0, 0.0);
  offsets[1] = vec2(0.5, 0.0) * texel;
  offsets[2] = vec2(0.0, 0.5) * texel;
  offsets[3] = vec2(0.5, 0.5) * texel;

  vec3 accumEffect = vec3(0.0);
  for (int i = 0; i < 4; ++i) {
    vec2 uv = vTexCoord + offsets[i];
    vec2 g = gradSobel(uv, texel, u_sizePx);
    g *= maskAt(uv);
    vec3 N = normalFromGrad(g, u_depth);
    vec3 L = normalize(vec3(dir * cos(elev), sin(elev)));
    vec3 V = vec3(0.0, 0.0, 1.0);
    float ndotl = dot(N, L);
    vec3 baseSample = readSrcUnpremult(uv).rgb;
    vec3 sampleEffect;

    // float specRaw     = pow(max(dot(N, normalize(L + V)), 0.0), 32.0);
    // float specAmount  = contour(specRaw, u_glossContourMode); // Possible to set own contour mode

    if (u_colorMode == 0) {
      // --- PS-style gray (light - shadow)
      // sampleEffect  = (glossLight - glossShadow); // + specAmount can be added
      float shade = clamp(ndotl * 0.5 + 0.5, 0.0, 1.0);
      float grayEmboss = contour(shade, u_glossContourMode);
      sampleEffect = vec3(grayEmboss);
    } else {
      float diffLight = max(ndotl, 0.0);
      float diffShadow = max(-ndotl, 0.0);
      float glossLight = contour(diffLight, u_glossContourMode);
      float glossShadow = contour(diffShadow, u_glossContourMode);

      float lightAmount = clamp(glossLight, 0.0, 1.0);
      float shadowAmount = glossShadow;

      vec3 lightBlended = applyBlend(u_highlightBlendMode, baseSample, u_highlightColor);
      vec3 shadowBlended = applyBlend(u_shadowBlendMode, baseSample, u_shadowColor);

      vec3 coloredEffect = baseSample;
      coloredEffect = mix(coloredEffect, shadowBlended, shadowAmount * u_shadowOpacity);
      coloredEffect = mix(coloredEffect, lightBlended, lightAmount * u_highlightOpacity);

      // --- A: Effect without base ---
      // vec3 effectNoBase = vec3(0.0);
      // effectNoBase = mix(effectNoBase, shadowBlended, shadowAmount * u_shadowOpacity);
      // effectNoBase = mix(effectNoBase, lightBlended,  lightAmount  * u_highlightOpacity);

      // // --- B: Effect with mixed base ---
      // vec3 effectWithBase = baseSample;
      // effectWithBase = mix(effectWithBase, shadowBlended, shadowAmount * u_shadowOpacity);
      // effectWithBase = mix(effectWithBase, lightBlended,  lightAmount  * u_highlightOpacity);

      // // --- Mix between modes ---
      // vec3 coloredEffect = mix(effectNoBase, effectWithBase, u_originalMix);

      sampleEffect = coloredEffect;
    }
    accumEffect += sampleEffect;
  }

  vec3 effectRGB = accumEffect * 0.25;

  // Overall blend
  vec3 blended = applyBlend(u_blendMode, C.rgb, effectRGB);

  // Mask
  float mask = u_maskUse ? texture(u_mask, vTexCoord).a : 1.0;
  float t = clamp(u_mix, 0.0, 1.0) * mask;

  vec3 outRGB_unpremult = mix(C.rgb, blended, t);

  // Return to PREMULT
  vec3 outRGB_premult = outRGB_unpremult * aOut;
  fragColor = vec4(outRGB_premult, aOut);
}
