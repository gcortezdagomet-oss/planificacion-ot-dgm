const CACHE = 'planificacion-ot-v3';
const ASSETS = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', event => {
  // Activa la nueva versión de inmediato, sin esperar a que se cierren
  // todas las pestañas abiertas de la app.
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    // Borra cualquier caché de una versión anterior (ej: planificacion-ot-v2)
    // para que no queden archivos viejos dando vueltas.
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const isHtmlRequest = event.request.mode === 'navigate' || event.request.destination === 'document';

  // Siempre prioriza la versión fresca del HTML para no quedarnos con una
  // pantalla de login o una app vieja guardada en caché. Los assets estáticos
  // pueden seguir cacheándose, pero la página principal se recarga desde red.
  if (isHtmlRequest) {
    event.respondWith(
      fetch(event.request)
        .then(r => {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copy));
          return r;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(event.request, copy));
        return r;
      })
      .catch(() => caches.match(event.request))
  );
});
