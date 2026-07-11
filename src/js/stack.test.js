import { describe, it, expect } from 'vitest';
import {
  createModuleInstance, addModule, removeModule, getRenderPasses,
  duplicateModule, moveModule,
} from './stack.js';
import { createDefaultState } from './state.js';
import { MODULES } from './modules/index.js';

describe('createModuleInstance', () => {
  it('builds an instance with cloned defaults and unique id', () => {
    const a = createModuleInstance('fillColor', ['p01']);
    expect(a).toMatchObject({ id: 'p02', type: 'pass', module: 'fillColor', enabled: true });
    expect(a.params).toEqual(MODULES.fillColor.defaults);
    a.params.mix = 0.5;
    expect(MODULES.fillColor.defaults.mix).toBe(1); // дефолты не мутируются
  });
  it('generates sequential ids p01, p02… skipping existing', () => {
    expect(createModuleInstance('fillColor', []).id).toBe('p01');
    expect(createModuleInstance('fillColor', ['p01', 'p03']).id).toBe('p04');
  });
  it('throws on unknown module key', () => {
    expect(() => createModuleInstance('nope', [])).toThrow(/Unknown module/);
  });
});

describe('addModule / removeModule', () => {
  it('appends to state.stack and removes by id', () => {
    const s = createDefaultState();
    const inst = addModule(s, 'fillGradient');
    expect(s.stack).toHaveLength(1);
    expect(s.stack[0]).toBe(inst);
    removeModule(s, inst.id);
    expect(s.stack).toHaveLength(0);
  });
});

describe('getRenderPasses', () => {
  it('returns only enabled pass-type entries, preserving order', () => {
    const s = createDefaultState();
    const a = addModule(s, 'fillColor');
    const b = addModule(s, 'fillGradient');
    b.enabled = false;
    const c = addModule(s, 'fillNoise');
    expect(getRenderPasses(s.stack).map((m) => m.id)).toEqual([a.id, c.id]);
  });
});

describe('duplicateModule', () => {
  it('clones instance with fresh id right after the original', () => {
    const s = createDefaultState();
    const a = addModule(s, 'fillColor');
    const b = addModule(s, 'fillNoise');
    a.params.mix = 0.42;
    const dup = duplicateModule(s, a.id);
    expect(s.stack.map((m) => m.id)).toEqual([a.id, dup.id, b.id]);
    expect(dup.module).toBe('fillColor');
    expect(dup.params.mix).toBe(0.42);
    dup.params.mix = 1;
    expect(a.params.mix).toBe(0.42); // независимая копия
  });
});

describe('moveModule', () => {
  it('moves instance between indices', () => {
    const s = createDefaultState();
    const a = addModule(s, 'fillColor');
    const b = addModule(s, 'fillGradient');
    const c = addModule(s, 'fillNoise');
    moveModule(s, 0, 2);
    expect(s.stack.map((m) => m.id)).toEqual([b.id, c.id, a.id]);
  });
});
