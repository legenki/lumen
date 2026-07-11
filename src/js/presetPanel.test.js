// LUMEN — тесты секции Presets (левая панель): snapshotPreset round-trip,
// Apply/Save As/Export/Import/Delete через DOM-события.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { snapshotPreset, buildPresetPanelSection } from './presetPanel.js';
import { createDefaultState } from './state.js';
import * as presetConvertModule from './presetConvert.js';
import * as presetIOModule from '../shared/utils/presetIO.js';

function pushPass(state, id, module = 'fillColor') {
  state.stack.push({ id, type: 'pass', module, enabled: true, params: {} });
}

function pushMask(state, id, maskMembers = []) {
  state.stack.push({ id, type: 'mask', module: 'maskMedia', enabled: true, params: {}, maskMembers });
}

describe('snapshotPreset', () => {
  it('produces one preset module per stack entry', () => {
    const state = createDefaultState();
    pushPass(state, 'p01');
    pushPass(state, 'p02');
    const preset = snapshotPreset(state, 'X');
    expect(preset.modules).toHaveLength(2);
    expect(preset.name).toBe('X');
    expect(preset.toolId).toBe('lumen');
  });

  it('includes __maskMembers in params for mask instances', () => {
    const state = createDefaultState();
    pushPass(state, 'p01');
    pushMask(state, 'p02', ['p01']);
    const preset = snapshotPreset(state, 'WithMask');
    const maskModule = preset.modules.find((m) => m.ref === 'p02');
    expect(maskModule.params.__maskMembers).toEqual(['p01']);
    const passModule = preset.modules.find((m) => m.ref === 'p01');
    expect(passModule.params.__maskMembers).toBeUndefined();
  });
});

describe('buildPresetPanelSection', () => {
  let root;
  let state;
  let onApply;

  beforeEach(() => {
    root = document.createElement('div');
    state = createDefaultState();
    onApply = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders a select populated with built-in presets', () => {
    buildPresetPanelSection(root, { state, onApply });
    const select = root.querySelector('#lm-preset-select');
    expect(select.querySelectorAll('option').length).toBeGreaterThan(0);
    expect(select.querySelector('optgroup[label="Built-in"]')).toBeTruthy();
    expect(select.querySelector('optgroup[label="User"]')).toBeFalsy();
  });

  it('Apply calls applyPresetToState with the selected built-in preset and triggers onApply', () => {
    const spy = vi.spyOn(presetConvertModule, 'applyPresetToState');
    buildPresetPanelSection(root, { state, onApply });
    root.querySelector('#lm-preset-apply').click();
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toBe(state);
    expect(onApply).toHaveBeenCalled();
  });

  it('Save As prompts for a name, pushes a snapshot into state.userPresets, and refreshes the select', () => {
    vi.stubGlobal('prompt', vi.fn(() => 'My Custom'));
    pushPass(state, 'p01');
    buildPresetPanelSection(root, { state, onApply });
    root.querySelector('#lm-preset-save').click();

    expect(state.userPresets).toHaveLength(1);
    expect(state.userPresets[0].name).toBe('My Custom');
    expect(onApply).toHaveBeenCalled();
    const select = root.querySelector('#lm-preset-select');
    expect(select.querySelector('optgroup[label="User"]')).toBeTruthy();
    expect(root.textContent).toContain('★ My Custom');
  });

  it('Save As does nothing when prompt is cancelled (returns null)', () => {
    vi.stubGlobal('prompt', vi.fn(() => null));
    buildPresetPanelSection(root, { state, onApply });
    root.querySelector('#lm-preset-save').click();
    expect(state.userPresets).toHaveLength(0);
    expect(onApply).not.toHaveBeenCalled();
  });

  it('Export downloads the current preset as JSON', () => {
    const spy = vi.spyOn(presetIOModule, 'downloadPresetJSON').mockImplementation(() => {});
    buildPresetPanelSection(root, { state, onApply });
    root.querySelector('#lm-preset-export').click();
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toMatch(/\.json$/);
  });

  it('Import accepts a valid preset and pushes it into state.userPresets', () => {
    const fakePreset = {
      toolId: 'filtr-tool', version: 2, name: 'Imported One',
      main: { cnv: { ratio: '1:1' } },
      modules: [{ ref: 'p01', name: 'fillColor', enabled: true, params: {} }],
    };
    vi.spyOn(presetIOModule, 'openPresetFile').mockImplementation((onLoad) => onLoad(fakePreset));
    buildPresetPanelSection(root, { state, onApply });
    root.querySelector('#lm-preset-import').click();

    expect(state.userPresets).toHaveLength(1);
    expect(state.userPresets[0].name).toBe('Imported One');
    expect(onApply).toHaveBeenCalled();
  });

  it('Import rejects a preset referencing an unknown module', () => {
    const badPreset = {
      toolId: 'filtr-tool', version: 2, name: 'Bad',
      main: {},
      modules: [{ ref: 'p01', name: 'notAModule', enabled: true, params: {} }],
    };
    vi.spyOn(presetIOModule, 'openPresetFile').mockImplementation((onLoad) => onLoad(badPreset));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    buildPresetPanelSection(root, { state, onApply });
    root.querySelector('#lm-preset-import').click();

    expect(state.userPresets).toHaveLength(0);
    expect(onApply).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('Import rejects malformed data without a modules array', () => {
    vi.spyOn(presetIOModule, 'openPresetFile').mockImplementation((onLoad) => onLoad({ foo: 'bar' }));
    buildPresetPanelSection(root, { state, onApply });
    root.querySelector('#lm-preset-import').click();
    expect(state.userPresets).toHaveLength(0);
    expect(onApply).not.toHaveBeenCalled();
  });

  it('Delete only removes user (★-prefixed) presets, leaving built-ins untouched', () => {
    vi.stubGlobal('prompt', vi.fn(() => 'ToDelete'));
    const panel = buildPresetPanelSection(root, { state, onApply });
    root.querySelector('#lm-preset-save').click(); // adds user preset, selects nothing new automatically
    expect(state.userPresets).toHaveLength(1);

    const select = root.querySelector('#lm-preset-select');
    // Selecting a built-in and attempting delete should be a no-op.
    select.value = select.querySelector('optgroup[label="Built-in"] option').value;
    root.querySelector('#lm-preset-delete').click();
    expect(state.userPresets).toHaveLength(1);

    // Now select the user preset and delete it.
    select.value = '★ ToDelete';
    root.querySelector('#lm-preset-delete').click();
    expect(state.userPresets).toHaveLength(0);
    panel.refill();
    expect(root.querySelector('optgroup[label="User"]')).toBeFalsy();
  });
});
