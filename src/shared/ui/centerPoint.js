// centerPoint.js — 2D-джойстик для парных параметров {x, y} (Center Point,
// Position Offset). Ось X: лево→право = min→max; ось Y: верх→низ = min→max
// (экранные координаты; сверено с эталоном filtr-tool при интеграции Lumen).
export function createCenterPoint({ container, label, axes, getValue, onChange }) {
  const wrap = document.createElement('div');
  wrap.className = 'parameter-row center-point';
  wrap.innerHTML = `
    <div class="parameter-header"><span class="parameter-label"></span></div>
    <div class="center-point-body">
      <div class="center-point-pad"><div class="center-point-knob"></div></div>
      <div class="center-point-nums">
        <input type="number" class="grafema-num-input" data-axis="x">
        <input type="number" class="grafema-num-input" data-axis="y">
      </div>
    </div>`;
  wrap.querySelector('.parameter-label').textContent = label;
  container.appendChild(wrap);

  const pad = wrap.querySelector('.center-point-pad');
  const knob = wrap.querySelector('.center-point-knob');
  const numX = wrap.querySelector('input[data-axis="x"]');
  const numY = wrap.querySelector('input[data-axis="y"]');
  for (const [num, ax] of [[numX, axes.x], [numY, axes.y]]) {
    num.min = ax.min; num.max = ax.max; num.step = ax.step;
  }

  const snap = (raw, ax) => {
    const clamped = Math.min(ax.max, Math.max(ax.min, raw));
    const stepped = Math.round((clamped - ax.min) / ax.step) * ax.step + ax.min;
    return Math.min(ax.max, Math.max(ax.min, parseFloat(stepped.toFixed(6))));
  };

  function fromPointer(e) {
    const r = pad.getBoundingClientRect();
    const tx = (e.clientX - r.left) / r.width;   // 0..1
    const ty = (e.clientY - r.top) / r.height;   // 0..1
    onChange({
      x: snap(axes.x.min + tx * (axes.x.max - axes.x.min), axes.x),
      y: snap(axes.y.min + ty * (axes.y.max - axes.y.min), axes.y),
    });
    refresh();
  }

  let dragging = false;
  pad.addEventListener('pointerdown', (e) => {
    dragging = true;
    pad.setPointerCapture?.(e.pointerId);
    fromPointer(e);
  });
  pad.addEventListener('pointermove', (e) => { if (dragging) fromPointer(e); });
  pad.addEventListener('pointerup', () => { dragging = false; });

  function numHandler(axis, ax) {
    return (e) => {
      const n = parseFloat(e.target.value);
      if (!Number.isFinite(n)) return;
      const v = getValue();
      onChange({ x: v.x, y: v.y, [axis]: snap(n, ax) });
      refresh();
    };
  }
  numX.addEventListener('input', numHandler('x', axes.x));
  numY.addEventListener('input', numHandler('y', axes.y));

  function refresh() {
    const v = getValue();
    const px = (v.x - axes.x.min) / (axes.x.max - axes.x.min);
    const py = (v.y - axes.y.min) / (axes.y.max - axes.y.min);
    knob.style.left = `${px * 100}%`;
    knob.style.top = `${py * 100}%`;
    numX.value = v.x;
    numY.value = v.y;
  }

  return { refresh };
}
