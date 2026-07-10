// LUMEN — локальные дефолтные ассеты (offline-first, AGENTS.md §7).
// Имена и состав — из старого инструмента (reference/filtr/architecture.md §4);
// скопированы FULL-варианты. Загрузка — фаза 4 (media.js).
const BASE = `${import.meta.env.BASE_URL}assets/lumen/media`;

export const DEFAULT_MEDIA = {
  img0: `${BASE}/img0.webp`,
  img1: `${BASE}/img1.webp`,
  img2: `${BASE}/img2.webp`,
  img3: `${BASE}/img3.webp`,
  text0: `${BASE}/text0.webp`,
  text1: `${BASE}/text1.webp`,
  text2: `${BASE}/text2.webp`,
  text3: `${BASE}/text3.webp`,
  text4: `${BASE}/text4.webp`,
  text5: `${BASE}/text5.webp`,
  noise0: `${BASE}/noise0.webp`,
  shape0: `${BASE}/shape0.webp`,
  shape1: `${BASE}/shape1.webp`,
  shape2: `${BASE}/shape2.webp`,
  shape3: `${BASE}/shape3.webp`,
  shape4: `${BASE}/shape4.webp`,
  'gradient-circle': `${BASE}/gradient-circle.webp`,
  'gradient-linear': `${BASE}/gradient-linear.webp`,
  'gradient-reflect': `${BASE}/gradient-reflect.webp`,
  'gradient-tile': `${BASE}/gradient-tile.webp`,
  white: `${BASE}/white.webp`,
};

export const BLUE_NOISE_URL = `${BASE}/blue-noise-256x256.png`;
