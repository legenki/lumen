// LUMEN — реестр медиа-текстур (фаза 3: только дефолтные ассеты из assets.js;
// пользовательская загрузка/видео — фаза 6). Ошибка загрузки не валит приложение:
// слот остаётся not-ready, fillMedia-пасс просто пропускается (как в старом коде,
// bundle-pretty.js:47353,47364 — «if (!R?.ready) return h»).

export function createMediaRegistry(sources, loadImage, deps = {}) {
  const entries = new Map();
  const jobs = [];
  const revokeObjectURL = deps.url?.revokeObjectURL ?? ((u) => URL.revokeObjectURL(u));
  let userCounter = 0;

  for (const [key, url] of Object.entries(sources)) {
    const entry = { key, url, ready: false, tex: null, res: [0, 0], name: key, user: false };
    entries.set(key, entry);
    jobs.push(
      new Promise((resolve) => {
        loadImage(
          url,
          (img) => {
            entry.tex = img;
            entry.res[0] = img.width;
            entry.res[1] = img.height;
            entry.ready = true;
            resolve();
          },
          (err) => {
            console.warn(`[lumen] media load failed: ${key}`, err);
            resolve();
          },
        );
      }),
    );
  }
  const all = Promise.all(jobs);

  function add({ url, name, width, height, tex = null }) {
    userCounter += 1;
    const key = `user_${userCounter}_${Date.now().toString(36)}`;
    const entry = {
      key, url, name, user: true,
      ready: true, tex, res: [width, height],
    };
    entries.set(key, entry);
    return entry;
  }

  function remove(key) {
    const entry = entries.get(key);
    if (!entry) return;
    if (entry.user && typeof entry.url === 'string' && entry.url.startsWith('blob:')) {
      revokeObjectURL(entry.url);
    }
    entries.delete(key);
  }

  return {
    get: (key) => entries.get(key),
    keys: () => Array.from(entries.keys()),
    whenReady: () => all,
    add,
    remove,
  };
}
