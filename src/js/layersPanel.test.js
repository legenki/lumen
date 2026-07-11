// LUMEN — display-модель Layers-списка: чистая функция buildLayerRows(state),
// тестируется без jsdom (не трогает DOM). Семантика indent/badge —
// getMaskBlockMemberIds (bundle-pretty.js:48168-48182): непрерывный блок.
import { describe, it, expect } from 'vitest';
import { buildLayerRows } from './layersPanel.js';

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
