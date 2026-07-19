// Pure helper: where the static→animated split sits in a module stack.
// Kept free of shader/WebGL imports so unit tests can exercise it without Vite ?raw.
import { MODULES } from './modules/index.js';

/**
 * Index of the first enabled animated pass, or stack.length if all static.
 * Returns 0 (disable static cache) when an enabled mask sits before that split —
 * maskStack state cannot be cheaply snapshotted across frames.
 */
export function findStaticSplit(stack) {
  let split = stack.length;
  for (let i = 0; i < stack.length; i++) {
    const inst = stack[i];
    if (!inst.enabled) continue;
    if (inst.type === 'pass' && MODULES[inst.module]?.animated) {
      split = i;
      break;
    }
  }
  for (let i = 0; i < split; i++) {
    if (stack[i].enabled && stack[i].type === 'mask') return 0;
  }
  return split;
}
