/* PoketBook Service Worker — Offline Support */
const CACHE_NAME = "poketbook-v1.1";
const OFFLINE_URL = "/offline.html";

// App shell files to cache for offline
const SHELL_URLS = [
  "/",
  "/offline.html",
  "/logo.png",
  "/logo192.png",
  "/logo512.png",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and non-same-origin requests
  if (request.method !== "GET") return;

  // API requests: network-first, no cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: "offline", message: "No internet connection" }), {
          headers: { "Content-Type": "application/json" },
          status: 503,
        })
      )
    );
    return;
  }

  // Static assets: cache-first (fast)
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML/navigation: network-first, offline fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL)))
  );
});
