#version 300 es
precision highp float;

in vec2 vTexCoord;
out vec4 fragColor;

uniform sampler2D u_tex;
uniform vec2 u_res;
uniform vec2 u_dir;
uniform float u_sigmaPx;
uniform int u_radiusPx;
uniform bool u_inputIsPremult;
uniform bool u_fastKernel;

uniform bool u_maskUse;
uniform sampler2D u_mask;

const int MAX_RADIUS = 256;

float gaussSafe(float x, float s) {
  s = max(s, 1e-4);
  return exp(-0.5 * (x * x) / (s * s));
}

// --- mask ---
float readMask(vec2 uv) {
  return clamp(texture(u_mask, uv).a, 0.0, 1.0);
}

void accumSample(vec2 uv, float w, inout vec3 accPremultRGB, inout float accA, bool premult) {
  vec4 c = texture(u_tex, uv);
  vec3 rgbPremult = premult ? c.rgb : c.rgb * c.a;
  accPremultRGB += w * rgbPremult;
  accA += w * c.a;
}

void main() {
  vec2 uv = vTexCoord;
  vec2 texel = 1.0 / u_res;
  int R = min(u_radiusPx, MAX_RADIUS);
  float eps = 1e-6;

  // Local σ: u_sigmaPx * mask(uv), if mask is used
  float sigma = u_maskUse ? max(1e-4, u_sigmaPx * readMask(uv)) : u_sigmaPx;

  vec3 accRGB = vec3(0.0);
  float accA = 0.0;
  float sumW = 0.0;

  float w0 = gaussSafe(0.0, sigma);
  accumSample(uv, w0, accRGB, accA, u_inputIsPremult);
  sumW += w0;

  if (!u_fastKernel) {
    for (int i = 1; i <= MAX_RADIUS; i++) {
      if (i > R) break;
      float w = gaussSafe(float(i), sigma);
      vec2 off = float(i) * (u_dir * texel);
      accumSample(uv + off, w, accRGB, accA, u_inputIsPremult);
      accumSample(uv - off, w, accRGB, accA, u_inputIsPremult);
      sumW += 2.0 * w;
    }
  } else {
    for (int i = 1; i <= MAX_RADIUS; i += 2) {
      if (i > R) break;
      float wi = gaussSafe(float(i), sigma);
      bool hasJ = i + 1 <= R;
      float wj = hasJ ? gaussSafe(float(i + 1), sigma) : 0.0;
      float W = wi + wj;
      float offPix = W > eps ? (float(i) * wi + float(i + 1) * wj) / W : float(i);
      vec2 off = offPix * (u_dir * texel);

      accumSample(uv + off, W, accRGB, accA, u_inputIsPremult);
      accumSample(uv - off, W, accRGB, accA, u_inputIsPremult);
      sumW += 2.0 * W;
    }
  }

  vec3 premultRGB = accRGB / max(sumW, eps);
  float A = accA / max(sumW, eps);

  fragColor = vec4(premultRGB, clamp(A, 0.0, 1.0));
}
