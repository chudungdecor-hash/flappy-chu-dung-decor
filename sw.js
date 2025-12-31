const CACHE_NAME = "flappy-chudung-v1";

// các file local của bạn
const CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./sw.js"
];

// các asset online (cố gắng cache để chơi mượt + offline sau lần mở đầu)
const REMOTE = [
  "https://raw.githubusercontent.com/sourabhv/FlapPyBird/master/assets/sprites/yellowbird-upflap.png",
  "https://raw.githubusercontent.com/sourabhv/FlapPyBird/master/assets/sprites/yellowbird-midflap.png",
  "https://raw.githubusercontent.com/sourabhv/FlapPyBird/master/assets/sprites/yellowbird-downflap.png",
  "https://raw.githubusercontent.com/sourabhv/FlapPyBird/master/assets/sprites/pipe-green.png",
  "https://raw.githubusercontent.com/sourabhv/FlapPyBird/master/assets/audio/wing.wav",
  "https://raw.githubusercontent.com/sourabhv/FlapPyBird/master/assets/audio/point.wav",
  "https://raw.githubusercontent.com/sourabhv/FlapPyBird/master/assets/audio/hit.wav"
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE);

    // cache remote best-effort (không fail nếu bị chặn CORS)
    await Promise.allSettled(
      REMOTE.map(async (url) => {
        try {
          const res = await fetch(url, { mode: "no-cors" });
          await cache.put(url, res);
        } catch (_) {}
      })
    );

    self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k === CACHE_NAME ? null : caches.delete(k))));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  e.respondWith((async () => {
    const cached = await caches.match(e.request);
    if (cached) return cached;

    try {
      const res = await fetch(e.request);
      const cache = await caches.open(CACHE_NAME);
      // cache lại cho lần sau
      cache.put(e.request, res.clone()).catch(()=>{});
      return res;
    } catch (_) {
      // fallback: nếu offline mà không có cache
      return cached || new Response("Offline", { status: 200 });
    }
  })());
});
