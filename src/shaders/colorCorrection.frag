#version 300 es
precision highp float;

in vec2 vTexCoord;
out vec4 fragColor;

uniform sampler2D u_src;

// Correction parameters
uniform float u_brightness; // ~[-1..1] added to brightness
uniform float u_contrast; // ~[-1..1] 0=no changes, 1≈2x contrast
uniform float u_saturation; // 0=gray, 1=orig, >1=over-sat

// Mask and blending
uniform bool u_maskUse;
uniform sampler2D u_mask;
uniform float u_mix; // 0..1

// Rec.709 luma
float luma709(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
  vec4 src = texture(u_src, vTexCoord);
  vec3 tex = src.rgb;
  float a = src.a;

  // Gate by source alpha — apply effect only where a visible pixel exists
  float aGate = step(1e-6, a);

  // Mask
  float mask = u_maskUse ? texture(u_mask, vTexCoord).a : 1.0;

  // -------- BRIGHTNESS / CONTRAST / SATURATION CORRECTION --------

  // 1) Brightness (additive shift)
  vec3 col = tex + vec3(u_brightness);

  // 2) Contrast around 0.5
  // u_contrast ~ [-1..1] → factor = 1 + u_contrast (0..2)
  float contrastFactor = 1.0 + u_contrast;
  col = (col - vec3(0.5)) * contrastFactor + vec3(0.5);

  // 3) Saturation: interpolate between gray and current color
  float lum = luma709(col);
  vec3 gray = vec3(lum);
  col = mix(gray, col, u_saturation);

  // Clamp to working range
  col = clamp(col, 0.0, 1.0);

  // -------- BLEND WITH MASK AND ALPHA --------

  float k = clamp(u_mix, 0.0, 1.0) * mask * aGate;

  vec3 finalRgb = mix(tex, col, k) * aGate;

  fragColor = vec4(finalRgb, a);
}
