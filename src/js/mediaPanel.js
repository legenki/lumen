const DISPLAY_NAMES = {
  white: 'White Fill',
  'gradient-linear': 'Gradient (Linear)',
  'gradient-reflect': 'Gradient (Reflect)',
  'gradient-circle': 'Gradient (Circle)',
  'gradient-tile': 'Gradient (Tile)',
  img0: 'Sample Image 1',
  img1: 'Sample Image 2',
  img2: 'Sample Image 3',
  img3: 'Sample Image 4',
  text0: 'Sample Text 1',
  text1: 'Sample Text 2',
  text2: 'Sample Text 3',
  text3: 'Sample Text 4',
  text4: 'Sample Text 5',
  text5: 'Sample Text 6',
  shape0: 'Sample Shape 1',
  shape1: 'Sample Shape 2',
  shape2: 'Sample Shape 3',
  shape3: 'Sample Shape 4',
  shape4: 'Sample Shape 5',
  noise0: 'Noise Texture',
};

function displayName(entry) {
  return DISPLAY_NAMES[entry.key] ?? entry.name ?? entry.key;
}

export function buildMediaSection(root, { p, media, onChange }) {
  const sec = document.createElement('section');
  sec.className = 'panel-section';
  sec.innerHTML = `
    <h2 class="section-title"><span>Media Pool</span>
      <svg class="chevron-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
    </h2>
    <div class="section-content">
      <div class="parameter-row">
        <button id="lm-media-open" class="btn btn-secondary" style="width:100%;">Add / Remove Media Files</button>
      </div>
    </div>`;
  sec.querySelector('.section-title').addEventListener('click', () => sec.classList.toggle('collapsed'));
  root.appendChild(sec);

  const overlay = document.createElement('div');
  overlay.className = 'media-modal-overlay';
  overlay.innerHTML = `
    <div class="media-modal">
      <h2 class="media-modal-title">Media Pool</h2>
      <div class="media-modal-grid" id="lm-media-grid"></div>
      <div class="media-modal-upload">
        <p class="media-modal-hint">Upload or drag media files here to add them to the pool (.png, .jpg, .gif, .webp, .mp4, .webm, .mov)</p>
        <button id="lm-media-upload-btn" class="btn btn-primary" type="button">Upload Media</button>
        <input type="file" id="lm-media-file" accept="image/*,video/mp4,video/webm,video/quicktime" hidden multiple>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const grid = overlay.querySelector('#lm-media-grid');
  const uploadBtn = overlay.querySelector('#lm-media-upload-btn');
  const fileInput = overlay.querySelector('#lm-media-file');

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  overlay.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); });
  overlay.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer?.files ?? []);
    for (const f of files) loadOne(f);
  });

  function open() {
    refreshGrid();
    overlay.classList.add('active');
  }

  function close() {
    overlay.classList.remove('active');
  }

  function refreshGrid() {
    grid.innerHTML = '';
    const allKeys = media.keys();
    for (const key of allKeys) {
      const entry = media.get(key);
      if (!entry) continue;
      const cell = document.createElement('div');
      cell.className = 'media-cell';
      const name = displayName(entry);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'media-cell-remove';
      removeBtn.title = 'Remove';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        media.remove(key);
        refreshGrid();
        onChange();
      });
      cell.appendChild(removeBtn);

      const thumb = document.createElement('div');
      thumb.className = 'media-cell-thumb';
      if (entry.ready && entry.tex) {
        const src = entry.url ?? entry.tex?.canvas?.toDataURL?.();
        if (src) {
          thumb.style.backgroundImage = `url("${src.replace(/["\\]/g, '\\$&')}")`;
        }
      }
      cell.appendChild(thumb);

      const label = document.createElement('div');
      label.className = 'media-cell-label';
      label.textContent = name;
      label.title = name;
      cell.appendChild(label);

      grid.appendChild(cell);
    }
  }

  sec.querySelector('#lm-media-open').addEventListener('click', open);
  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files ?? []);
    for (const file of files) loadOne(file);
    fileInput.value = '';
  });

  function loadOne(file) {
    const url = URL.createObjectURL(file);
    if (!p) return;
    p.loadImage(url, (img) => {
      media.add({ url, name: file.name, width: img.width, height: img.height, tex: img });
      refreshGrid();
      onChange();
    }, () => {
      URL.revokeObjectURL(url);
      console.warn('[lumen] failed to load image:', file.name);
    });
  }

  return { refresh: refreshGrid, open };
}
