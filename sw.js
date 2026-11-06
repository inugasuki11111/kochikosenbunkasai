// Offline cache for the web version (registered by src/mobile.js when served over https, e.g. on a phone).
// App files: network first, so a new version shows up as soon as the phone is online, cache when offline.
// The robot model and icons: cache first (large, rarely change; bump CACHE when robot.glb changes).
// robot.glb is not precached: the page's own load of it fills the cache, so it is downloaded only once.
const CACHE = 'houkago-ishin-v1';
const APP = ['./', 'index.html', 'dist/app.js', 'src/styles.css', 'manifest.webmanifest', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const keep = (req, res) => {
  if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
  return res;
};

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (/\.(glb|png)$/.test(url.pathname)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => keep(req, res))));
  } else {
    e.respondWith(fetch(req).then((res) => keep(req, res)).catch(() => caches.match(req, { ignoreSearch: true })));
  }
});
