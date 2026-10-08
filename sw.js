// Service worker: lets the game open offline and from the home screen.
// Network first, so a new version is picked up as soon as it is online; the cache is the fallback.
const CACHE = 'echizen-soba-v2.4';
const V = '2.4';
const PRECACHE = [
    './',
    './soba_clicker.html',
    `./css/style.css?v=${V}`,
    `./js/data.js?v=${V}`,
    `./js/core.js?v=${V}`,
    `./js/systems.js?v=${V}`,
    `./js/save.js?v=${V}`,
    './note_bowl.png',
    './manifest.webmanifest',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return; // fonts etc. go straight to the network
    event.respondWith(
        fetch(req)
            .then(res => {
                if (res.ok) {
                    const copy = res.clone();
                    caches.open(CACHE).then(cache => cache.put(req, copy));
                }
                return res;
            })
            .catch(() => caches.match(req).then(hit => hit || (req.mode === 'navigate' ? caches.match('./soba_clicker.html') : undefined)))
    );
});
