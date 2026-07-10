#version 300 es
precision highp float;
precision highp int;

in vec2 vTexCoord;
out vec4 fragColor;

uniform sampler2D u_src;

// Mask and overall effect mix
uniform bool u_maskUse;
uniform sampler2D u_mask;

uniform float u_mix; // 0..1, how much aberration to mix in
uniform int u_wrapMode; // 0=CLAMP,1=REPEAT,2=MIRROR,3=TRANSPARENT
uniform vec2 u_texelSize; // pixel size (1.0 / width, 1.0 / height)

// ------------ ABERRATION ------------

uniform float u_abStrength; // strength in "px units" (for normalization)
uniform float u_maxStrength; // >0, reference max magnitude for normalization
uniform int u_abMode; // 0 = directional, 1 = sphere-center, 2 = sphere-edges
uniform float u_abAngle; // direction angle for directional mode (radians)
uniform vec3 u_abChannel; // shift multiplier for R/G/B, e.g. vec3(0..1)

// ------------ Focus ------------

uniform vec2 u_abFocus; // focus center in UV [0..1]^2

// ------------ Hue Shift on fringe ------------

uniform float u_abHueShift; // hue shift: 1.0 = +360°, -1.0 = -360°

const float EPS = 1e-5;
const float PI = 3.14159265358979323846;

// ================= HSV helpers =================

vec3 rgb2hsv(vec3 c) {
  float cMax = max(c.r, max(c.g, c.b));
  float cMin = min(c.r, min(c.g, c.b));
  float delta = cMax - cMin;

  float h = 0.0;
  float s = 0.0;
  float v = cMax;

  if (delta > 1e-6) {
    s = cMax > 0.0 ? delta / cMax : 0.0;

    if (cMax == c.r) {
      h = (c.g - c.b) / delta;
    } else if (cMax == c.g) {
      h = 2.0 + (c.b - c.r) / delta;
    } else {
      h = 4.0 + (c.r - c.g) / delta;
    }

    h /= 6.0;
    if (h < 0.0) h += 1.0;
  }

  return vec3(h, s, v);
}

vec3 hsv2rgb(vec3 c) {
  float h = c.x * 6.0;
  float s = c.y;
  float v = c.z;

  float i = floor(h);
  float f = h - i;

  float p = v * (1.0 - s);
  float q = v * (1.0 - s * f);
  float t = v * (1.0 - s * (1.0 - f));

  vec3 rgb;

  if (i < 0.5) {
    rgb = vec3(v, t, p);
  } else if (i < 1.5) {
    rgb = vec3(q, v, p);
  } else if (i < 2.5) {
    rgb = vec3(p, v, t);
  } else if (i < 3.5) {
    rgb = vec3(p, q, v);
  } else if (i < 4.5) {
    rgb = vec3(t, p, v);
  } else {
    rgb = vec3(v, p, q);
  }

  return rgb;
}

vec3 shiftHue(vec3 rgb, float fracShift) {
  vec3 hsv = rgb2hsv(rgb);
  hsv.x = fract(hsv.x + fracShift);
  return hsv2rgb(hsv);
}

// ================= Wrap helpers =================

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
  }
  if (mode == 1) {
    // REPEAT
    return fract(uv);
  }
  if (mode == 2) {
    // MIRROR
    return vec2(mirrorWrap1D(uv.x), mirrorWrap1D(uv.y));
  }
  // mode == 3: TRANSPARENT (clamp + visibility gate)
  vec2 clamped = clamp(uv, 0.0, 1.0);
  vec2 diff = abs(uv - clamped);
  float gate = step(max(diff.x, diff.y), 0.0001);
  visible = gate;
  return clamped;
}

// ================= Sphere-center delta  =================
// "center" mode: fisheye around u_abFocus

