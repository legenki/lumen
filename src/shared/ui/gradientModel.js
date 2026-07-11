// gradientModel.js — чистая модель мультистопового градиента.
// Контракт данных (пайплайн Lumen, packGradient):
// [{ time: 0..1, value: { r: 0-255, g: 0-255, b: 0-255, a: 0-1 } }], sorted.
export const GRADIENT_MIN_STOPS = 2;
export const GRADIENT_MAX_STOPS = 16;

export function sortStops(stops) {
  // стабильная сортировка по time
  const indexed = stops.map((s, i) => [s, i]);
  indexed.sort((a, b) => a[0].time - b[0].time || a[1] - b[1]);
  for (let i = 0; i < stops.length; i++) stops[i] = indexed[i][0];
  return stops;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Цвет градиента в точке t (линейная интерполяция соседей). */
export function sampleAt(stops, t) {
  if (t <= stops[0].time) return { ...stops[0].value };
  const last = stops[stops.length - 1];
  if (t >= last.time) return { ...last.value };
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (t >= a.time && t <= b.time) {
      const k = b.time === a.time ? 0 : (t - a.time) / (b.time - a.time);
      return {
        r: lerp(a.value.r, b.value.r, k),
        g: lerp(a.value.g, b.value.g, k),
        b: lerp(a.value.b, b.value.b, k),
        a: lerp(a.value.a, b.value.a, k),
      };
    }
  }
  return { ...last.value };
}

/** Вставляет стоп в t с интерполированным цветом; возвращает его индекс или -1. */
export function addStop(stops, t) {
  if (stops.length >= GRADIENT_MAX_STOPS) return -1;
  const time = Math.min(1, Math.max(0, t));
  stops.push({ time, value: sampleAt(stops, time) });
  sortStops(stops);
  return stops.findIndex((s) => s.time === time);
}

/** Удаляет стоп по индексу; false если стопов минимум. */
export function removeStop(stops, index) {
  if (stops.length <= GRADIENT_MIN_STOPS) return false;
  stops.splice(index, 1);
  return true;
}

/** Двигает стоп по времени (кламп 0..1), пересортировывает; новый индекс. */
export function moveStop(stops, index, t) {
  const stop = stops[index];
  stop.time = Math.min(1, Math.max(0, t));
  sortStops(stops);
  return stops.indexOf(stop);
}

export function stopsToCss(stops) {
  return stops
    .map((s) => `rgba(${Math.round(s.value.r)},${Math.round(s.value.g)},${Math.round(s.value.b)},${s.value.a}) ${s.time * 100}%`)
    .join(', ');
}
