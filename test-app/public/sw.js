const CACHE_NAME = 'sba-qt-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.svg',
  '/icons.svg',
  '/fallback_schedule.json'
];

// 1. 설치 단계: 정적 리소스 프리캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. 활성화 단계: 오래된 구버전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. fetch 요청 처리 (캐싱 전략 분기)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API 요청 (/api/로 시작하는 데이터 요청) - Stale-While-Revalidate 적용
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (event.request.method === 'GET' && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // 오프라인 상태일 때 캐싱된 데이터 반환, 캐시도 없으면 에러 대응
            return cachedResponse || new Response(JSON.stringify({ error: "offline" }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 성경 데이터 Lazy Loading 청크 (/bible/ 로 시작하거나 bible_data.json) - Cache First 적용
  if (url.pathname.includes('/bible/') || url.pathname.endsWith('bible_data.json')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          }
          return networkResponse;
        }).catch(() => {
          return new Response(JSON.stringify({ error: "bible_offline" }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        });
      })
    );
    return;
  }

  // 일반 정적 자산 (HTML, 빌드 CSS, JS 등) - Cache First 적용 후 fallback 처리
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // 빌드 에셋 동적 캐싱 추가
        if (networkResponse.status === 200 && 
            (url.pathname.includes('/assets/') || 
             event.request.destination === 'script' || 
             event.request.destination === 'style')) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      }).catch(() => {
        // 오프라인 상태에서 웹페이지 라우트 접속 시 index.html 로 대체
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// 4. 기존 푸시 알림 수신 로직 (보존)
self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const payload = event.data.json();
      const options = {
        body: payload.body || '오늘의 말씀이 배달되었습니다.',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [100, 50, 100],
        data: { url: payload.url || '/' }
      };
      event.waitUntil(
        self.registration.showNotification(payload.title || 'SBA QT', options)
      );
    } catch (e) {
      console.error('푸시 데이터 파싱 실패 (텍스트 폴백 적용):', e);
      const text = event.data.text();
      const options = {
        body: text,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [100, 50, 100],
        data: { url: '/' }
      };
      event.waitUntil(
        self.registration.showNotification('SBA QT 알림', options)
      );
    }
  }
});

// 5. 기존 알림 클릭 로직 (보존)
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      const targetUrl = event.notification.data.url;
      for (let client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