vec2 computeSphereDeltaCenter(vec2 uv, float strengthNorm, float strengthSign) {
  if (strengthNorm <= 0.0) {
    return vec2(0.0);
  }

  // aspect = height / width
  float aspect = u_texelSize.y / u_texelSize.x;

  // uv and center in NDC [-1..1]
  vec2 uvN = uv * 2.0 - 1.0;
  vec2 bulgePos = u_abFocus * 2.0 - 1.0;

  uvN.x *= aspect;
  bulgePos.x *= aspect;

  vec2 uvMoved = uvN - bulgePos;
  float len = length(uvMoved);
  if (len < 1e-6) {
    return vec2(0.0);
  }

  vec2 dir = uvMoved / len;

  // fisheye curve
  float num = len;
  float denom = pow(len * 0.65, 6.0) + 0.048;
  float f = denom > 0.0 ? 0.0082 * num / denom : 0.0;

  // magnitude of strength + sign (bulge/pinch)
  f *= strengthNorm * strengthSign;

  vec2 uvNBulged = uvN - dir * f;

  // remove aspect on X
  uvNBulged.x /= aspect;

  // back to UV [0..1]
  vec2 uvBulged;
  uvBulged.x = uvNBulged.x * 0.5 + 0.5;
  uvBulged.y = uvNBulged.y * 0.5 + 0.5;

  return uvBulged - uv;
}

// ================= Sphere-edges delta =================
//
// Effect: minimum at center, maximum at edges.
// Radius relative to u_abFocus; amplitude grows toward edges.

vec2 computeSphereDeltaEdges(vec2 uv, float strengthNorm, float strengthSign) {
  if (strengthNorm <= 0.0) {
    return vec2(0.0);
  }

  float aspect = u_texelSize.y / u_texelSize.x;

  // uv and center in NDC [-1..1]
  vec2 uvN = uv * 2.0 - 1.0;
  vec2 bulgePos = u_abFocus * 2.0 - 1.0;

  uvN.x *= aspect;
  bulgePos.x *= aspect;

  vec2 uvMoved = uvN - bulgePos;
  float len = length(uvMoved);
  if (len < 1e-6) {
    return vec2(0.0);
  }

  vec2 dir = uvMoved / len;

  // max distance to corners in these coordinates
  float maxLen = 0.0;
  vec2 c0 = vec2(-1.0, -1.0);
  c0.x *= aspect;
  vec2 c1 = vec2(1.0, -1.0);
  c1.x *= aspect;
  vec2 c2 = vec2(-1.0, 1.0);
  c2.x *= aspect;
  vec2 c3 = vec2(1.0, 1.0);
  c3.x *= aspect;

  maxLen = max(maxLen, length(c0 - bulgePos));
  maxLen = max(maxLen, length(c1 - bulgePos));
  maxLen = max(maxLen, length(c2 - bulgePos));
  maxLen = max(maxLen, length(c3 - bulgePos));

  if (maxLen < 1e-6) {
    return vec2(0.0);
  }

  // normalized radius: 0 at center, ~1 at edges
  float lenNorm = clamp(len / maxLen, 0.0, 1.0);

  // edge factor: increases toward edge
  float edgeFactor = pow(lenNorm, 1.6);

  // amplitude scale
  float f = strengthNorm * edgeFactor * strengthSign * 0.25;

  vec2 uvNBulged = uvN - dir * f;

  uvNBulged.x /= aspect;

  vec2 uvBulged;
  uvBulged.x = uvNBulged.x * 0.5 + 0.5;
  uvBulged.y = uvNBulged.y * 0.5 + 0.5;

  return uvBulged - uv;
}

// ================= main =================

