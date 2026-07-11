#version 300 es
precision highp float;

in vec2 vTexCoord;
out vec4 fragColor;

#define ALPHA_FLOOR 0.0

uniform sampler2D u_mask;
uniform vec2 u_maskRes;
uniform vec2 u_compRes;

uniform int u_channel; // 0=Luma, 1=Alpha, 2=R, 3=G, 4=B
uniform vec2 u_maskRange;
uniform bool u_invert;
uniform vec2 u_contrast;
uniform float u_scale;
uniform float u_rotate;
uniform vec2 u_offset;
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
    // CLAMP
    return clamp(uv, 0.0, 1.0);
  } else if (mode == 1) {
    // REPEAT
    return fract(uv);
  } else if (mode == 2) {
    // MIRROR
    return vec2(mirrorWrap1D(uv.x), mirrorWrap1D(uv.y));
  } else {
    // 3: TRANSPARENT-CLAMP
    visible = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
    return clamp(uv, 0.0, 1.0);
  }
}

vec2 mapUV(vec2 uv, vec2 src, vec2 map, vec2 offset, float scale, float angle) {
  float srcAspect = src.x / src.y;
  float mapAspect = map.x / map.y;

  if (srcAspect > mapAspect) {
    float s = mapAspect / srcAspect;
    uv.y = 0.5 + (uv.y - 0.5) * s;
  } else {
    float s = srcAspect / mapAspect;
    uv.x = 0.5 + (uv.x - 0.5) * s;
  }

  vec2 p = uv - 0.5;
  p.x *= mapAspect;
  p += -offset;

  float sa = sin(angle);
  float ca = cos(angle);
  p = mat2(ca, -sa, sa, ca) * p;

  p /= max(scale, 1e-6);

  p.x /= mapAspect;
  return p + 0.5;
}

// ---------- Mask helpers ----------

float luma(vec3 rgb) {
  return dot(rgb, vec3(0.2126, 0.7152, 0.0722));
}

float pickMaskChannel(vec4 c, int s) {
  if (s == 0) return luma(c.rgb); // Luma
  if (s == 1) return c.a; // Alpha
  if (s == 2) return c.r; // R
  if (s == 3) return c.g; // G
  if (s == 4) return c.b; // B
  return luma(c.rgb);
}

void main() {
  vec2 uvMapped = mapUV(vTexCoord, u_compRes, u_maskRes, u_offset, u_scale, u_rotate);

  float visible;
  vec2 uvWrapped = wrapUV(uvMapped, u_wrapMode, visible);

  vec4 c = texture(u_mask, uvWrapped);

  float a = c.a > ALPHA_FLOOR ? c.a : 0.0;
  float src = pickMaskChannel(c, u_channel);

  float m;
  if (u_channel == 1) {
    // Alpha-only
    m = a;
    if (u_invert) m = 1.0 - m;
  } else {
    // Channels → invert → alpha gating
    m = src;
    if (u_invert) m = 1.0 - m;
    m *= a;
  }

  m *= visible; // TRANSPARENT mode
  m = smoothstep(u_contrast.x, u_contrast.y, m);
  m = clamp(m, 0.0, 1.0);

  vec2 r = clamp(u_maskRange, 0.0, 1.0);
  if (r.x > r.y) r = r.yx;
  m = mix(r.x, r.y, m);

  fragColor = vec4(m);
}
