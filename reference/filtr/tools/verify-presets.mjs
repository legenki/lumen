// Verifies reference/filtr/presets.js against known preset inventory.
import { PRESETS } from '../presets.js';
import { MODULES } from '../modules.js';

// Names sourced from the displayName->var map at bundle-pretty.js:42063-42093
// (anchor: `"User Preset": "userPreset"`), in that map's order, excluding
// "User Preset" (that's the user's own slot, not a built-in data preset).
// NOTE: the plan's initial reconstruction had "Lofi Breezing"; the bundle
// map actually reads "Lo-Fi Breezing" -- corrected here per the plan's own
// instruction to fix discrepancies and note them.
const EXPECTED_NAMES = [
  'Avant-Garde Mirrors', 'Bioplastic Cell', 'Blazing Box', 'Braindance Loop',
  'Bubble Wrap', 'Chill Workflow', 'Chroma Modulation', 'Clay Rainbow Aesthetics',
  'Corrosive Spectrum Wave', 'Deadline Flexing', 'Gradient Plating', 'Hyper Ink',
  'Lo-Fi Breezing', 'Magic Branding', 'Metaphysics Pool', 'Molten Scars Relief',
  'Mosaic Reflection', 'Noir Carbon Imprint', 'Plasma Drift', 'Printed Memories',
  'Rad Workflow', 'Radiant Plastique', 'Reflective Stack', 'Soft Errors',
  'Soft Metal Stream', 'Temporal Portrait', 'Toxic Atmosphere', 'UV Alloy',
];

if (PRESETS.length !== EXPECTED_NAMES.length) {
  throw new Error(`Expected ${EXPECTED_NAMES.length} presets, got ${PRESETS.length}`);
}
const moduleKeys = new Set(Object.keys(MODULES));
for (const p of PRESETS) {
  if (p.toolId !== 'filtr-tool') throw new Error(`${p.name}: bad toolId`);
  if (typeof p.version !== 'number') throw new Error(`${p.name}: missing version`);
  if (!p.main?.cnv) throw new Error(`${p.name}: missing main.cnv`);
  if (!Array.isArray(p.modules)) throw new Error(`${p.name}: missing modules[]`);
  for (const m of p.modules) {
    if (!moduleKeys.has(m.name)) throw new Error(`${p.name}: unknown module "${m.name}"`);
    if (typeof m.ref !== 'string') throw new Error(`${p.name}: module without ref`);
  }
  if (!EXPECTED_NAMES.includes(p.name)) throw new Error(`Unexpected preset "${p.name}"`);
}
console.log(`OK: ${PRESETS.length} presets verified`);
