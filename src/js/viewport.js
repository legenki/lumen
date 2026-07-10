// LUMEN — центрирование буфера в рабочей области между двумя панелями
// (спека §3: 85% доступного пространства; адаптация формулы AGENTS.md §3
// под двухпанельный layout).

export const PANEL_LEFT = 290; // 260 панель + 20 margin + 10 зазор (AGENTS.md §3)
export const PANEL_RIGHT = 290;
export const FIT = 0.85;

export function computeViewport({ winW, winH, bufW, bufH }) {
  const availW = winW - PANEL_LEFT - PANEL_RIGHT;
  const availH = winH;
  const scale = Math.min(availW / bufW, availH / bufH) * FIT;
  const w = bufW * scale;
  const h = bufH * scale;
  return {
    x: PANEL_LEFT + (availW - w) / 2,
    y: (availH - h) / 2,
    w,
    h,
  };
}
