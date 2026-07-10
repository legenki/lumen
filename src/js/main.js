import p5 from 'p5';
import { registerSW } from 'virtual:pwa-register';
import { createDefaultState } from './state.js';
import { lumenSketch } from './app.js';

registerSW({
  onOfflineReady() {
    console.log('[lumen] ready to work offline');
  },
});

const state = createDefaultState();
window.__lumenState = state; // отладка в консоли; не API

const container = document.getElementById('lumen-canvas');
new p5((p) => lumenSketch(p, {
  state,
  onReady(api) {
    window.__lumenApi = api; // временно до Task 7 (UI-встройка)
  },
}), container);

export { state };
