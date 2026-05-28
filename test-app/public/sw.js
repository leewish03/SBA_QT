self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const payload = event.data.json();
      const options = {
        body: payload.body || '오늘의 말씀이 배달되었습니다.',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
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
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [100, 50, 100],
        data: { url: '/' }
      };
      event.waitUntil(
        self.registration.showNotification('SBA QT 알림', options)
      );
    }
  }
});

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
