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

describe('add / remove', () => {
  it('add() inserts a user entry with generated key and marks it ready synchronously', () => {
    const reg = createMediaRegistry({}, fakeLoader());
    const entry = reg.add({ url: 'blob:user-a', name: 'Photo.png', width: 640, height: 400 });
    expect(entry.key).toMatch(/^user_/);
    expect(entry.ready).toBe(true);
    expect(entry.name).toBe('Photo.png');
    expect(entry.res).toEqual([640, 400]);
    expect(reg.get(entry.key)).toBe(entry);
  });
  it('remove() drops the entry and calls revokeObjectURL for blob: urls only', () => {
    const revoked = [];
    const spy = { revokeObjectURL: (u) => revoked.push(u) };
    const reg = createMediaRegistry({}, fakeLoader(), { url: spy });
    const a = reg.add({ url: 'blob:a', name: 'A', width: 2, height: 2 });
    const b = reg.add({ url: 'https://foo/b.png', name: 'B', width: 2, height: 2 });
    reg.remove(a.key);
    reg.remove(b.key);
    expect(reg.get(a.key)).toBeUndefined();
    expect(revoked).toEqual(['blob:a']);
  });
  it('keys() lists all current entries', () => {
    const reg = createMediaRegistry({}, fakeLoader());
    reg.add({ url: 'blob:x', name: 'X', width: 1, height: 1 });
    expect(reg.keys()).toEqual(expect.arrayContaining([expect.stringMatching(/^user_/)]));
  });
});
