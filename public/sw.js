// public/sw.js - Service Worker v9 (Loja-Conect) - VERSÃO COMPLETA ATUALIZADA COM PUSH
// Salvar em: public/sw.js

const CACHE_NAME = 'loja-conect-cliente-v9';
const CRITICAL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/badge-72x72.png',
  '/notification-image.png'
];

// ROTAS HTTP que o SW pode chamar (implemente no backend):
// POST /api/push/subscribe           -> registrar subscription no banco
// POST /api/push/unsubscribe         -> remover subscription
// POST /api/sync/check-expired       -> endpoint para checar reservas expiradas (retorna ações)
// GET  /api/sync/fetch-promotions    -> retornar novas promoções desde X
// POST /api/sync/send-push           -> enviar push server-side (opcional)

self.addEventListener('install', (event) => {
  console.log('[SW Cliente] install v9 - Loja Conect');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW Cliente] caching critical assets');
        // Filtrar por segurança: não cachear endpoints dinâmicos
        return cache.addAll(CRITICAL_URLS);
      })
      .then(() => self.skipWaiting())
      .catch(err => {
        console.error('[SW Cliente] install error:', err);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW Cliente] activate v9');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(k => {
          if (k !== CACHE_NAME) {
            console.log('[SW Cliente] deleting old cache', k);
            return caches.delete(k);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: cache falling back to network, avoid caching API/Supabase endpoints
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Always bypass caching for API/Supabase calls
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase.co')) {
    // Let the request hit the network
    event.respondWith(fetch(event.request).catch(() => new Response(null, { status: 504 })));
    return;
  }

  // For navigation/documents, try network first then cache fallback (best for SPA)
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request).then(resp => {
        // Optionally update cache with latest index.html
        if (resp && resp.status === 200) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('/', copy)).catch(()=>{});
        }
        return resp;
      }).catch(() => caches.match('/'))
    );
    return;
  }

  // For other static assets, try cache then network and populate cache for future use
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(networkResp => {
        // Cache only JS/CSS/images for offline support
        if (event.request.destination === 'script' ||
            event.request.destination === 'style' ||
            event.request.destination === 'image') {
          caches.open(CACHE_NAME).then(cache => {
            try { cache.put(event.request, networkResp.clone()); } catch(e){/* some responses are opaque */ }
          });
        }
        return networkResp;
      }).catch(() => {
        // fallback for images (optional): return placeholder image from cache if exists
        if (event.request.destination === 'image') {
          return caches.match('/icon-192x192.png');
        }
        return new Response(null, { status: 504 });
      });
    })
  );
});

