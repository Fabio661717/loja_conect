// public/api/push/subscribe.js
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Interceptar requisições de push
  if (url.pathname === '/api/push/subscribe') {
    event.respondWith(
      new Response(JSON.stringify({
        success: true,
        message: 'Subscription recebida com sucesso'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
    return;
  }

  if (url.pathname === '/api/push/unsubscribe') {
    event.respondWith(
      new Response(JSON.stringify({
        success: true,
        message: 'Unsubscribe realizado'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
    return;
  }
});
