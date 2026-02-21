import { getAuthToken } from "@/lib/api";

const SYNC_TAG = "sync-orders";

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        syncAuthTokenToIDB();
        if ("sync" in reg) registerSyncIfPending(reg);
      })
      .catch(() => {});
  });
}

/** Copy auth token to IndexedDB so the service worker can use it for background sync */
async function syncAuthTokenToIDB() {
  try {
    const token = getAuthToken();
    if (token) {
      const { setMeta } = await import("@/lib/idb");
      await setMeta("auth_token", token);
    }
  } catch (_) {}
}

/** Register for background sync so when the device is back online, SW will sync orders */
async function registerSyncIfPending(reg) {
  try {
    const { getPendingOrders } = await import("@/lib/offline/orderQueue");
    const pending = await getPendingOrders();
    if (pending.length > 0) await reg.sync.register(SYNC_TAG);
  } catch (_) {}
}

/**
 * Call this after enqueueing an offline order so background sync runs when back online.
 * Safe to call even if sync API is not supported.
 */
export async function requestOrderSync() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    if ("sync" in reg) await reg.sync.register(SYNC_TAG);
  } catch (_) {}
}
