/* PWA Service Worker – offline cache + background sync for orders */
const CACHE_NAME = "aftabfood-v3";
const DB_NAME = "aftabfood-offline";
const DB_VERSION = 3;
const SYNC_TAG = "sync-orders";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  /* Pre-cache app shell so when offline we can serve it for any uncached navigate (e.g. /customer-dashboard) and the app loads instead of plain "Offline". */
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add("/").catch(() => {}))
  );
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
        if (
          res.ok &&
          (url.pathname === "/" ||
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
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          /* For page navigations, serve a cached app shell so the app loads and can show its own offline UI (IndexedDB cache message or dashboard). Otherwise user would only see plain "Offline" on Hostinger/live. */
          if (isNavigate) {
            return caches
              .match(new Request(url.origin + url.pathname, { method: "GET" }))
              .then((c1) => (c1 ? c1 : caches.match(new Request(url.origin + "/", { method: "GET" }))))
              .then((fallback) => fallback || new Response("Offline", { status: 503, statusText: "Service Unavailable" }));
          }
          return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
        })
      )
  );
});
