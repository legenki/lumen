import { describe, it, expect } from 'vitest';
import { createMediaRegistry } from './media.js';

function fakeLoader(fail = new Set()) {
  return (url, ok, err) => {
    setTimeout(() => {
      if (fail.has(url)) err(new Error('404'));
      else ok({ width: 64, height: 32 }); // как p5.Image
    }, 0);
  };
}

describe('createMediaRegistry', () => {
  it('loads sources and exposes ready entries with resolution', async () => {
    const reg = createMediaRegistry({ img0: '/a.webp', text0: '/b.webp' }, fakeLoader());
    await reg.whenReady();
    const e = reg.get('text0');
    expect(e.ready).toBe(true);
    expect(e.res).toEqual([64, 32]);
    expect(e.tex).toBeTruthy();
  });
  it('marks failed loads as not ready without throwing', async () => {
    const reg = createMediaRegistry({ img0: '/a.webp' }, fakeLoader(new Set(['/a.webp'])));
    await reg.whenReady();
    expect(reg.get('img0').ready).toBe(false);
  });
  it('returns undefined for unknown keys', async () => {
    const reg = createMediaRegistry({}, fakeLoader());
    await reg.whenReady();
    expect(reg.get('nope')).toBeUndefined();
  });
});