// ✅ PUSH NOTIFICATIONS PARA CLIENTE - VERSÃO ATUALIZADA COM SOM (ATUALIZAÇÃO APLICADA)
self.addEventListener('push', (event) => {
  console.log('[SW Cliente] Push recebido');

  // ✅ VERIFICAR SE TEM DADOS - COM FALLBACK MELHORADO
  if (!event.data) {
    console.warn('[SW Cliente] Push event sem dados');
    const fallback = {
      title: 'Loja-Conect',
      body: 'Você tem uma nova notificação',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'general'
    };
    event.waitUntil(self.registration.showNotification(fallback.title, {
      body: fallback.body,
      icon: fallback.icon,
      badge: fallback.badge,
      tag: fallback.tag,
      // ✅ CONFIGURAÇÕES PARA SOM NO CELULAR
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: true,
      silent: false, // ✅ IMPORTANTE: false para tocar som padrão
      actions: [
        { action: 'view', title: '👀 Ver' },
        { action: 'dismiss', title: '❌ Fechar' }
      ]
    }));
    return;
  }

  // ✅ TENTAR PARSER OS DADOS COM FALLBACK
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch (e) {
    console.warn('[SW Cliente] push could not parse json, usando fallback:', e);
    data = {
      title: 'Loja-Conect',
      body: event.data.text() || 'Nova notificação disponível'
    };
  }

  // ✅ ATUALIZAÇÃO APLICADA: ESTRUTURA SIMPLIFICADA PARA DADOS PUSH
  const options = {
    body: data.body || 'Nova notificação',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-72x72.png',
    image: data.image,
    tag: data.tag || 'loja-conect',
    data: {
      url: data.url || '/',
      ...(data.data || {})
    },
    // ✅ CONFIGURAÇÕES ATUALIZADAS PARA SOM E VIBRAÇÃO
    vibrate: data.vibrate || [200, 100, 200, 100, 200],
    requireInteraction: data.requireInteraction || true,
    silent: false, // ✅ SOM ATIVADO
    actions: data.actions || [
      { action: 'view', title: '👀 Ver' },
      { action: 'dismiss', title: '❌ Fechar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Loja-Conect', options)
  );
});

// ✅ NOTIFICATION CLICK HANDLING - VERSÃO ATUALIZADA COM MELHOR NAVEGAÇÃO (ATUALIZAÇÃO APLICADA)
self.addEventListener('notificationclick', (event) => {
  console.log('[SW Cliente] notificationclick', event.action, event.notification.data);
  event.notification.close();

  const payload = event.notification.data || {};
  const targetUrl = payload.url || '/cliente/produtos';

  // ✅ ATUALIZAÇÃO APLICADA: COMPORTAMENTO SIMPLIFICADO PARA CLIQUE
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const client = clients.find(c => c.url.includes(self.location.origin));

      if (client) {
        client.focus();
        // ✅ MANTIDO: Envio de mensagem para a aplicação
        client.postMessage({
          type: 'NOTIFICATION_CLICKED',
          action: event.action,
          data: payload
        });

        // ✅ ATUALIZAÇÃO: Navegação para URL específica se for um clique simples
        if (!event.action || event.action === 'view') {
          client.navigate(targetUrl).catch(() => {
            // Fallback se navigate não funcionar
            self.clients.openWindow(targetUrl);
          });
        }
      } else {
        self.clients.openWindow(targetUrl);
      }
    })
  );
});

// ✅ MESSAGE LISTENER - VERSÃO EXPANDIDA COM NOVAS FUNCIONALIDADES
self.addEventListener('message', (event) => {
  console.log('[SW Cliente] message received:', event.data);
  const { type, data, payload } = event.data || {};

  // ✅ FUNCIONALIDADE: SEND_PUSH_NOTIFICATION
  if (type === 'SEND_PUSH_NOTIFICATION') {
    console.log('[SW Cliente] Enviando notificação push local');
    event.waitUntil(
      self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        badge: payload.badge || '/badge-72x72.png',
        data: payload.data,
        // ✅ CONFIGURAÇÕES PARA SOM
        vibrate: [200, 100, 200],
        silent: false,
        requireInteraction: true
      })
    );
    return;
  }

  // ✅ NOTIFICAÇÃO ENVIADA DIRETAMENTE DA APLICAÇÃO
  if (type === 'SHOW_NOTIFICATION') {
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: data.tag || 'loja-conect',
        data: data.data || {},
        requireInteraction: data.requireInteraction || false,
        // ✅ CONFIGURAÇÕES PARA SOM
        vibrate: [200, 100, 200],
        silent: false,
        actions: data.actions || []
      })
    );
    return;
  }

  if (type === 'PRODUCT_ADDED') {
    // ✅ NOTIFICAÇÃO DE NOVO PRODUTO
    event.waitUntil(
      self.registration.showNotification('🛍️ Novo Produto!', {
        body: data.body || 'Confira nosso novo produto disponível',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'new-product',
        data: { url: data.url || '/produtos' },
        requireInteraction: true,
        vibrate: [200, 100, 200],
        silent: false
      })
    );
    return;
  }

  if (type === 'NEW_PROMOTION') {
    // ✅ NOTIFICAÇÃO DE NOVA PROMOÇÃO
    event.waitUntil(
      self.registration.showNotification('🔥 Nova Promoção!', {
        body: data.body || 'Aproveite nossa nova promoção',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'new-promotion',
        data: { url: data.url || '/promocoes' },
        requireInteraction: true,
        vibrate: [200, 100, 200],
        silent: false
      })
    );
    return;
  }

  // ✅ FUNCIONALIDADES ORIGINAIS MANTIDAS
  if (type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW Cliente] cache cleared by client');
    });
    return;
  }

  if (type === 'SEND_NOTIFICATION') {
    // message from page to show a local notification (e.g. reservation immediate)
    const { title, options } = event.data;
    self.registration.showNotification(title, {
      ...options,
      // ✅ GARANTIR SOM NAS NOTIFICAÇÕES LOCAIS
      silent: false,
      vibrate: [200, 100, 200]
    }).catch(err => console.error('[SW Cliente] showNotification error', err));
    return;
  }

  if (type === 'CHECK_SYNC_NOW') {
    // Prompt background sync like behavior: call your server endpoint to check expired reservations / new promos
    event.waitUntil(runSyncTasks());
    return;
  }
});

