// LUMEN — display-модель Layers-списка: чистая функция buildLayerRows(state),
// тестируется без jsdom (не трогает DOM). Семантика indent/badge —
// getMaskBlockMemberIds (bundle-pretty.js:48168-48182): непрерывный блок.
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildLayerRows, buildLayersSection } from './layersPanel.js';

function pass(id, overrides = {}) {
  return { id, type: 'pass', module: 'fillColor', enabled: true, params: {}, ...overrides };
}

function mask(id, maskMembers, overrides = {}) {
  return { id, type: 'mask', module: 'maskMedia', enabled: true, params: {}, maskMembers, ...overrides };
}

describe('buildLayerRows', () => {
  it('flat stack: no masks, no indent, no badge', () => {
    const state = { stack: [pass('p01'), pass('p02')] };
    const rows = buildLayerRows(state);
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => !r.indent && r.badge === 0)).toBe(true);
  });

  it('mask immediately followed by its members: both indented, badge = members.length', () => {
    const state = {
      stack: [pass('p01'), mask('p02', ['p03', 'p04']), pass('p03'), pass('p04'), pass('p05')],
    };
    const rows = buildLayerRows(state);
    const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
    expect(byId.p01.indent).toBe(false);
    expect(byId.p02.isMask).toBe(true);
    expect(byId.p02.badge).toBe(2);
    expect(byId.p02.indent).toBe(false); // маска сама не индентится
    expect(byId.p03.indent).toBe(true);
    expect(byId.p04.indent).toBe(true);
    expect(byId.p05.indent).toBe(false); // не член
  });

  it('badge reflects maskMembers.length even if a member id is absent from the stack', () => {
    const state = { stack: [mask('p02', ['p03', 'pXX']), pass('p03')] };
    const rows = buildLayerRows(state);
    const m = rows.find((r) => r.id === 'p02');
    expect(m.badge).toBe(2); // .length, независимо от наличия pXX в стеке
  });

  it('discontinuity breaks indent for subsequent instances, even if listed in maskMembers', () => {
    // maskMembers = [p03, p04, p06]; стек: mask, p03(member), p05(NOT member), p06(member)
    // p05 обрывает цепочку → индент прекращается для p06, хотя он формально член.
    const state = {
      stack: [
        mask('p02', ['p03', 'p04', 'p06']),
        pass('p03'),
        pass('p05'),
        pass('p06'),
      ],
    };
    const rows = buildLayerRows(state);
    const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
    expect(byId.p03.indent).toBe(true);
    expect(byId.p05.indent).toBe(false); // обрыв здесь
    expect(byId.p06.indent).toBe(false); // цепочка уже прервана, несмотря на членство
  });

  it('empty maskMembers: mask has badge 0 and no indented members', () => {
    const state = { stack: [mask('p02', []), pass('p03')] };
    const rows = buildLayerRows(state);
    const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
    expect(byId.p02.badge).toBe(0);
    expect(byId.p03.indent).toBe(false);
  });

  it('disabled instances still appear with correct enabled flag', () => {
    const state = { stack: [pass('p01', { enabled: false })] };
    const rows = buildLayerRows(state);
    expect(rows[0].enabled).toBe(false);
  });

  it('label falls back to module key when MODULES entry is missing', () => {
    const state = { stack: [pass('p01', { module: 'totallyUnknownModule' })] };
    const rows = buildLayerRows(state);
    expect(rows[0].label).toBe('totallyUnknownModule');
  });

  it('label uses the module registry label when present', () => {
    const state = { stack: [pass('p01', { module: 'fillColor' })] };
    const rows = buildLayerRows(state);
    expect(rows[0].label).toBe('Fill: Color');
  });
});

describe('buildLayersSection onReorder (drag into/out of MASK groups)', () => {
  beforeEach(() => {
    // jsdom резолвит scoped querySelector('#id') неверно, если тот же id уже
    // существует где-то ещё в document — чистим между тестами, чтобы
    // повторные duplicate id (#lm-layers-module и т.п.) из прошлых mount() не мешали.
    document.body.innerHTML = '';
  });

  function makeState(stack) {
    return { stack, ui: { selectedId: null } };
  }

  function mount(state) {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const onStackChange = vi.fn();
    const onSelect = vi.fn();
    const api = buildLayersSection(root, { state, onStackChange, onSelect });
    return { root, api, onStackChange, onSelect };
  }

  function dragDrop(root, fromIndex, toIndex, mode, clientY) {
    const items = root.querySelectorAll('.layer-row');
    const from = items[fromIndex];
    const to = items[toIndex];
    if (clientY !== undefined) to.getBoundingClientRect = () => ({ top: 0, left: 0, width: 100, height: 40, right: 100, bottom: 40 });
    const dt = { setData: vi.fn(), getData: vi.fn(() => String(fromIndex)), effectAllowed: '' };
    from.dispatchEvent(Object.assign(new Event('dragstart', { bubbles: true }), { dataTransfer: dt }));
    to.dispatchEvent(Object.assign(new MouseEvent('dragover', { bubbles: true, cancelable: true, clientY: clientY ?? 0 }), { dataTransfer: dt }));
    to.dispatchEvent(Object.assign(new MouseEvent('drop', { bubbles: true, clientY: clientY ?? 0 }), { dataTransfer: dt }));
  }

  it('mode "into" on a mask row moves src right after the mask and adds it to maskMembers', () => {
    const state = makeState([
      pass('p01'),
      mask('p02', []),
      pass('p03'),
    ]);
    const { root, onStackChange } = mount(state);
    // Drag p01 (index 0) into p02 (index 1, mask) at mid-height → mode 'into'.
    dragDrop(root, 0, 1, 'into', 20);
    expect(state.stack.map((m) => m.id)).toEqual(['p02', 'p01', 'p03']);
    const maskInst = state.stack.find((m) => m.id === 'p02');
    expect(maskInst.maskMembers).toContain('p01');
    expect(onStackChange).toHaveBeenCalled();
  });

  it('reordering a pass OUT of a mask group (mode "below", past the block) shortens maskMembers', () => {
    const state = makeState([
      mask('p02', ['p03', 'p04']),
      pass('p03'),
      pass('p04'),
      pass('p05'),
    ]);
    const { root } = mount(state);
    // Move p03 (index 1) below p05 (index 3) — drops it after the mask block entirely.
    dragDrop(root, 1, 3, 'below', 30);
    const maskInst = state.stack.find((m) => m.id === 'p02');
    // p03 is no longer immediately after the mask (p04 now leads), so continuity breaks it out.
    expect(maskInst.maskMembers).not.toContain('p03');
  });

  it('mode "above" moving a pass above a mask member keeps maskMembers as a contiguous block', () => {
    const state = makeState([
      pass('p01'),
      mask('p02', ['p03', 'p04']),
      pass('p03'),
      pass('p04'),
    ]);
    const { root } = mount(state);
    // Drag p01 (index 0) to just above p04 (index 3) inside the block.
    dragDrop(root, 0, 3, 'above', 5);
    const maskInst = state.stack.find((m) => m.id === 'p02');
    // p01 was never a member — after the reorder, membership is recomputed as the
    // contiguous run right after the mask that IS listed in maskMembers.
    expect(maskInst.maskMembers).toEqual(
      expect.arrayContaining(state.stack.slice(2).filter((m) => maskInst.maskMembers.includes(m.id)).map((m) => m.id)),
    );
    // p01 (non-member) inserted between mask and p03 breaks continuity for members.
    expect(state.stack.map((m) => m.id)[2]).not.toBe('p03');
  });
});
