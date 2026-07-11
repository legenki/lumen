// LUMEN — операции над стеком модулей (спека §2: stack — ядро модели).
// Формат инстанса: { id, type: 'pass'|'mask', module, enabled, params }.
import { MODULES } from './modules/index.js';

// Семантика id — максимум+1 (ref'ы монотонны, как в пресетах старого кода):
// nextId(['p01','p03']) → 'p04', а не «первый свободный» p02.
function nextId(existingIds) {
  let max = 0;
  for (const id of existingIds) {
    const m = /^p(\d+)$/.exec(id);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `p${String(max + 1).padStart(2, '0')}`;
}

export function createModuleInstance(moduleKey, existingIds) {
  const def = MODULES[moduleKey];
  if (!def) throw new Error(`Unknown module: ${moduleKey}`);
  const inst = {
    id: nextId(existingIds),
    type: def.type,
    module: moduleKey,
    enabled: true,
    params: structuredClone(def.defaults),
  };
  // maskMembers — поле инстанса (не params): список id пассов, на которые
  // действует эта маска (см. maskMedia.js / pipeline.js pushMask).
  if (def.type === 'mask') inst.maskMembers = [];
  return inst;
}

export function addModule(state, moduleKey) {
  const inst = createModuleInstance(moduleKey, state.stack.map((m) => m.id));
  state.stack.push(inst);
  return inst;
}

export function removeModule(state, id) {
  const i = state.stack.findIndex((m) => m.id === id);
  if (i >= 0) state.stack.splice(i, 1);
}

/** Клонирует инстанс (независимые params) и вставляет копию сразу после оригинала. */
export function duplicateModule(state, id) {
  const i = state.stack.findIndex((m) => m.id === id);
  if (i < 0) return null;
  const src = state.stack[i];
  const inst = {
    ...structuredClone(src),
    id: nextId(state.stack.map((m) => m.id)),
  };
  state.stack.splice(i + 1, 0, inst);
  return inst;
}

/** Перемещает инстанс со fromIndex на toIndex (drag-reorder в LayerList). */
export function moveModule(state, fromIndex, toIndex) {
  const [inst] = state.stack.splice(fromIndex, 1);
  state.stack.splice(toIndex, 0, inst);
}

/** Включённые цветовые пассы в порядке стека (маски — фаза 5). */
export function getRenderPasses(stack) {
  return stack.filter((m) => m.enabled && m.type === 'pass');
}
