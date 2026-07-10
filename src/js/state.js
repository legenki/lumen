// LUMEN — единый источник истины (спека §2, дефолты старого инструмента:
// reference/filtr/architecture.md §2; таблицы Sc/d4 из bundle-pretty.js:39188-39245).
// Persisted: cnv, rec, stack. Runtime/ui не сериализуются.

export const SCHEMA_VERSION = 1;

// Дословно таблица Sc старого инструмента (bundle-pretty.js:39188-39200).
export const RATIO_TYPES = {
  '2:1': '2:1', '16:9': '16:9', '3:2': '3:2', '4:3': '4:3', '5:4': '5:4',
  '1:1': '1:1', '4:5': '4:5', '3:4': '3:4', '2:3': '2:3', '9:16': '9:16', '1:2': '1:2',
};

// Дословно таблица d4 (базовые разрешения буфера, bundle-pretty.js:39201-39245).
export const RATIO_BASE_SIZE = {
  '2:1': { width: 480, height: 240 },
  '16:9': { width: 640, height: 360 },
  '3:2': { width: 480, height: 320 },
  '4:3': { width: 480, height: 360 },
  '5:4': { width: 600, height: 480 },
  '1:1': { width: 480, height: 480 },
  '4:5': { width: 480, height: 600 },
  '3:4': { width: 360, height: 480 },
  '2:3': { width: 320, height: 480 },
  '9:16': { width: 360, height: 640 },
  '1:2': { width: 240, height: 480 },
};

export function bufferSize(cnv) {
  const base = RATIO_BASE_SIZE[cnv.ratio] || RATIO_BASE_SIZE['1:1'];
  const k = cnv.scale.value;
  return { width: Math.round(base.width * k), height: Math.round(base.height * k) };
}

export function createDefaultState() {
  return {
    // --- Persisted ---
    cnv: {
      ratio: '1:1',
      animation: true,
      scale: { value: 2.5, min: 2, max: 8, step: 0.25 },
    },
    rec: {
      preset: 'mp4-web',
      frameRate: 60,
      length: { value: 10, min: 1, max: 60 },
      quality: 0.95,
      bitrate: 50,
      h264: 20,
    },
    stack: [], // [{ id, type: 'pass'|'mask', module, enabled, params, maskMembers? }]
    // --- Не сериализуется ---
    ui: { selectedId: null },
    runtime: { frame: 0, buffer: null, needsRender: true },
  };
}

const PERSISTED = ['cnv', 'rec', 'stack'];

export function serializeState(state) {
  const snap = { v: SCHEMA_VERSION };
  for (const key of PERSISTED) snap[key] = structuredClone(state[key]);
  return snap;
}

/**
 * Восстанавливает snapshot поверх state. Неизвестные поля игнорируются;
 * отсутствующие секции оставляют дефолты. Возвращает false (state не тронут),
 * если версия схемы не совпадает.
 */
export function restoreState(state, snap) {
  if (!snap || snap.v !== SCHEMA_VERSION) return false;
  for (const key of PERSISTED) {
    if (!(key in snap)) continue;
    if (key === 'stack') {
      state.stack = Array.isArray(snap.stack) ? structuredClone(snap.stack) : [];
    } else {
      mergeKnown(state[key], snap[key]);
    }
  }
  return true;
}

// Мердж только по ключам, уже существующим в target (отбрасывает неизвестное —
// в отличие от shared deepMerge, который копирует всё; см. state.test.js).
function mergeKnown(target, source) {
  if (typeof source !== 'object' || source === null) return;
  for (const key of Object.keys(source)) {
    if (!(key in target)) continue;
    const t = target[key];
    const s = source[key];
    if (typeof t === 'object' && t !== null && !Array.isArray(t)
        && typeof s === 'object' && s !== null && !Array.isArray(s)) {
      mergeKnown(t, s);
    } else if (s !== undefined) {
      target[key] = structuredClone(s);
    }
  }
}
