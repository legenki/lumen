// LUMEN — обвязка кнопки Export as MP4 поверх вендоренного exportMedia.exportMP4
// (фаза 6, задача 5). Вынесено в отдельный модуль, чтобы main.js (с side-effect
// импортами p5/registerSW/DOM) не мешал юнит-тестировать обвязку напрямую.
import { exportMP4 } from '../shared/utils/exportMedia.js';

/**
 * Pure helper for the MP4-export button: wires api/state/recVideo into
 * exportMedia.exportMP4 with lumen's buffer as the render/composite target.
 * @param {object} api - onReady API: { getP, getBuffer, scheduler }
 * @param {object} state - app state: { cnv, rec }
 * @param {object} recVideoState - { active, seconds }
 * @param {object} [deps] - injectable deps, defaults to real exportMP4
 * @param {Function} [deps.exportMP4]
 * @param {Function} setStatus - (msg: string) => void, footer status line
 */
export function startMp4Export(api, state, recVideoState, setStatus, deps = { exportMP4 }) {
  if (!api) return undefined;
  const p = api.getP();
  const glc = api.getBuffer();
  const wasAnimating = api.scheduler.isAnimating();
  return deps.exportMP4({
    p,
    prefix: 'lumen',
    cnv: state.cnv,
    rec: state.rec,
    recVideo: recVideoState,
    drawComposite: () => { p.redraw(); },
    getSize: () => ({ w: glc.width, h: glc.height }),
    getCanvas: () => glc.canvas,
    setStatus,
    onDone: () => {
      api.scheduler.setAnimating(wasAnimating);
      api.scheduler.requestRender();
    },
  });
}
