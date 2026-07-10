// resizeCanvas() у p5.Graphics полностью сбрасывает 2D-контекст —
// после ЛЮБОГО resize обязательно восстановить режимы (AGENTS.md §4).
export function restoreGraphicsModes(g, p) {
  g.pixelDensity(1);
  g.angleMode(p.DEGREES);
  g.rectMode(p.CORNER);
  g.imageMode(p.CORNER);
  g.noStroke();
}

// WEBGL-буфер после resizeCanvas: p5 сбрасывает stroke/density; framebuffer'ы
// p5 по умолчанию автоследуют размеру канваса — пересоздавать их не нужно.
export function restoreGlModes(g) {
  g.pixelDensity(1);
  g.noStroke();
}
