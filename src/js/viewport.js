// LUMEN — центрирование буфера в рабочей области между двумя панелями
// (спека §3: 85% доступного пространства; адаптация формулы AGENTS.md §3
// под двухпанельный layout).

export const PANEL_LEFT = 290; // 260 панель + 20 margin + 10 зазор (AGENTS.md §3)
export const PANEL_RIGHT = 290;
export const FIT = 0.85;

export function computeViewport({ winW, winH, bufW, bufH }, out = {}) {
  const availW = winW - PANEL_LEFT - PANEL_RIGHT;
  const availH = winH;
  const scale = Math.min(availW / bufW, availH / bufH) * FIT;
  out.w = bufW * scale;
  out.h = bufH * scale;
  out.x = PANEL_LEFT + (availW - out.w) / 2;
  out.y = (availH - out.h) / 2;
  return out;
}
