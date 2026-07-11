// Транскрипция пасса warpGrid (bundle-pretty.js:47476-47497).
// Модуль с uniforms(): использует шейдер без хука run().
import { radians, EASE } from './uniformUtils.js';
import { WRAP_MODES, WARP_GRID_MODES, WARP_GRID_FALLOFF_MODES } from './optionTables.js';

export function gridCellsForMode(p) {
  const mode = p.gridMode;
  if (mode === 0) return [p.gridCell, 1];
  if (mode === 1) return [p.gridCell, p.gridCell];
  return [p.gridCells.x, p.gridCells.y];
}

export function falloffFocusForMode(p) {
  const mode = p.gridMode;
  if (mode === 0) return [p.falloffFocus1D + 0.5, 0.5];
  return [p.falloffFocus2D.x + 0.5, p.falloffFocus2D.y + 0.5];
}

export const warpGrid = {
  key: 'warpGrid',
  label: 'Warp Grid',
  type: 'pass',
  defaults: {
    mix: 1,
    strength: 0.1,
    cellFeather: 0,
    gridMode: 1,
    gridCell: 16,
    gridCells: { x: 16, y: 16 },
    gridScale: 1,
    gridAngle: 0,
    falloffMode: 0,
    falloffRange: { min: 0, max: 1 },
    falloffFocus1D: 0,
    falloffFocus2D: { x: 0, y: 0 },
    wrapMode: 0,
  },
  controls: [
    {
      type: 'slider',
      path: 'mix',
      label: 'Pass Mix',
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      type: 'slider',
      path: 'strength',
      label: 'Strength',
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      type: 'slider',
      path: 'cellFeather',
      label: 'Cell Feather',
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      type: 'select',
      path: 'gridMode',
      label: 'Grid Mode',
      options: WARP_GRID_MODES,
    },
    {
      type: 'slider',
      path: 'gridCell',
      label: 'Grid Cell',
      min: 1,
      max: 64,
      step: 1,
      showIf: { key: 'gridMode', notEquals: 2 },
    },
    {
      type: 'centerPoint',
      path: 'gridCells',
      label: 'Grid Cells',
      axes: { x: 'X', y: 'Y' },
      showIf: { key: 'gridMode', equals: 2 },
    },
    {
      type: 'slider',
      path: 'gridScale',
      label: 'Grid Scale',
      min: 0,
      max: 2,
      step: 0.01,
    },
    {
      type: 'slider',
      path: 'gridAngle',
      label: 'Grid Angle',
      min: 0,
      max: 360,
      step: 1,
    },
    {
      type: 'select',
      path: 'falloffMode',
      label: 'Falloff Mode',
      options: WARP_GRID_FALLOFF_MODES,
    },
    {
      type: 'interval',
      path: 'falloffRange',
      label: 'Falloff Range',
      min: 0,
      max: 1,
      step: 0.01,
      showIf: { key: 'falloffMode', notEquals: 0 },
    },
    {
      type: 'slider',
      path: 'falloffFocus1D',
      label: 'Falloff Focus',
      min: -1,
      max: 1,
      step: 0.01,
      showIf: [
        { key: 'gridMode', equals: 0 },
        { key: 'falloffMode', notEquals: 0 },
      ],
    },
    {
      type: 'centerPoint',
      path: 'falloffFocus2D',
      label: 'Falloff Focus',
      axes: { x: 'X', y: 'Y' },
      showIf: [
        { key: 'gridMode', notEquals: 0 },
        { key: 'falloffMode', notEquals: 0 },
      ],
    },
    {
      type: 'select',
      path: 'wrapMode',
      label: 'Wrap Mode',
      options: WRAP_MODES,
    },
  ],
  gridCellsForMode,
  falloffFocusForMode,
  uniforms(p, env) {
    const w = env.width;
    const h = env.height;

    return {
      u_src: 0, // texunit
      u_aspect: w / h,
      u_maskUse: false,
      u_mask: 0, // placeholder
      u_mix: p.mix,
      u_strength: EASE.sineIn(p.strength),
      u_gridCells: gridCellsForMode(p),
      u_gridScale: p.gridScale,
      u_gridAngle: radians(p.gridAngle),
      u_blendEdge: p.cellFeather,
      u_falloffMode: p.falloffMode,
      u_falloffRange: [p.falloffRange.min, p.falloffRange.max],
      u_falloffFocus: falloffFocusForMode(p),
      u_wrapMode: p.wrapMode,
    };
  },
};
