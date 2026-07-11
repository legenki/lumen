#version 300 es
precision highp float;

in vec2 vTexCoord;
out vec4 fragColor;

// --- Displacement & Mask ---
uniform sampler2D u_disp;
uniform vec2 u_dispRes;
uniform int u_wrapMode; // 0=CLAMP, 1=REPEAT, 2=MIRROR, 3=CLAMP->transparent

uniform bool u_maskUse;
uniform sampler2D u_mask;

// --- Sources ---
uniform sampler2D u_src;
uniform vec2 u_srcRes;

uniform sampler2D u_img;
uniform vec2 u_imgRes;

uniform int u_mode; // 0 = Prev Source (u_src), 1 = Image (u_img)

// --- Source transform (source) ---
uniform vec2 u_srcOffset; // mapUV space
uniform float u_srcScale; // > 0
uniform float u_srcAngle; // radians
uniform int u_srcWrapMode; // 0/1/2/3

// --- Displacement transform (u_disp) ---
uniform vec2 u_offset; // mapUV space
uniform float u_scale; // > 0
uniform float u_angle; // radians

// --- Effect params ---
uniform vec2 u_weight; // UV offset along XY
uniform int u_dispMode; // 0 = Luma, 1 = RG

// ---------- Utils ----------
float luma(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

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

// ---------- Main ----------
void main() {
  // Source (u_src)
  vec4 srcOrig = texture(u_src, vTexCoord);
  vec3 baseRgb = srcOrig.rgb;
  float aSrc = srcOrig.a;

  // Mask
  float mask = u_maskUse ? texture(u_mask, vTexCoord).a : 1.0;

  // Displace: bound to u_src
  vec2 dispUV = mapUV(vTexCoord, u_srcRes, u_dispRes, u_offset, u_scale, u_angle);
  float visibleDisp;
  vec2 dispUVWrapped = wrapUV(dispUV, u_wrapMode, visibleDisp);
  vec4 dcol = texture(u_disp, dispUVWrapped);

  // Displace vector
  vec2 d =
    u_dispMode == 1
      ? (dcol.rg * 2.0 - 1.0) * 0.5 // RG
      : vec2(luma(dcol.rgb) - 0.5); // Luma

  float dispVisK = u_wrapMode == 3 ? visibleDisp : 1.0;
  vec2 offset = d * u_weight * dcol.a * mask * dispVisK;

  // Source of the effect (color + alpha of the displaced source)
  bool useImg = u_mode == 1;
  vec2 srcBaseUV = useImg
    ? mapUV(dispUV, u_dispRes, u_imgRes, u_srcOffset, u_srcScale, u_srcAngle)
    : mapUV(vTexCoord, u_srcRes, u_srcRes, u_srcOffset, u_srcScale, u_srcAngle);

  float visSrcFinal;
  vec2 srcWrapped = wrapUV(srcBaseUV - offset, u_srcWrapMode, visSrcFinal);

  vec4 srcFx = useImg ? texture(u_img, srcWrapped) : texture(u_src, srcWrapped);

  // Taking transparency into account in the coefficient (rather than in RGB).
  float visImg = useImg && u_srcWrapMode == 3 ? visSrcFinal : 1.0;

  // Effect multiplier (color)
  // Mask is not applied in the final mix
  float kBase = dispVisK * dcol.a * visImg;
  if (useImg) kBase *= srcFx.a;

  // Alternative option: Mask is used in the final mix
  // float kBase = mask * dispVisK * dcol.a * visImg;
  // if (useImg) kBase *= srcFx.a;

  float k = clamp(kBase, 0.0, 1.0);

  // --- Alpha ---
  float aFx = srcFx.a * (u_srcWrapMode == 3 ? visSrcFinal : 1.0);
  float aOut = mix(aSrc, aFx, k);

  // Color
  vec3 outRgb = mix(baseRgb, srcFx.rgb, k);

  fragColor = vec4(outRgb, aOut);
}
