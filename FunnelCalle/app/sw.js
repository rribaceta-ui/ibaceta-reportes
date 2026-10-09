// Cachea solo el armazon de la app (unos 40 KB). Los datos NO se cachean aca: de eso se
// encarga la persistencia de Firestore, que ademas sincroniza lo que se hizo sin señal.
const CACHE = "funnel-calle-v14";
const BASE = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  // Todo lo de Google (datos y login) va siempre a la red.
  if (u.hostname.includes("googleapis.com") || u.hostname.includes("gstatic.com")) return;
  if (e.request.method !== "GET") return;
  // La app primero por red (para tomar versiones nuevas) y si no hay señal, del cache.
  e.respondWith(
    fetch(e.request).then(r => {
      const copia = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copia)).catch(() => {});
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
  );
});
