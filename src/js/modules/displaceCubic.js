// Транскрипция пасса displaceCubic (bundle-pretty.js:47198-47214).
import { radians } from './uniformUtils.js';
import { WRAP_MODES } from './optionTables.js';

const U = {
  u_srcRes: [0, 0],
  u_tileXY: [0, 0],
  u_ampXY: [0, 0],
  u_aspect: 0,
  u_angle: 0,
  u_time: 0,
  u_speedXY: [0, 0],
  u_phase: 0,
  u_wrapMode: 0,
};

export const displaceCubic = {
  key: 'displaceCubic',
  label: 'Displace: Cubic Grid',
  type: 'pass',
  defaults: {
    amp: { x: 0.7, y: 0.7 },
    tile: { x: 8, y: 8 },
    angle: 0,
    phase: 0,
    cycle: { x: 0, y: 0 },
    wrapMode: 0,
  },
  controls: [
    {
      type: 'slider',
      path: 'amp.x',
      label: 'Amplify X',
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      type: 'slider',
      path: 'amp.y',
      label: 'Amplify Y',
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      type: 'slider',
      path: 'tile.x',
      label: 'Tiles X',
      min: 1,
      max: 128,
      step: 1,
    },
    {
      type: 'slider',
      path: 'tile.y',
      label: 'Tiles Y',
      min: 1,
      max: 128,
      step: 1,
    },
    { type: 'slider', path: 'angle', label: 'Grid Rotation', min: -180, max: 180, step: 1 },
    { type: 'slider', path: 'phase', label: 'Phase Shift', min: 0, max: 1, step: 0.01 },
    {
      type: 'slider',
      path: 'cycle.x',
      label: 'Cycles X',
      min: -10,
      max: 10,
      step: 0.1,
    },
    {
      type: 'slider',
      path: 'cycle.y',
      label: 'Cycles Y',
      min: -10,
      max: 10,
      step: 0.1,
    },
    { type: 'select', path: 'wrapMode', label: 'Wrapping Mode', options: WRAP_MODES },
  ],
  uniforms(p, env) {
    U.u_srcRes[0] = env.width;
    U.u_srcRes[1] = env.height;
    U.u_tileXY[0] = p.tile.x;
    U.u_tileXY[1] = p.tile.y;
    U.u_ampXY[0] = p.amp.x;
    U.u_ampXY[1] = p.amp.y;
    U.u_aspect = p.aspect || 0;
    U.u_angle = radians(p.angle);
    U.u_time = env.time;
    U.u_speedXY[0] = p.cycle.x;
    U.u_speedXY[1] = p.cycle.y;
    U.u_phase = p.phase;
    U.u_wrapMode = p.wrapMode;
    return U;
  },
};
