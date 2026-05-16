/* PoketBook Service Worker v2 — Offline Support with API caching */
const CACHE_NAME = "poketbook-v2";
const API_CACHE = "poketbook-api-v2";
const OFFLINE_URL = "/offline.html";

const SHELL_URLS = ["/", "/offline.html", "/logo.png", "/logo192.png", "/logo512.png", "/manifest.json"];

// API endpoints to cache for offline access (read-only)
const CACHEABLE_APIS = [
  "/api/parties",
  "/api/balance-sheet",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(SHELL_URLS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== API_CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // API endpoints — network first, fallback to cache (offline mode)
  if (url.pathname.startsWith("/api/")) {
    const shouldCache = CACHEABLE_APIS.some(p => url.pathname.startsWith(p));
    e.respondWith(
      fetch(request.clone())
        .then(resp => {
          // Cache successful read responses for offline
          if (resp.ok && shouldCache) {
            const clone = resp.clone();
            caches.open(API_CACHE).then(c => c.put(request, clone));
          }
          return resp;
        })
        .catch(async () => {
          // Offline: serve from cache if available
          const cached = await caches.match(request, { cacheName: API_CACHE });
          if (cached) return cached;
          return new Response(JSON.stringify({ offline: true, error: "No internet — showing cached data" }), {
            headers: { "Content-Type": "application/json" }, status: 503,
          });
        })
    );
    return;
  }

  // Static assets — cache first
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2|webp)$/)) {
    e.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(resp => {
        if (resp.ok) caches.open(CACHE_NAME).then(c => c.put(request, resp.clone()));
        return resp;
      }))
    );
    return;
  }

  // HTML — network first, offline fallback
  e.respondWith(
    fetch(request)
      .then(resp => {
        if (resp.ok) caches.open(CACHE_NAME).then(c => c.put(request, resp.clone()));
        return resp;
      })
      .catch(() => caches.match(request).then(c => c || caches.match(OFFLINE_URL)))
  );
});

// Cache ledger entries when user views them
self.addEventListener("message", (e) => {
  if (e.data?.type === "CACHE_LEDGER" && e.data.url) {
    caches.open(API_CACHE).then(async c => {
      const token = e.data.token;
      if (!token) return;
      const resp = await fetch(e.data.url, { headers: { Authorization: `Bearer ${token}` } });
      if (resp.ok) await c.put(e.data.url, resp);
    });
  }
});
