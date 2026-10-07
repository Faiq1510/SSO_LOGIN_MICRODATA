const CACHE_NAME = "microdata-sso-static-v9";

const STATIC_ASSETS = [
  "/admin-dashboard/dashboard.html",
  "/admin-dashboard/dashboard.css",
  "/admin-dashboard/dashboard.js",
  "/manifest.webmanifest",
  "/images/microdata-logo.webp",
  "/images/pwa-icon-192.png",
  "/images/pwa-icon-512.png",
  "/images/pwa-icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of STATIC_ASSETS) {
        const response = await fetch(asset, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(
            `Asset cache gagal: ${asset} (${response.status})`,
          );
        }
        await cache.put(asset, response);
      }
    }),
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      );
    }),
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (event.request.method !== "GET") {
    return;
  }

  // Endpoint admin harus selalu meminta data terbaru dari server.
  if (requestUrl.pathname.startsWith("/admin/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse.ok) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      });
    }),
  );
});
