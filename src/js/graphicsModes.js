// resizeCanvas() у p5.Graphics полностью сбрасывает 2D-контекст —
// после ЛЮБОГО resize обязательно восстановить режимы (AGENTS.md §4).
export function restoreGraphicsModes(g, p) {
  g.pixelDensity(1);
  g.angleMode(p.DEGREES);
  g.rectMode(p.CORNER);
  g.imageMode(p.CORNER);
  g.noStroke();
}
