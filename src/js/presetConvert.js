// LUMEN — конвертация пресетов старого формата (filtr-tool v2: {toolId, version,
// name, main:{cnv,rec}, modules:[{ref,name,enabled,params}]}) в state Lumen.
// Значения params пресета ложатся ПОВЕРХ дефолтов модуля (в пресетах не все ключи).
import { MODULES } from './modules/index.js';

export function convertOldPreset(preset) {
  const stack = preset.modules.map((m) => {
    const def = MODULES[m.name];
    if (!def) throw new Error(`Unknown module in preset: ${m.name}`);
    const params = structuredClone(def.defaults);
    const src = { ...m.params };
    // Members маски живут на УРОВНЕ ИНСТАНСА как `members` (формат live-Export
    // из filtr-tool). В vendored reference/filtr/presets.js — тот же ключ.
    // Обратная совместимость: старые Lumen-снимки клали params.__maskMembers.
    const rawMembers = Array.isArray(m.members)
      ? m.members
      : Array.isArray(src.__maskMembers)
        ? src.__maskMembers
        : [];
    const maskMembers = [...rawMembers];
    delete src.__maskMembers;
    deepAssign(params, src);
    const inst = {
      id: m.ref,
      type: def.type,
      module: m.name,
      enabled: m.enabled !== false,
      params,
    };
    if (def.type === 'mask') inst.maskMembers = maskMembers;
    return inst;
  });
  const cnv = {};
  if (preset.main?.cnv?.ratio) cnv.ratio = preset.main.cnv.ratio;
  if (preset.main?.cnv?.scale?.value != null) cnv.scaleValue = preset.main.cnv.scale.value;
  if (typeof preset.main?.cnv?.animation === 'boolean') cnv.animation = preset.main.cnv.animation;
  return { stack, cnv };
}

export function applyPresetToState(state, preset) {
  const { stack, cnv } = convertOldPreset(preset);
  state.stack.length = 0;
  state.stack.push(...stack);
  if (cnv.ratio) state.cnv.ratio = cnv.ratio;
  if (cnv.scaleValue != null) state.cnv.scale.value = cnv.scaleValue;
  if (typeof cnv.animation === 'boolean') state.cnv.animation = cnv.animation;
  state.ui.selectedId = null;
}

// Рекурсивное наложение значений пресета поверх дефолтов (массивы — заменой).
function deepAssign(target, src) {
  for (const key of Object.keys(src)) {
    const s = src[key];
    if (
      s && typeof s === 'object' && !Array.isArray(s) &&
      target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])
    ) {
      deepAssign(target[key], s);
    } else {
      target[key] = structuredClone(s);
    }
  }
}
