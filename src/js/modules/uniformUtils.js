// LUMEN — хелперы транскрипции uniform'ов (дословная семантика старого кода:
// bundle-pretty.js:47526-47542 (hex→vec), 47321-47323 (упаковка градиента)).
// Все функции пишут в переданные буферы — zero-alloc в горячем цикле.

export const GRADIENT_MAX = 16; // MAX_GRADIENT_POINTS в fillGradient.frag:26

export function hexToRgba(hex, alpha, out) {
  const o = hex[0] === '#' ? 1 : 0;
  const short = hex.length - o === 3;
  const ch = (i) => parseInt(short ? hex[o + i] + hex[o + i] : hex.substr(o + i * 2, 2), 16);
  out[0] = ch(0) / 255;
  out[1] = ch(1) / 255;
  out[2] = ch(2) / 255;
  out[3] = alpha;
  return out;
}

export function radians(deg) {
  return (deg * Math.PI) / 180;
}

/** Пакует стопы градиента в 16-слотовые массивы шейдера; возвращает их число. */
export function packGradient(stops, timesOut, colorsOut) {
  timesOut.fill(0);
  colorsOut.fill(0);
  const n = Math.min(stops.length, GRADIENT_MAX);
  for (let i = 0; i < n; i++) {
    timesOut[i] = stops[i].time;
    colorsOut[i * 4] = stops[i].value.r / 255;
    colorsOut[i * 4 + 1] = stops[i].value.g / 255;
    colorsOut[i * 4 + 2] = stops[i].value.b / 255;
    colorsOut[i * 4 + 3] = stops[i].value.a;
  }
  return n;
}
