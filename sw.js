// Service Worker: keeps every game file on the device so later visits load
// instantly and the game never needs the network while playing.
// VERSION is stamped by tools/build-manifest.mjs.
const VERSION = '7dd2984ceb';
const CACHE = 'bq-' + VERSION;

async function copyOrFetch(cache, file) {
  const have = await cache.match(file.url);
  if (have && have.headers.get('X-Hash') === file.hash) return;
  // Reuse an unchanged file from an older version instead of downloading it again.
  for (const name of await caches.keys()) {
    if (name === CACHE) continue;
    const old = await (await caches.open(name)).match(file.url);
    if (old && old.headers.get('X-Hash') === file.hash) return cache.put(file.url, old);
  }
  const res = await fetch(file.url, { cache: 'no-store' });
  if (!res.ok) throw new Error(file.url + ' ' + res.status);
  const headers = { 'Content-Type': res.headers.get('Content-Type') || '', 'X-Hash': file.hash };
  await cache.put(file.url, new Response(await res.blob(), { headers }));
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const manifest = await (await fetch('asset-manifest.json', { cache: 'no-store' })).json();
    const cache = await caches.open(CACHE);
    for (const file of manifest.files) await copyOrFetch(cache, file);
    await cache.put('asset-manifest.json', new Response(JSON.stringify(manifest), {
      headers: { 'Content-Type': 'application/json' },
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith('bq-') && name !== CACHE) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  if (url.pathname.endsWith('/asset-manifest.json')) {
    // Network first so updates are noticed; cached copy when offline.
    event.respondWith(fetch(req).catch(() => caches.match('asset-manifest.json')));
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = req.mode === 'navigate' ? 'index.html' : req;
    const hit = await cache.match(key, { ignoreSearch: true });
    return hit || fetch(req);
  })());
});
