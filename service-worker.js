self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SIMULATE_PUSH') {
        const title = event.data.title || "Уведомление";
        const options = {
            body: event.data.body || "Новое сообщение",
            icon: "https://img.icons8.com/color/48/000000/info--v1.png",
            badge: "https://img.icons8.com/color/48/000000/info--v1.png",
            vibrate: [200, 100, 200]
        };
        event.waitUntil(self.registration.showNotification(title, options));
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow('/');
        })
    );
});
