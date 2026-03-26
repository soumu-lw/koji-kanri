const CACHE_NAME = 'koji-kanri-v1';
const ASSETS = [
  '/koji-kanri/',
  '/koji-kanri/index.html',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700;900&family=Space+Mono:wght@400;700&display=swap'
];

// インストール: アセットをキャッシュ
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// アクティベート: 古いキャッシュを削除
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// フェッチ: キャッシュ優先（Supabase通信はネットワーク優先）
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Supabase APIはネットワーク優先
  if(url.includes('supabase.co')){
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // その他はキャッシュ優先
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(response => {
        // 成功したレスポンスをキャッシュに追加
        if(response && response.status === 200){
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
    }).catch(() => caches.match('/koji-kanri/'))
  );
});