// Background sync / periodic check helpers
async function runSyncTasks() {
  console.log('[SW Cliente] runSyncTasks: contacting server for sync tasks');

  try {
    // 1) Check expired reservations (server should return array of notifications or actions)
    await fetch('/api/sync/check-expired', { method: 'POST', credentials: 'same-origin' })
      .then(r => r.ok ? r.json().catch(()=>null) : Promise.reject(r))
      .then(async (resp) => {
        if (!resp) return;
        // resp could contain notifications to show
        for (const notif of resp.notifications || []) {
          await self.registration.showNotification(notif.title, {
            body: notif.body,
            icon: notif.icon || '/icon-192x192.png',
            data: notif.data || {},
            // ✅ CONFIGURAÇÕES PARA SOM
            silent: false,
            vibrate: [200, 100, 200]
          });
        }
      }).catch(err => {
        console.warn('[SW Cliente] check-expired failed', err);
      });

    // 2) Fetch new promotions (server returns promotions / notifications)
    await fetch('/api/sync/fetch-promotions', { method: 'GET', credentials: 'same-origin' })
      .then(r => r.ok ? r.json().catch(()=>null) : Promise.reject(r))
      .then(async (resp) => {
        if (!resp) return;
        for (const promoNotif of resp.notifications || []) {
          await self.registration.showNotification(promoNotif.title, {
            body: promoNotif.body,
            icon: promoNotif.icon || '/icon-192x192.png',
            data: promoNotif.data || {},
            // ✅ CONFIGURAÇÕES PARA SOM
            silent: false,
            vibrate: [200, 100, 200]
          });
        }
      }).catch(err => {
        console.warn('[SW Cliente] fetch-promotions failed', err);
      });

    // Optionally inform clients that sync ran
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    clients.forEach(c => c.postMessage({ type: 'SYNC_COMPLETED' }));
  } catch (err) {
    console.error('[SW Cliente] runSyncTasks error', err);
  }
}

// Background sync event (for browsers that support sync)
self.addEventListener('sync', (event) => {
  console.log('[SW Cliente] sync event', event.tag);
  if (event.tag === 'check-expired-reservations') {
    event.waitUntil(runSyncTasks());
  }
});

// pushsubscriptionchange: notify clients to re-subscribe
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW Cliente] pushsubscriptionchange', event);
  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
      clients.forEach(c => c.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED' }));
    })
  );
});

// ✅ EVENTO DE FECHAR NOTIFICAÇÃO
self.addEventListener('notificationclose', (event) => {
  console.log('❌ Notificação fechada', event);
});

console.log('[SW Cliente] v9 Carregado - Notificações com Som Ativadas + Atualização Aplicada');
