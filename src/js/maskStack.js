// LUMEN — mask-стек рендера: маска действует на N следующих пассов
// (дословная семантика bF/T8/vF: bundle-pretty.js:46951-46986; выключенный
// пасс тоже списывает заряд — 47622-47626). Запись: { id, bufName, left, tex }.

export function resetMaskStack(ctx) {
  ctx.maskStack.length = 0; // AGENTS.md §5: очистка без реаллокации
}

export function pushMask(ctx, entry) {
  ctx.maskStack.push(entry);
}

/** Верхняя запись с left > 0 или null. */
export function activeMask(ctx) {
  for (let i = ctx.maskStack.length - 1; i >= 0; i--) {
    if (ctx.maskStack[i].left > 0) return ctx.maskStack[i];
  }
  return null;
}

/** Списывает один заряд у активной маски; исчерпанные снимаются со стека. */
export function consumeMaskCharge(ctx, _wasUsed) {
  const top = activeMask(ctx);
  if (top) top.left -= 1;
  while (ctx.maskStack.length && ctx.maskStack[ctx.maskStack.length - 1].left <= 0) {
    ctx.maskStack.pop();
  }
}
