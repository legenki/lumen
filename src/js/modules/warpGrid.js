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

// u_src / u_mask / u_maskUse ставит pipeline.runPass — НЕ кладём их сюда.
// Раньше u_src:0 / u_mask:0 перезаписывали текстуры после setUniform и p5
// сыпал "You're trying to use a number as the data for a texture".
const U = {
  u_aspect: 0,
  u_mix: 0,
  u_strength: 0,
  u_gridCells: [0, 0],
  u_gridScale: 0,
  u_gridAngle: 0,
  u_blendEdge: 0,
  u_falloffMode: 0,
  u_falloffRange: [0, 0],
  u_falloffFocus: [0, 0],
  u_wrapMode: 0,
};

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
      label: 'Effect Mix',
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      type: 'slider',
      path: 'strength',
      label: 'Effect Strength',
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      type: 'slider',
      path: 'cellFeather',
      label: 'Cell Smoothing',
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
      label: 'Grid Cells',
      min: 2,
      max: 128,
      step: 1,
      showIf: { path: 'gridMode', notEquals: 2 },
    },
    {
      type: 'centerPoint',
      path: 'gridCells',
      label: 'Grid Cells',
      axes: {
        x: { min: 2, max: 128, step: 1 },
        y: { min: 2, max: 128, step: 1 },
      },
      showIf: { path: 'gridMode', equals: 2 },
    },
    {
      type: 'slider',
      path: 'gridScale',
      label: 'Grid Scale',
      min: 0.5,
      max: 2,
      step: 0.01,
    },
    {
      type: 'slider',
      path: 'gridAngle',
      label: 'Grid Rotation',
      min: -180,
      max: 180,
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
      showIf: { path: 'falloffMode', notEquals: 0 },
    },
    {
      type: 'slider',
      path: 'falloffFocus1D',
      label: 'Falloff Focus',
      min: -0.5,
      max: 0.5,
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
      axes: {
        x: { min: -0.5, max: 0.5, step: 0.01 },
        y: { min: -0.5, max: 0.5, step: 0.01 },
      },
      showIf: [
        { key: 'gridMode', notEquals: 0 },
        { key: 'falloffMode', notEquals: 0 },
      ],
    },
    {
      type: 'select',
      path: 'wrapMode',
      label: 'Wrapping Mode',
      options: WRAP_MODES,
    },
  ],
  gridCellsForMode,
  falloffFocusForMode,
  uniforms(p, env) {
    U.u_aspect = env.width / env.height;
    U.u_mix = p.mix;
    U.u_strength = EASE.sineIn(p.strength);
    const cells = gridCellsForMode(p);
    U.u_gridCells[0] = cells[0];
    U.u_gridCells[1] = cells[1];
    U.u_gridScale = p.gridScale;
    U.u_gridAngle = radians(p.gridAngle);
    U.u_blendEdge = p.cellFeather;
    U.u_falloffMode = p.falloffMode;
    U.u_falloffRange[0] = p.falloffRange.min;
    U.u_falloffRange[1] = p.falloffRange.max;
    const focus = falloffFocusForMode(p);
    U.u_falloffFocus[0] = focus[0];
    U.u_falloffFocus[1] = focus[1];
    U.u_wrapMode = p.wrapMode;
    return U;
  },
};
