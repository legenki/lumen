#version 300 es
precision highp float;

#define TWO_PI 6.283185307179586

in vec2 vTexCoord;
out vec4 fragColor;

const int MAX_OCTAVES = 8;

uniform sampler2D u_src;
uniform vec2 u_srcRes;

uniform sampler2D u_mask;
uniform bool u_maskUse;

uniform float u_time;
uniform float u_seed;
uniform int u_octaves;
uniform int u_mode;
uniform float u_aspect;
uniform vec2 u_amp;
uniform vec2 u_freq;
uniform vec2 u_speed;
uniform float u_angleDomain;
uniform float u_angleVector;
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

// ---------- helpers ----------
mat2 rotate2D(float a) {
  float s = sin(a),
    c = cos(a);
  return mat2(c, -s, s, c);
}

//
// Description : Array and textureless GLSL 2D/3D/4D simplex
//               noise functions.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : stegu
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//               https://github.com/stegu/webgl-noise
//

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}
float mod289(float x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 permute(vec4 x) {
  return mod289((x * 34.0 + 10.0) * x);
}
float permute(float x) {
  return mod289((x * 34.0 + 10.0) * x);
}
vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}
float taylorInvSqrt(float r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec4 grad4(float j, vec4 ip) {
  const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
  vec4 p, s;
  p.xyz = floor(fract(vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
  p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
  s = vec4(lessThan(p, vec4(0.0)));
  p.xyz += (s.xyz * 2.0 - 1.0) * s.www;
  return p;
}

#define F4 0.309016994374947451

float snoise(vec4 v) {
  const vec4 C = vec4(0.138196601125011, 0.276393202250021, 0.414589803375032, -0.447213595499958);
  vec4 i = floor(v + dot(v, vec4(F4)));
  vec4 x0 = v - i + dot(i, C.xxxx);
  vec4 i0;
  vec3 isX = step(x0.yzw, x0.xxx);
  vec3 isYZ = step(x0.zww, x0.yyz);
  i0.x = isX.x + isX.y + isX.z;
  i0.yzw = 1.0 - isX;
  i0.y += isYZ.x + isYZ.y;
  i0.zw += 1.0 - isYZ.xy;
  i0.z += isYZ.z;
  i0.w += 1.0 - isYZ.z;

  vec4 i3 = clamp(i0, 0.0, 1.0);
  vec4 i2 = clamp(i0 - 1.0, 0.0, 1.0);
  vec4 i1 = clamp(i0 - 2.0, 0.0, 1.0);

  vec4 x1 = x0 - i1 + C.xxxx;
  vec4 x2 = x0 - i2 + C.yyyy;
  vec4 x3 = x0 - i3 + C.zzzz;
  vec4 x4 = x0 + C.wwww;

  i = mod289(i);
  float j0 = permute(permute(permute(permute(i.w) + i.z) + i.y) + i.x);
  vec4 j1 = permute(
    permute(
      permute(permute(i.w + vec4(i1.w, i2.w, i3.w, 1.0)) + i.z + vec4(i1.z, i2.z, i3.z, 1.0)) +
        i.y +
        vec4(i1.y, i2.y, i3.y, 1.0)
    ) +
      i.x +
      vec4(i1.x, i2.x, i3.x, 1.0)
  );

  vec4 ip = vec4(1.0 / 294.0, 1.0 / 49.0, 1.0 / 7.0, 0.0);

  vec4 p0 = grad4(j0, ip);
  vec4 p1 = grad4(j1.x, ip);
  vec4 p2 = grad4(j1.y, ip);
  vec4 p3 = grad4(j1.z, ip);
  vec4 p4 = grad4(j1.w, ip);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  p4 *= taylorInvSqrt(dot(p4, p4));

  vec3 m0 = max(0.51 - vec3(dot(x0, x0), dot(x1, x1), dot(x2, x2)), 0.0);
  vec2 m1 = max(0.51 - vec2(dot(x3, x3), dot(x4, x4)), 0.0);
  m0 *= m0;
  m1 *= m1;

  return 49.0 *
  (dot(m0 * m0, vec3(dot(p0, x0), dot(p1, x1), dot(p2, x2))) +
    dot(m1 * m1, vec2(dot(p3, x3), dot(p4, x4))));
}

float fbm(vec2 uv, float seed, float freq, float speed, float time, int octaves) {
  int oct = clamp(octaves, 1, MAX_OCTAVES);
  float total = 0.0,
    maxAmp = 0.0,
    amp = 1.0;
  float baseSeed = seed;

  for (int i = 0; i < MAX_OCTAVES; ++i) {
    if (i >= oct) break;
    float angle = TWO_PI * time + float(i) * 0.6180339887;
    // float angle = (TWO_PI * time / 1.0) * (1.0 / TWO_PI) + float(i) * 0.6180339887;
    vec2 loop = vec2(cos(angle), sin(angle)) * speed;
    float n = 0.7 * snoise(vec4(uv * freq + baseSeed, loop));
    total += n * amp;
    maxAmp += amp;
    amp *= 0.5;
    freq *= 2.0;
    baseSeed += 77.9;
  }
  return total;
}

void main() {
  vec2 uv = vTexCoord;

  vec2 centerUV = uv - 0.5;
  vec2 centerPX = toPxSpace(centerUV, u_srcRes);

  // rotating the noise domain
  mat2 Rdom = rotate2D(u_angleDomain);
  centerPX = Rdom * centerPX;

  // generating two noise spaces
  float nx, ny;
  if (u_mode == 0) {
    // 1D noise - individual axes
    nx = fbm(vec2(centerPX.x, 0.0), u_seed, u_freq.x, u_speed.x, u_time, u_octaves);
    ny = fbm(vec2(0.0, centerPX.y), u_seed + 723.1, u_freq.y, u_speed.y, u_time, u_octaves);
  } else {
    // 2D noise
    nx = fbm(centerPX, u_seed, u_freq.x, u_speed.x, u_time, u_octaves);
    ny = fbm(centerPX, u_seed + 723.1, u_freq.y, u_speed.y, u_time, u_octaves);
  }

  // amplitude anisotropy per axes + clamp 0..1
  vec2 dispPX = vec2(nx * (1.0 - u_aspect), ny * (1.0 + u_aspect)) * clamp(u_amp, 0.0, 1.0);

  // rotating the noise vector
  mat2 Rvec = rotate2D(u_angleVector);
  dispPX = Rvec * dispPX;

  // mask
  if (u_maskUse) {
    float m = texture(u_mask, uv).a;
    dispPX *= m;
  }

  // sampling with wrap-mode
  vec2 dispUV = fromPxSpace(dispPX, u_srcRes);
  vec2 sampleUV = uv + dispUV;

  float visible;
  vec2 wrappedUV = wrapUV(sampleUV, u_wrapMode, visible);

  vec4 col = texture(u_src, wrappedUV);
  col.a *= visible;

  fragColor = col;
}
