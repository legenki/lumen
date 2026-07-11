#version 300 es
precision highp float;

#define TWO_PI 6.283185307179586
#define QUARTER_PI 0.7853981633974483

in vec2 vTexCoord;
out vec4 fragColor;

uniform sampler2D u_src;
uniform vec2 u_srcRes;

uniform bool u_maskUse;
uniform sampler2D u_mask;

uniform float u_time;
uniform int u_mode; // 0: cartesian, 1: rotated-smear, 2: radial-directed
uniform vec2 u_amp;
uniform float u_compress;
uniform float u_aspect;
uniform vec2 u_freq;
uniform vec2 u_speed;
uniform vec2 u_phase;
uniform float u_angle;
uniform vec2 u_center;
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
    // CLAMP (edge stretch)
    return clamp(uv, 0.0, 1.0);
  } else if (mode == 1) {
    // REPEAT
    return fract(uv);
  } else if (mode == 2) {
    // MIRROR
    return vec2(mirrorWrap1D(uv.x), mirrorWrap1D(uv.y));
  } else {
    // 3: CLAMP -> transparent outside
    visible = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
    return clamp(uv, 0.0, 1.0);
  }
}

// ---------- Orientation-aware "px-space" ----------
vec2 toPxSpace(vec2 pUV, vec2 res) {
  float ar = res.x / max(res.y, 1e-6);
  vec2 s = res.y > res.x ? vec2(1.0, 1.0 / ar) : vec2(ar, 1.0);
  return pUV * s;
}

vec2 fromPxSpace(vec2 pPX, vec2 res) {
  float ar = res.x / max(res.y, 1e-6);
  vec2 s = res.y > res.x ? vec2(1.0, 1.0 / ar) : vec2(ar, 1.0);
  return pPX / s;
}

// ---------- Small helpers ----------
mat2 rotate2D(float a) {
  float s = sin(a),
    c = cos(a);
  return mat2(c, -s, s, c);
}

// ---------- Ellipse Utilities ----------
vec2 ovalAxes() {
  float a = clamp(u_aspect, -1.0, 1.0);
  float xaspect = a < 0.0 ? 1.0 : pow(1.0 + a, 2.0);
  float yaspect = a > 0.0 ? 1.0 : pow(1.0 + abs(a), 2.0);
  return max(vec2(xaspect, yaspect), vec2(1e-6));
}

// no rotation — only anisotropic scale
vec2 toEllipseSpacePx(vec2 pPX) {
  return pPX / ovalAxes();
}

// ---------- Peaks Compressing ----------
float compressPeaks(float x, float A) {
  float k = (1.0 - A) / max(A, 1e-6);
  return x / (1.0 + k * abs(x));
}

void main() {
  vec2 uv = vTexCoord;

  // Centers and vector to center in px space
  vec2 centerUV = uv - 0.5;
  vec2 centerPX = toPxSpace(centerUV, u_srcRes);
  vec2 cPX = toPxSpace(u_center, u_srcRes);
  vec2 dPX = centerPX - cPX;

  // --- sin phase ---
  vec2 displace;
  if (u_mode == 0) {
    // Cartesian: consider the phase in a rotated XY grid
    vec2 rotCenterPX = rotate2D(u_angle) * centerPX;
    displace = TWO_PI * rotCenterPX * u_freq;
  } else {
    // Radial: first rotate the grid, then calculate the elliptical radius
    vec2 dPXr = rotate2D(u_angle) * dPX;
    float distEllipse = length(toEllipseSpacePx(dPXr));
    displace = TWO_PI * vec2(distEllipse * u_freq.x, distEllipse * u_freq.y);
  }

  vec2 speed = TWO_PI * u_time * u_speed;
  float sx = sin(displace.x + speed.x + TWO_PI * u_phase.x);
  float sy = sin(displace.y + speed.y + TWO_PI * u_phase.y);

  // amplitude peak compressing
  sx = compressPeaks(sx, 1.0 - u_compress);
  sy = compressPeaks(sy, 1.0 - u_compress);

  // amplitude anisotropy along the axes
  vec2 dispAxis = vec2(sx * (1.0 - u_aspect), sy * (1.0 + u_aspect)) * clamp(u_amp, 0.0, 1.0);

  vec2 dispPX;

  if (u_mode == 0) {
    // Cartesian - plain XY components (in px space)
    dispPX = dispAxis;

  } else if (u_mode == 1) {
    // Additional rotation (u_angle + 45°)
    float ang = u_angle + QUARTER_PI;
    dispPX = rotate2D(ang) * dispAxis;

  } else {
    // u_mode == 2
    // “Squeezing” along the direction toward the center — the direction from the rotated dPX
    vec2 dPXr = rotate2D(u_angle) * dPX;
    float len = length(dPXr);
    vec2 dirSafe = len > 1e-5 ? dPXr / len : vec2(0.0);
    dispPX = dispAxis * dirSafe;
  }

  // mask
  if (u_maskUse) {
    float m = texture(u_mask, uv).a;
    dispPX *= m;
  }

  // sampling
  vec2 dispUV = fromPxSpace(dispPX, u_srcRes);
  vec2 sampleUV = uv + dispUV;

  float visible;
  vec2 wrapped = wrapUV(sampleUV, u_wrapMode, visible);

  vec4 col = texture(u_src, wrapped);
  col.a *= visible;

  fragColor = col;
}
