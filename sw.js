const CACHE_NAME = 'umkmpro-cache-v1';
const APP_SHELL = [
  './',
  './index.html'
];

// Simpan halaman utama ke cache begitu pertama kali dibuka (saat online)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
    ))
  );
  self.clients.claim();
});

// Strategi: coba ambil dari internet dulu (data selalu terbaru kalau online),
// kalau gagal (offline), pakai versi yang tersimpan di cache
self.addEventListener('fetch', (event) => {
  // Jangan campur tangan permintaan ke Supabase (biarkan gagal alami kalau offline,
  // supaya kode aplikasi yang menangani logika offline-nya)
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
  );
});
