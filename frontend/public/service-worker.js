/* PoketBook Service Worker v3 — Safe offline, no blocking install */
const CACHE_NAME = "poketbook-v3";
const API_CACHE  = "poketbook-api-v3";

self.addEventListener("install", (e) => {
  // v3: Skip addAll — never block app install on file availability
  e.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME && k !== API_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // CRITICAL: Never serve HTML from cache — always load fresh to prevent stale white screens
  if (request.mode === "navigate" || url.pathname === "/" || url.pathname.endsWith(".html")) {
    e.respondWith(fetch(request).catch(() => caches.match("/")));
    return;
  }

  // API: network first, cache successful reads for offline fallback
  if (url.pathname.startsWith("/api/")) {
    const cacheable = ["/api/parties", "/api/balance-sheet"];
    e.respondWith(
      fetch(request.clone()).then(resp => {
        if (resp.ok && cacheable.some(p => url.pathname.startsWith(p))) {
          caches.open(API_CACHE).then(c => c.put(request, resp.clone()));
        }
        return resp;
      }).catch(() =>
        caches.match(request, { cacheName: API_CACHE }).then(c => c ||
          new Response(JSON.stringify({ offline: true }), {
            headers: { "Content-Type": "application/json" }, status: 503
          })
        )
      )
    );
    return;
  }

  // Static JS/CSS/images: cache-first after first load
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?|webp)$/)) {
    e.respondWith(
      caches.match(request).then(cached => {
        const network = fetch(request).then(resp => {
          if (resp.ok) caches.open(CACHE_NAME).then(c => c.put(request, resp.clone()));
          return resp;
        }).catch(() => cached);
        return cached || network;
      })
    );
  }
});