void main() {
  vec4 src = texture(u_src, vTexCoord);
  vec3 baseRgb = src.rgb;
  float a = src.a;

  // alpha gate — avoid pulling color from empty space
  float aGate = step(1e-6, a);

  // mask
  float mask = 1.0;
  if (u_maskUse) {
    mask = clamp(texture(u_mask, vTexCoord).a, 0.0, 1.0);
  }

  // strength breakdown: sign and magnitude
  float strengthSigned = u_abStrength; // can be negative
  float strengthSign = strengthSigned >= 0.0 ? 1.0 : -1.0;
  float strengthAbs = abs(strengthSigned);

  // mask affects only magnitude
  float strengthAbsMasked = strengthAbs * mask;

  // global early exits
  if (strengthAbsMasked <= 0.0 || u_mix <= 0.0 || aGate == 0.0) {
    fragColor = vec4(baseRgb * aGate, a);
    return;
  }

  // normalized strength (0..1) from magnitude with mask
  float strengthNorm = 0.0;
  if (u_maxStrength > EPS) {
    strengthNorm = clamp(strengthAbsMasked / u_maxStrength, 0.0, 1.0);
  }

  vec2 baseShift = vec2(0.0);

  if (u_abMode == 1) {
    // ----- SPHERE-CENTER -----
    baseShift = computeSphereDeltaCenter(vTexCoord, strengthNorm, strengthSign);

    if (length(baseShift) < 1e-6) {
      fragColor = vec4(baseRgb * aGate, a);
      return;
    }

  } else if (u_abMode == 2) {
    // ----- SPHERE-EDGES -----
    baseShift = computeSphereDeltaEdges(vTexCoord, strengthNorm, strengthSign);

    if (length(baseShift) < 1e-6) {
      fragColor = vec4(baseRgb * aGate, a);
      return;
    }

  } else {
    // ----- DIRECTIONAL -----
    float pixShiftPx = strengthAbsMasked;
    if (pixShiftPx <= 0.0) {
      fragColor = vec4(baseRgb * aGate, a);
      return;
    }

    float ang = u_abAngle;
    vec2 dir = vec2(cos(ang), sin(ang)) * strengthSign;

    baseShift = dir * pixShiftPx * u_texelSize;
  }

  // offsets per channel
  vec2 uvR;
  vec2 uvG;
  vec2 uvB;

  if (u_abMode == 0) {
    // ----- DIRECTIONAL -----
    vec3 ch = u_abChannel;

    // average channel value
    float avg = (ch.r + ch.g + ch.b) / 3.0;

    // center coefficients: total shift ≈ 0
    float kR = ch.r - avg;
    float kG = ch.g - avg;
    float kB = ch.b - avg;

    uvR = vTexCoord + baseShift * kR;
    uvG = vTexCoord + baseShift * kG;
    uvB = vTexCoord + baseShift * kB;
  } else {
    // ----- SPHERE modes -----
    uvR = vTexCoord + baseShift * u_abChannel.r;
    uvG = vTexCoord + baseShift * u_abChannel.g;
    uvB = vTexCoord + baseShift * u_abChannel.b;
  }

  float visR, visG, visB;
  vec2 uvRWrapped = wrapUV(uvR, u_wrapMode, visR);
  vec2 uvGWrapped = wrapUV(uvG, u_wrapMode, visG);
  vec2 uvBWrapped = wrapUV(uvB, u_wrapMode, visB);

  // samples with alpha
  vec4 sR = texture(u_src, uvRWrapped);
  vec4 sG = texture(u_src, uvGWrapped);
  vec4 sB = texture(u_src, uvBWrapped);

  vec3 abRgb = vec3(sR.r, sG.g, sB.b);
  float abA = (sR.a + sG.a + sB.a) / 3.0;

  // ---------- Hue Shift ----------

  float channelStrength = (abs(u_abChannel.r) + abs(u_abChannel.g) + abs(u_abChannel.b)) / 3.0;
  channelStrength = clamp(channelStrength, 0.0, 1.0);

  float effectAmt = strengthNorm;
  float hueFactor = effectAmt * channelStrength;

  if (abs(u_abHueShift) > 1e-4 && hueFactor > 0.0) {
    float hueShiftFrac = u_abHueShift * hueFactor * 0.5;
    abRgb = shiftHue(abRgb, hueShiftFrac);
  }

  // visibility for TRANSPARENT wrap
  float visible = min(visR, min(visG, visB));

  // global mix — ONLY u_mix, mask already applied in strengthAbsMasked/strengthNorm
  float k = clamp(u_mix, 0.0, 1.0) * aGate * visible;

  vec4 base = vec4(baseRgb, a);
  vec4 aber = vec4(abRgb, abA);

  vec4 mixed = mix(base, aber, k);

  // do not leave color under full transparency
  mixed.rgb *= aGate;

  fragColor = mixed;
}
