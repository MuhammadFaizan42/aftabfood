/* Offline-first Service Worker - caches app shell and pages */
const CACHE_NAME = "aftabfood-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) {
    if (url.pathname.startsWith("/api/") || url.hostname.includes("otwoostores")) {
      return;
    }
  }
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone();
        if (res.ok && (url.pathname === "/" || url.pathname.startsWith("/dashboard") || url.pathname.startsWith("/new-order") || url.pathname.startsWith("/products") || url.pathname.startsWith("/cart") || url.pathname.startsWith("/review") || url.pathname.startsWith("/order-success") || url.pathname.startsWith("/existing-orders") || url.pathname.startsWith("/customer-dashboard") || url.pathname.includes("_next"))) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || new Response("Offline", { status: 503, statusText: "Service Unavailable" }))
      )
  );
});
