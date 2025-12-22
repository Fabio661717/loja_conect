// src/utils/serviceWorkerFallback.ts
export const setupServiceWorkerFallback = async (): Promise<boolean> => {
  try {
    // ✅ Verificar se Service Worker é suportado
    if (!('serviceWorker' in navigator)) {
      console.log('ℹ️ Service Worker não suportado');
      return false;
    }

    // ✅ Verificar se CacheStorage é suportado
    if (!('caches' in window)) {
      console.log('ℹ️ CacheStorage não suportado');
      return false;
    }

    // ✅ Tentar registrar o Service Worker com fallback
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      console.log('✅ Service Worker registrado:', registration);
      return true;
    } catch (swError) {
      console.warn('⚠️ Erro no Service Worker, usando modo offline:', swError);

      // ✅ Fallback: criar um cache simples em memória
      setupMemoryCacheFallback();
      return false;
    }

  } catch (error) {
    console.error('❌ Erro no setup do Service Worker:', error);
    setupMemoryCacheFallback();
    return false;
  }
};

// ✅ Fallback para quando CacheStorage falha
const setupMemoryCacheFallback = () => {
  const memoryCache = new Map();

  // ✅ Expor globalmente para uso em outros componentes
  (window as any).memoryCache = {
    set: (key: string, value: any) => memoryCache.set(key, value),
    get: (key: string) => memoryCache.get(key),
    delete: (key: string) => memoryCache.delete(key),
    clear: () => memoryCache.clear()
  };

  console.log('🔄 Cache em memória inicializado (fallback)');
};

// ✅ Verificar e limpar caches corrompidos
export const clearCorruptedCaches = async (): Promise<void> => {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log('🧹 Limpando caches:', cacheNames);

      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
      }
      console.log('✅ Caches limpos com sucesso');
    }
  } catch (error) {
    console.warn('⚠️ Não foi possível limpar caches:', error);
  }
};
