const CACHE = 'mahacare-offline-v2';
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.add('/offline.html');
    await cache.add('/field').catch(() => {});
    try {
      const response = await fetch('/portal');
      if (response.ok) {
        await cache.put('/portal', response.clone());
        const html = await response.text();
        const urls = [...html.matchAll(/(?:src|href)="([^" ]+\.(?:js|css)(?:\?[^" ]*)?)"/g)].map(match => match[1].replaceAll('&amp;', '&'));
        await Promise.all(urls.filter(url => url.startsWith('/_next/')).map(url => cache.add(url).catch(() => {})));
      }
    } catch {}
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('mahacare-offline-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/') || request.headers.has('RSC') || url.pathname.includes('hmr')) return;
  if (request.mode !== 'navigate' && !['script', 'style', 'image', 'font'].includes(request.destination)) return;
  event.respondWith(fetch(request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)));
    }
    return response;
  }).catch(async () => (await caches.match(request)) || (request.mode === 'navigate' ? caches.match('/offline.html') : Response.error())));
});
