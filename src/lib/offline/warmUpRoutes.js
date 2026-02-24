/**
 * Warm up critical routes when app loads online so Service Worker caches
 * HTML + JS chunks for those routes. Then offline they work like localhost.
 * Runs at most once per day (localStorage) so it doesn't slow every visit.
 */

const WARMUP_KEY = "aftab_offline_warmup_date";
const WARMUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

const CRITICAL_ROUTES = ["/", "/new-order", "/dashboard", "/products", "/customer-dashboard"];

const IFRAME_LOAD_WAIT_MS = 6000; // time per route so chunks are requested and cached

function shouldRunWarmup() {
  if (typeof window === "undefined" || !navigator.onLine) return false;
  try {
    const last = localStorage.getItem(WARMUP_KEY);
    if (!last) return true;
    const lastTime = parseInt(last, 10);
    if (Number.isNaN(lastTime)) return true;
    return Date.now() - lastTime > WARMUP_INTERVAL_MS;
  } catch {
    return false;
  }
}

function markWarmupDone() {
  try {
    localStorage.setItem(WARMUP_KEY, String(Date.now()));
  } catch {}
}

/**
 * Load each critical route in a hidden iframe so SW caches the document + chunks.
 * Call once when app loads online (e.g. from OfflineProvider).
 */
export async function warmUpCriticalRoutes(extraRoutes = []) {
  if (!shouldRunWarmup()) return;
  if (!("serviceWorker" in navigator)) return;

  try {
    await navigator.serviceWorker.ready;
  } catch {
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;visibility:hidden";

  const loadUrl = (url) =>
    new Promise((resolve) => {
      iframe.onload = () => setTimeout(resolve, IFRAME_LOAD_WAIT_MS);
      iframe.onerror = () => setTimeout(resolve, IFRAME_LOAD_WAIT_MS);
      iframe.src = url;
    });

  document.body.appendChild(iframe);

  try {
    const routes = [...CRITICAL_ROUTES, ...(Array.isArray(extraRoutes) ? extraRoutes : [])]
      .filter(Boolean)
      .map((r) => String(r));
    const unique = [...new Set(routes)];
    for (const path of unique) {
      await loadUrl(path);
    }
  } finally {
    iframe.remove();
    markWarmupDone();
  }
}


