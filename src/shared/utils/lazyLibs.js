/**
 * On-demand loader for heavyweight vendor scripts that should not block
 * first paint. Each script is injected once; concurrent callers share the
 * same promise.
 */

const pending = new Map();

function loadScript(src) {
  if (pending.has(src)) return pending.get(src);
  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => {
      // Allow a retry after a network failure instead of caching the rejection.
      pending.delete(src);
      script.remove();
      reject(new Error(`Failed to load script: ${src}`));
    };
    document.head.appendChild(script);
  });
  pending.set(src, promise);
  return promise;
}

/**
 * Resolves to the HME global from h264-mp4-encoder (1.7 MB). Loaded on first
 * video export instead of at app startup.
 * @returns {Promise<typeof HME>}
 */
export async function ensureHME() {
  if (window.HME) return window.HME;
  await loadScript(`${import.meta.env.BASE_URL}lib/vendor/h264-mp4-encoder.web.js`);
  return window.HME;
}

