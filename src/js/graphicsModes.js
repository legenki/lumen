// WEBGL-буфер после resizeCanvas: p5 сбрасывает stroke/density; framebuffer'ы
// p5 по умолчанию автоследуют размеру канваса — пересоздавать их не нужно.
export function restoreGlModes(g) {
  g.pixelDensity(1);
  g.noStroke();
}
