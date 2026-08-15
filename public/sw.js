/* Service worker mínimo: solo resiliencia offline de lectura para /carta.
 * Network-first; si la red falla en una navegación a /carta, sirve el HTML
 * guardado para que la carta cacheada siga visible en modo solo lectura. */
const CACHE = "fogo-shell-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isCartaDoc = req.mode === "navigate" && url.pathname === "/carta";
  const isAsset =
    /\.(?:js|jsx|ts|tsx|mjs|css|woff2?|svg|png|jpg|jpeg|webp|ico)$/.test(url.pathname) ||
    url.pathname.startsWith("/_build/") ||
    url.pathname.startsWith("/@") ||
    url.pathname.startsWith("/src/") ||
    url.pathname.startsWith("/node_modules/");
  if (!isCartaDoc && !isAsset) return;

  event.respondWith(
    (async () => {
      try {
        const res = await fetch(req);
        if (res && res.ok) {
          const cache = await caches.open(CACHE);
          cache.put(isCartaDoc ? "/carta" : req, res.clone());
        }
        return res;
      } catch (error) {
        const cached =
          (await caches.match(isCartaDoc ? "/carta" : req)) ??
          (isCartaDoc ? undefined : await caches.match(req, { ignoreSearch: true }));
        if (cached) return cached;
        throw error;
      }
    })(),
  );
});
