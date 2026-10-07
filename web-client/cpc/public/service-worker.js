const CACHE_NAME = "cpc-static-v1";
const STATIC_ASSETS = ["/manifest.webmanifest", "/pwa-icon-192.png", "/pwa-icon-512.png", "/pwa-icon-maskable-512.png"];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))));
  self.clients.claim();
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/login") || url.pathname.startsWith("/sso/")) return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
