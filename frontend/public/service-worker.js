/* PoketBook SW — Uninstall (was causing white screen issues) */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => {
        // Notify all clients to reload after SW clears cache
        self.clients.matchAll().then(clients => 
          clients.forEach(c => c.postMessage({ type: "SW_CLEARED" }))
        );
      })
  );
});
// Pass through ALL requests without caching
self.addEventListener("fetch", () => {});
