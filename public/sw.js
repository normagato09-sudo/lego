// Service Worker minimo para LEGO Inventory.
// Estrategia: network-first para todo lo dinamico (HTML/JS/CSS/datos) para evitar
// que los usuarios se queden con una version antigua de la app; cache-first
// solo para los iconos estaticos que no cambian.
const CACHE_NAME = "lego-inventory-static-v1";
const STATIC_ASSETS = [
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-192.png",
  "/icon-maskable-512.png",
  "/favicon-32.png",
  "/favicon-16.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {})),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isStaticIcon = STATIC_ASSETS.includes(url.pathname);

  if (isStaticIcon) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
    return;
  }

  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
