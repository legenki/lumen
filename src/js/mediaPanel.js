// LUMEN — секция Media (левая панель): список user-слотов и загрузка новых
// через file picker. DEFAULT_MEDIA (встроенные ассеты) здесь не редактируем —
// показываем только пользовательские записи реестра (entry.user === true).
export function buildMediaSection(root, { p, media, onChange }) {
  const sec = document.createElement('section');
  sec.className = 'panel-section';
  sec.innerHTML = `
    <h2 class="section-title"><span>Media</span>
      <svg class="chevron-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
    </h2>
    <div class="section-content">
      <div class="parameter-row" id="lm-media-list"></div>
      <div class="parameter-row">
        <button id="lm-media-add" class="btn btn-secondary" style="width:100%;">Add Image</button>
        <input type="file" id="lm-media-file" accept="image/*" hidden multiple>
      </div>
    </div>`;
  sec.querySelector('.section-title').addEventListener('click', () => sec.classList.toggle('collapsed'));
  root.appendChild(sec);

  const list = sec.querySelector('#lm-media-list');
  const btn = sec.querySelector('#lm-media-add');
  const input = sec.querySelector('#lm-media-file');

  function refresh() {
    list.innerHTML = '';
    const userKeys = media.keys().filter((k) => media.get(k).user);
    if (userKeys.length === 0) {
      list.innerHTML =
        '<p style="opacity:.5;padding:6px 0;font-size:12px;">No user images loaded yet.</p>';
      return;
    }
    for (const key of userKeys) {
      const entry = media.get(key);
      const row = document.createElement('div');
      row.className = 'media-row';
      row.innerHTML = `
        <span class="media-key">${entry.name}</span>
        <button class="media-remove" data-key="${key}" title="Remove">&times;</button>`;
      list.appendChild(row);
    }
    list.querySelectorAll('.media-remove').forEach((b) => {
      b.addEventListener('click', () => {
        media.remove(b.dataset.key);
        refresh();
        onChange();
      });
    });
  }

  btn.addEventListener('click', () => input.click());
  input.addEventListener('change', () => {
    const files = Array.from(input.files ?? []);
    for (const file of files) loadOne(file);
    input.value = '';
  });

  function loadOne(file) {
    const url = URL.createObjectURL(file);
    p.loadImage(url, (img) => {
      media.add({
        url,
        name: file.name,
        width: img.width,
        height: img.height,
        tex: img,
      });
      refresh();
      onChange();
    }, () => {
      URL.revokeObjectURL(url);
      console.warn('[lumen] failed to load image:', file.name);
    });
  }

  refresh();
  return { refresh };
}
