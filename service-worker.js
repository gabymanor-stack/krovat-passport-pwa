self.addEventListener('install', e=>{
  self.skipWaiting(); // <— add
  e.waitUntil(
    caches.open('passport-cache-v3') // <- bump v2 → v3
      .then(cache=>cache.addAll([
        './','./index.html','./styles.css','./app.js','./manifest.json',
        'https://unpkg.com/pdf-lib/dist/pdf-lib.min.js'
        // (optional) list your image files here for offline use
      ]))
  );
});
self.addEventListener('activate', e=>{ e.waitUntil(self.clients.claim()); }); // <— add
self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request)));
});
