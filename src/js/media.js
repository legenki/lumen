// LUMEN — реестр медиа-текстур (фаза 3: только дефолтные ассеты из assets.js;
// пользовательская загрузка/видео — фаза 6). Ошибка загрузки не валит приложение:
// слот остаётся not-ready, fillMedia-пасс просто пропускается (как в старом коде,
// bundle-pretty.js:47353,47364 — «if (!R?.ready) return h»).
//
// Video entries: { kind: 'video', video: HTMLVideoElement, tex }. Export seeks via
// seekAllVideosToTime() before each frame so the sampled texture matches the cursor.

/**
 * Seek a single HTMLVideoElement and resolve on 'seeked' (or timeout).
 * @param {HTMLVideoElement} video
 * @param {number} timeSec
 * @param {number} [timeoutMs=500]
 */
export function seekVideoElement(video, timeSec, timeoutMs = 500) {
  return new Promise((resolve) => {
    if (!video || !Number.isFinite(timeSec)) {
      resolve();
      return;
    }
    const dur = video.duration;
    let t = timeSec;
    if (Number.isFinite(dur) && dur > 0) {
      t = ((timeSec % dur) + dur) % dur;
    }
    if (Math.abs((video.currentTime || 0) - t) < 1e-3) {
      resolve();
      return;
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      video.removeEventListener('seeked', finish);
      resolve();
    };
    video.addEventListener('seeked', finish);
    try {
      video.pause?.();
      video.currentTime = t;
    } catch {
      finish();
      return;
    }
    setTimeout(finish, timeoutMs);
  });
}

export function createMediaRegistry(sources, loadImage, deps = {}) {
  const entries = new Map();
  const jobs = [];
  const revokeObjectURL = deps.url?.revokeObjectURL ?? ((u) => URL.revokeObjectURL(u));
  let userCounter = 0;

  for (const [key, url] of Object.entries(sources)) {
    const entry = {
      key, url, ready: false, tex: null, res: [0, 0], name: key, user: false,
      kind: 'image', video: null,
    };
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

  function add({ url, name, width, height, tex = null, kind = 'image', video = null }) {
    userCounter += 1;
    const key = `user_${userCounter}_${Date.now().toString(36)}`;
    const entry = {
      key, url, name, user: true,
      ready: true, tex, res: [width, height],
      kind: kind === 'video' ? 'video' : 'image',
      video: kind === 'video' ? video : null,
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

  /** List entries that are video sources (for export seek). */
  function videoEntries() {
    const out = [];
    for (const entry of entries.values()) {
      if (entry.kind === 'video' && entry.video) out.push(entry);
    }
    return out;
  }

  /**
   * Seek every video entry to absolute timeline time (seconds).
   * Call before drawComposite during MP4 export.
   */
  async function seekAllVideosToTime(timeSec) {
    const list = videoEntries();
    if (!list.length) return;
    await Promise.all(list.map((e) => seekVideoElement(e.video, timeSec)));
  }

  /**
   * Seek videos for export frame index: time = frameNum / fps (timeline seconds).
   */
  async function seekAllVideosToFrame(frameNum, fps) {
    const rate = Math.max(1, fps || 30);
    await seekAllVideosToTime(frameNum / rate);
  }

  return {
    get: (key) => entries.get(key),
    keys: () => Array.from(entries.keys()),
    whenReady: () => all,
    add,
    remove,
    videoEntries,
    seekAllVideosToTime,
    seekAllVideosToFrame,
  };
}
