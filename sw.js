// Bump CACHE when shell files change so clients pick up the new version.
const CACHE = "turkish-verbs-v2";
const SHELL = [
  "./",
  "index.html",
  "learn.html",
  "styles.css",
  "verbs.json",
  "manifest.webmanifest",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/favicon-32.png",
  "icons/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const url = new URL(req.url);
  // Network-first for the page and data so edits to verbs.json show up; cache as offline fallback.
  const networkFirst = req.mode === "navigate" || /\/(verbs\.json|styles\.css)$/.test(url.pathname);
  if (networkFirst) {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("index.html")))
    );
  } else {
    e.respondWith(caches.match(req).then(r => r || fetch(req)));
  }
});
