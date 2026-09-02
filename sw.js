const CACHE = 'planificacion-ot-v2';
const ASSETS = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', event => {
  // Activa la nueva versión de inmediato, sin esperar a que se cierren
  // todas las pestañas abiertas de la app.
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    // Borra cualquier caché de una versión anterior (ej: planificacion-ot-v1)
    // para que no queden archivos viejos dando vueltas.
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Para el HTML (la app en sí): siempre intenta traer la versión más nueva
  // desde internet primero, y solo usa la copia guardada si no hay conexión.
  // Así, cada vez que actualices index.html en GitHub, se verá al instante
  // (con GitHub Pages) sin que nadie tenga que borrar caché a mano.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(r => {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put(event.request, copy));
          return r;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  // Para el resto de los archivos (manifest, íconos, etc.): usa la copia
  // guardada si existe, y si no, la busca en internet y la guarda para la
  // próxima vez.
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(r => {
      const copy = r.clone(); caches.open(CACHE).then(c => c.put(event.request, copy)); return r;
    }).catch(() => caches.match('./index.html')))
  );
});
