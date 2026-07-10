// LUMEN — реестр медиа-текстур (фаза 3: только дефолтные ассеты из assets.js;
// пользовательская загрузка/видео — фаза 6). Ошибка загрузки не валит приложение:
// слот остаётся not-ready, fillMedia-пасс просто пропускается (как в старом коде,
// bundle-pretty.js:47353,47364 — «if (!R?.ready) return h»).

export function createMediaRegistry(sources, loadImage) {
  const entries = new Map();
  const jobs = [];
  for (const [key, url] of Object.entries(sources)) {
    const entry = { key, url, ready: false, tex: null, res: [0, 0] };
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
  return {
    get: (key) => entries.get(key),
    whenReady: () => all,
  };
}
