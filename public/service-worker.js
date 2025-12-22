// Service Worker para push notifications
self.addEventListener('push', function(event) {
    console.log('[Service Worker] Push recebido');

    if (!event.data) {
        console.error('Push sem dados');
        return;
    }

    try {
        const data = event.data.json();
        console.log('Dados da notificação:', data);

        const options = {
            body: data.body || 'Nova notificação',
            icon: data.icon || '/icon-192x192.png',
            badge: '/badge-72x72.png',
            image: data.image,
            data: {
                url: data.url || '/',
                categoryId: data.categoryId,
                productId: data.productId
            },
            actions: data.actions || [],
            tag: data.tag || 'default',
            requireInteraction: data.requireInteraction || false,
            silent: data.silent || false,
            timestamp: data.timestamp || Date.now()
        };

        event.waitUntil(
            self.registration.showNotification(
                data.title || 'Novo Produto Disponíve!',
                options
            ).then(() => {
                console.log('Notificação exibida com sucesso');
            })
        );
    } catch (error) {
        console.error('Erro ao processar push:', error);
    }
});

self.addEventListener('notificationclick', function(event) {
    console.log('[Service Worker] Notificação clicada');
    event.notification.close();

    const url = event.notification.data?.url || '/';
    const categoryId = event.notification.data?.categoryId;
    const productId = event.notification.data?.productId;

    console.log('Abrindo URL:', url);
    console.log('Categoria:', categoryId);
    console.log('Produto:', productId);

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function(windowClients) {
            // Procura por uma janela já aberta
            for (let client of windowClients) {
                if (client.url.includes(url) && 'focus' in client) {
                    console.log('Focando janela existente:', client.url);
                    return client.focus();
                }
            }

            // Abre nova janela
            if (clients.openWindow) {
                console.log('Abrindo nova janela:', url);
                return clients.openWindow(url);
            }
        })
    );
});

// Instalação do Service Worker
self.addEventListener('install', function(event) {
    console.log('[Service Worker] Instalado');
    self.skipWaiting(); // Ativa imediatamente
});

// Ativação do Service Worker
self.addEventListener('activate', function(event) {
    console.log('[Service Worker] Ativado');
    return self.clients.claim(); // Toma controle das páginas imediatamente
});
