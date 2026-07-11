import { describe, it, expect } from 'vitest';
import { resetMaskStack, pushMask, activeMask, consumeMaskCharge } from './maskStack.js';

function ctx() {
  return { maskStack: [], releasedBufs: [] };
}

describe('mask stack (bF/T8/vF, bundle 46951-46986)', () => {
  it('pushMask + activeMask: верхняя запись с left>0', () => {
    const c = ctx();
    pushMask(c, { id: 'p02', bufName: 'p02', left: 2, tex: 'TEX' });
    expect(activeMask(c)).toMatchObject({ id: 'p02', tex: 'TEX' });
  });
  it('consumeMaskCharge списывает заряд и снимает маску на нуле', () => {
    const c = ctx();
    pushMask(c, { id: 'p02', bufName: 'p02', left: 2, tex: 'T' });
    consumeMaskCharge(c, true);
    expect(activeMask(c)).toBeTruthy(); // left 1
    consumeMaskCharge(c, true);
    expect(activeMask(c)).toBeNull(); // снята
    expect(c.maskStack).toHaveLength(0);
  });
  it('заряд списывается и когда пасс шёл без маски (used=false), как в эталоне', () => {
    const c = ctx();
    pushMask(c, { id: 'p02', bufName: 'p02', left: 1, tex: 'T' });
    consumeMaskCharge(c, false);
    expect(activeMask(c)).toBeNull();
  });
  it('вложенный push: активна верхняя', () => {
    const c = ctx();
    pushMask(c, { id: 'a', bufName: 'a', left: 3, tex: 'A' });
    pushMask(c, { id: 'b', bufName: 'b', left: 1, tex: 'B' });
    expect(activeMask(c).id).toBe('b');
    consumeMaskCharge(c, true);
    expect(activeMask(c).id).toBe('a');
  });
  it('resetMaskStack очищает без реаллокации', () => {
    const c = ctx();
    const ref = c.maskStack;
    pushMask(c, { id: 'a', bufName: 'a', left: 1, tex: 'A' });
    resetMaskStack(c);
    expect(c.maskStack).toHaveLength(0);
    expect(c.maskStack).toBe(ref);
  });
});
