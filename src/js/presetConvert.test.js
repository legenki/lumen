import { describe, it, expect } from 'vitest';
import { convertOldPreset, applyPresetToState } from './presetConvert.js';
import { PRESETS } from './presets.js';
import { MODULES } from './modules/index.js';
import { createDefaultState } from './state.js';

describe('convertOldPreset', () => {
  it('converts modules[] to stack instances with params over defaults', () => {
    const preset = PRESETS.find((p) => p.name === 'Gradient Plating');
    const res = convertOldPreset(preset);
    expect(res.stack.length).toBe(preset.modules.length);
    const first = res.stack[0];
    expect(first.module).toBe(preset.modules[0].name);
    expect(first.id).toBe(preset.modules[0].ref);
    expect(first.enabled).toBe(preset.modules[0].enabled);
    // параметры пресета поверх дефолтов: отсутствующие в пресете ключи — из defaults
    for (const key of Object.keys(MODULES[first.module].defaults)) {
      expect(first.params[key]).not.toBeUndefined();
    }
  });

  it('maps mask modules: type mask + maskMembers from __maskMembers', () => {
    const withMask = PRESETS.find((p) => p.modules.some((m) => m.name === 'maskMedia'));
    const res = convertOldPreset(withMask);
    const mask = res.stack.find((m) => m.module === 'maskMedia');
    expect(mask.type).toBe('mask');
    expect(Array.isArray(mask.maskMembers)).toBe(true);
    expect('__maskMembers' in mask.params).toBe(false);
  });

  it('carries cnv ratio/scale when present', () => {
    const preset = PRESETS.find((p) => p.main?.cnv?.ratio);
    const res = convertOldPreset(preset);
    expect(res.cnv.ratio).toBe(preset.main.cnv.ratio);
  });

  it('every preset converts without unknown modules', () => {
    for (const p of PRESETS) {
      const res = convertOldPreset(p);
      for (const inst of res.stack) {
        expect(MODULES[inst.module], `${p.name}: ${inst.module}`).toBeTruthy();
      }
    }
  });

  it('applyPresetToState replaces stack in place and resets selection', () => {
    const s = createDefaultState();
    s.ui.selectedId = 'zzz';
    const stackRef = s.stack;
    const preset = PRESETS.find((p) => p.name === 'Gradient Plating');
    applyPresetToState(s, preset);
    expect(s.stack).toBe(stackRef); // на месте, без реаллокации
    expect(s.stack.length).toBe(preset.modules.length);
    expect(s.ui.selectedId).toBeNull();
    if (preset.main?.cnv?.ratio) expect(s.cnv.ratio).toBe(preset.main.cnv.ratio);
  });
});
