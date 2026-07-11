#version 300 es
precision highp float;

in vec2 vTexCoord;
out vec4 fragColor;

uniform sampler2D u_tex;
uniform sampler2D u_src;
uniform bool u_useSrc;
uniform float u_mix;
uniform int u_blendMode;

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
  const float EPS = 1e-5;

  vec4 blurredPM = texture(u_tex, vTexCoord);
  if (!u_useSrc) {
    fragColor = blurredPM;
    return;
  }

  vec4 basePM = texture(u_src, vTexCoord);
  float Ab = basePM.a;
  float As = blurredPM.a;
  float k = clamp(u_mix, 0.0, 1.0);

  if (k <= 0.0) {
    fragColor = basePM;
    return;
  }

  if (As <= EPS) {
    fragColor = basePM;
    return;
  }

  vec3 Cb = Ab > EPS ? basePM.rgb / Ab : vec3(0.0);
  vec3 Cs = As > EPS ? blurredPM.rgb / As : vec3(0.0);

  vec3 blended = applyBlend(u_blendMode, Cb, Cs);
  vec3 PM_blur = blended * As;

  vec3 PM_out = mix(basePM.rgb, PM_blur, k);
  float Aout = mix(Ab, As, k);

  fragColor = vec4(PM_out, Aout);
}
