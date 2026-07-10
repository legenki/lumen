#version 300 es
precision highp float;

in vec2 vTexCoord;
out vec4 fragColor;

uniform sampler2D u_src; // PREMULT backdrop
uniform vec2 u_srcRes; // px

// Mask from alpha
uniform bool u_maskUse;
uniform sampler2D u_mask;

// Luma threshold (ignoring alpha)
uniform vec2 u_threshRange; // x=min, y=max (0..1)
uniform float u_threshSoft; // >=0

// Effect (noise)
uniform float u_mix; // 0..1 — effect strength (into noise layer alpha)
uniform float u_grainPx; // >=1 px — grain size
uniform bool u_colorNoise; // true=RGB different noise, false=mono
uniform float u_seed; // [0..1]

// Timing (Variant B)
uniform float u_time; // [0..1] position in clip
uniform float u_clipFps; // clip FPS
uniform float u_totalFrames; // number of frames
uniform float u_fps; // pattern changes per second; <=0 => static

// Blending
uniform int u_blendMode; // see applyBlend()
uniform float u_contrast; // 0 = soft, 1 = normal, >1 = contrasted grain

// Whether source transparency affects noise visibility
uniform int u_alphaMode; // 0=Always Visible / 1=Fade with Transparency

// ---------- Utils ----------
float luma709(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}
float luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float patternTick() {
  if (u_fps <= 0.0) return 0.0;
  if (u_clipFps <= 0.0 || u_totalFrames <= 0.0) return 0.0;
  float frameIdx = floor(u_time * u_totalFrames + 0.5);
  float seconds = frameIdx / u_clipFps;
  return floor(seconds * u_fps + 1e-6);
}

// Luma threshold with soft edges
float thresholdGate(float L, vec2 range, float soft) {
  float tMin = min(range.x, range.y);
  float tMax = max(range.x, range.y);
  soft = max(soft, 0.0);

  if (soft <= 0.0) {
    return step(tMin, L) * step(L, tMax);
  }
  float lo0 = tMin - soft,
    lo1 = tMin + soft;
  float hi0 = tMax - soft,
    hi1 = tMax + soft;
  float enter = smoothstep(lo0, lo1, L);
  float exit = 1.0 - smoothstep(hi0, hi1, L);
  return clamp(enter * exit, 0.0, 1.0);
}

// ---------- CSS/PS helpers ----------
float lum(vec3 c) {
  return luma(c);
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

// ---------- Blend modes (operate on STRAIGHT colors) ----------
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
} // Linear Dodge
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
  vec3 vl = blend_vividLight(b, c);
  return step(0.5, vl);
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

float valueNoise2D(vec2 p, vec2 j) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  float a = hash12(i + j);
  float b = hash12(i + vec2(1.0, 0.0) + j);
  float c = hash12(i + vec2(0.0, 1.0) + j);
  float d = hash12(i + vec2(1.0, 1.0) + j);

  vec2 u = f * f * f * (f * (6.0 * f - 15.0) + 10.0);

  float nx0 = mix(a, b, u.x);
  float nx1 = mix(c, d, u.x);
  return mix(nx0, nx1, u.y); // 0..1
}

float filmValueNoise(vec2 px, float grainPx, vec2 j) {
  float g = max(grainPx, 1.0);

  vec2 p0 = px / g;
  vec2 p1 = px / (g * 0.5);
  vec2 p2 = px / (g * 2.0);

  float n0 = valueNoise2D(p0, j);
  float n1 = valueNoise2D(p1, j + vec2(17.0, 9.0));
  float n2 = valueNoise2D(p2, j + vec2(-11.0, 5.0));

  float n = n0 * 0.6 + n1 * 0.25 + n2 * 0.15;

  return n * 2.0 - 1.0; // [-1..1]
}

// ---------- main ----------
void main() {
  const float EPS = 1e-5;

  // Backdrop (PREMULT) -> straight
  vec4 Bpm = texture(u_src, vTexCoord);
  float Ab = Bpm.a;
  vec3 Cb = Ab > EPS ? Bpm.rgb / Ab : vec3(0.0);

  // --- Mask ---
  float mask = u_maskUse ? texture(u_mask, vTexCoord).a : 1.0;

  float lMetric = luma709(Cb);
  // In Fade with Transparency mode raise very dark values
  // to the soft level so pure black does not end up mid-soft-threshold
  if (u_threshSoft > 0.0) {
    lMetric = clamp(lMetric, u_threshSoft, 1.0 - u_threshSoft);
  }
  float kGate = thresholdGate(lMetric, u_threshRange, u_threshSoft);
  float AsBase = clamp(u_mix, 0.0, 1.0) * mask * kGate;

  // --- NOISE LAYER CONTENT (STRAIGHT), INDEPENDENT OF BASE ---
  float g = max(u_grainPx, 1.0);
  vec2 px = (vTexCoord - 0.5) * u_srcRes;

  float tick = patternTick();
  float animSeed = fract(u_seed + tick * 0.61803398875);
  vec2 j = vec2(animSeed * 71.0, animSeed * 113.0);

  // --- LUMINANCE film grain [-1..1] ---
  float nL = filmValueNoise(px, g, j); // value-noise with octaves

  vec3 nRGB;

  if (!u_colorNoise) {
    // Monochrome grain
    nRGB = vec3(nL);
  } else {
    // --- Color noise that scales with the grain ---
    vec2 base = px / g;

    mat2 R1 = mat2(
       0.866, -0.5  ,
       0.5  ,  0.866
    );
    mat2 R2 = mat2(
      -0.707,  0.707,
      -0.707, -0.707
    );
    mat2 R3 = mat2(
       0.259,  0.966,
      -0.966,  0.259
    );

    vec2 pR = R1 * (base * 1.21);
    vec2 pG = R2 * (base * 1.37);
    vec2 pB = R3 * (base * 1.61);

    float cr = valueNoise2D(pR, j + vec2(11.0, 3.7));
    float cg = valueNoise2D(pG, j + vec2(-7.0, 5.3));
    float cb = valueNoise2D(pB, j + vec2(19.0, -9.1));

    vec3 cNoise = vec3(cr, cg, cb) * 2.0 - 1.0;

    float m = (cNoise.r + cNoise.g + cNoise.b) / 3.0;
    cNoise -= vec3(m);

    nRGB = vec3(nL) + cNoise;
  }

  // --- Grain contrast ---
  float gc = max(u_contrast, 0.0);
  nRGB *= gc;
  nRGB = clamp(nRGB, -1.0, 1.0);

  // Map noise into [0..1]
  vec3 Cs = clamp(nRGB * 0.5 + 0.5, 0.0, 1.0);

  // Photoshop-style blending (STRAIGHT)
  vec3 Bcs = applyBlend(u_blendMode, Cb, Cs);

  vec3 PM_out;
  float Aout;

  if (u_alphaMode == 0) {
    // --- Mode 0: Always Visible (old PS composite, noise as separate layer) ---
    float As = AsBase;

    PM_out = Ab * (1.0 - As) * Cb + As * (1.0 - Ab) * Cs + Ab * As * Bcs;
    Aout = Ab + As - Ab * As;
  } else {
    // --- Mode 1: Fade with Transparency ---
    // Noise recolors the layer with strength AsBase, but transparency comes from source (Ab)
    float k = AsBase; // effect strength 0..1
    vec3 Cout = mix(Cb, Bcs, k); // color: base -> noise/blend by k

    PM_out = Cout * Ab; // premult
    Aout = Ab;
  }

  fragColor = vec4(PM_out, Aout); // PREMULT OUTPUT
}
