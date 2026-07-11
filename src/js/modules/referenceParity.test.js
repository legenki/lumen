// Постоянный страж: дефолты ВСЕХ модулей Lumen байт-в-байт совпадают с
// reference/filtr/modules.js (реверс старого инструмента). Ломается при любом
// «улучшении» дефолтов — это намеренно: reference менять нельзя.
import { describe, it, expect } from 'vitest';
import { MODULES } from './index.js';
import { MODULES as REF } from '../../../reference/filtr/modules.js';

describe('reference defaults parity', () => {
  it('every Lumen module default matches reference byte-for-byte', () => {
    for (const [key, def] of Object.entries(MODULES)) {
      const ref = { ...REF[key].defaults };
      delete ref.__maskMembers; // поле инстанса в Lumen, не params (maskMedia, фаза 5 Task 7)
      expect(JSON.stringify(def.defaults), key).toBe(JSON.stringify(ref));
    }
  });
});
