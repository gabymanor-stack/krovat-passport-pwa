self.addEventListener('install', e=>{
  e.waitUntil(
    caches.open('passport-cache-v1').then(cache=>cache.addAll([
      './','./index.html','./styles.css','./app.js','./manifest.json',
      'https://unpkg.com/pdf-lib/dist/pdf-lib.min.js'
      // Add your images here for offline, e.g. './pages/01_Cover.png', ...
    ])).catch(()=>{})
  );
});
self.addEventListener('fetch', e=>{
  e.respondWith(
    caches.match(e.request).then(resp=> resp || fetch(e.request).catch(()=>resp) )
  );
});
