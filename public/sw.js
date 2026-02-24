/* PWA Service Worker – offline cache + background sync for orders */
const CACHE_NAME = "aftabfood-v6";
const DB_NAME = "aftabfood-offline";
const DB_VERSION = 6;
const SYNC_TAG = "sync-orders";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  /* Do NOT pre-cache "/" here: we would cache only the HTML, not the JS/CSS chunks it references, so offline would get 503 on chunks and ChunkLoadError. We only serve fallback when we have a document from a real visit (then its chunks are cached too). */
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* Open IndexedDB (same as app) to read pending orders and auth token */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

function getMeta(db, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("meta", "readonly");
    const store = tx.objectStore("meta");
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result?.value);
    req.onerror = () => reject(req.error);
  });
}

function getPendingOrders(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("orders", "readonly");
    const req = tx.objectStore("orders").getAll();
    req.onsuccess = () => resolve((req.result || []).filter((o) => o.sync_status === "pending"));
    req.onerror = () => reject(req.error);
  });
}

function deleteOrder(db, uuid) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("orders", "readwrite");
    const req = tx.objectStore("orders").delete(uuid);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/* Background Sync: when online, sync pending orders to server */
self.addEventListener("sync", (event) => {
  if (event.tag !== SYNC_TAG) return;
  event.waitUntil(syncOrdersInSW());
});

async function syncOrdersInSW() {
  const db = await openDB();
  const token = await getMeta(db, "auth_token");
  const pending = await getPendingOrders(db);
  db.close();

  if (pending.length === 0) return;
  if (!token) {
    console.warn("[SW] No auth token for background sync");
    return;
  }

  const res = await fetch("/api/sales/sync-orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({ orders: pending }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return;

  const results = data.results || [];
  const db2 = await openDB();
  for (const r of results) {
    if (r.success && r.uuid) await deleteOrder(db2, r.uuid);
  }
  db2.close();

  try {
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    clients.forEach((c) => c.postMessage({ type: "ORDERS_SYNCED", payload: data }));
  } catch (_) {}
}

/* Fetch: cache GETs, serve offline when possible */
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) {
    if (url.pathname.startsWith("/api/") || url.hostname.includes("otwoostores")) return;
  }
  if (event.request.method !== "GET") return;

  const isNavigate = event.request.mode === "navigate";

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone();
        let cloneForPath = null;
        if (
          res.ok &&
          (url.pathname === "/" ||
            url.pathname === "/manifest.json" ||
            url.pathname === "/favicon.ico" ||
            url.pathname.startsWith("/dashboard") ||
            url.pathname.startsWith("/new-order") ||
            url.pathname.startsWith("/products") ||
            url.pathname.startsWith("/cart") ||
            url.pathname.startsWith("/review") ||
            url.pathname.startsWith("/order-success") ||
            url.pathname.startsWith("/existing-orders") ||
            url.pathname.startsWith("/customer-dashboard") ||
            url.pathname.includes("_next"))
        ) {
          if (isNavigate && url.pathname !== "/") cloneForPath = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
            if (cloneForPath)
              cache.put(new Request(url.origin + url.pathname, { method: "GET" }), cloneForPath);
          });
        }
        return res;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          /* For navigations: only serve a cached document for the SAME path (never serve "/" for /new-order etc.), otherwise wrong chunks load and ChunkLoadError occurs on Hostinger offline. */
          if (isNavigate) {
            return caches
              .match(new Request(url.origin + url.pathname, { method: "GET" }))
              .then((fallback) => {
                if (fallback) return fallback;
                return new Response(
                  "<!DOCTYPE html><html><head><meta charset=utf-8><meta name=viewport content=\"width=device-width,initial-scale=1\"><title>Offline</title></head><body style=\"font-family:system-ui;max-width:28em;margin:2em auto;padding:1em;text-align:center\"><p style=\"color:#666\">You're offline. Open this page once while <strong>online</strong>, then try again.</p><p><a href=\"/\" style=\"color:#2563eb\">Go to home</a></p></body></html>",
                  { status: 503, statusText: "Service Unavailable", headers: { "Content-Type": "text/html; charset=utf-8" } }
                );
              });
          }
          return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
        })
      )
  );
});

