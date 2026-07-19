#version 300 es
precision highp float;

// Identity blit from an FBO color attachment to the main WEBGL canvas.
// Y is flipped: p5 Framebuffer textures are sampled with inverted V relative
// to the main canvas (same correction p5.image() applied automatically).
in vec2 vTexCoord;
out vec4 fragColor;

uniform sampler2D u_tex;

void main() {
  fragColor = texture(u_tex, vec2(vTexCoord.x, 1.0 - vTexCoord.y));
}
