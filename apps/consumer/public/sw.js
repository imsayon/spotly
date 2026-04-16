// Spotly Service Worker for Background Notifications
const CACHE_NAME = 'spotly-v1';

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event - claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push event - handle background push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = {
      title: 'Spotly',
      body: event.data.text(),
    };
  }

  const options = {
    body: data.body || 'Your queue update',
    icon: data.icon || '/logo.png',
    badge: data.badge || '/logo.png',
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction ?? true,
    actions: data.actions || [],
    data: data.data || {},
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Spotly', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification.data;
  let url = '/';

  // Navigate to the queue page if entry data is available
  if (notificationData?.entryId) {
    url = `/queue/${notificationData.entryId}`;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window client is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Message from main thread - for foreground/background sync
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
