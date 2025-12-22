// src/config/notificationConfig.ts

// ✅ CONECTA: vapidPublicKey, notificationSound, options

/**
 * Configurações centralizadas para o sistema de notificações
 */

// ✅ CONEXÃO: vapidPublicKey (antes não utilizada)
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BAzb1rh5J2_placeholder_key';

// ✅ CONEXÃO: notificationSound (antes não utilizada)
export const NOTIFICATION_SOUND = {
  enabled: true,
  src: '/sounds/notification.mp3',
  fallback: true, // Usar Web Audio API se áudio não carregar
  volume: 0.3
};

// ✅ CONEXÃO: options (antes não utilizada)
export const NOTIFICATION_OPTIONS = {
  // Configurações gerais
  timeout: 5000,
  maxVisible: 3,
  position: 'top-right' as const,

  // Configurações de push
  push: {
    requireInteraction: true,
    silent: false,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'view',
        title: 'Ver',
        icon: '/icon-view-192x192.png'
      },
      {
        action: 'dismiss',
        title: 'Fechar',
        icon: '/icon-dismiss-192x192.png'
      }
    ]
  },

  // Configurações de UI
  ui: {
    animation: 'slide-in-right',
    duration: 5000,
    closeButton: true,
    progressBar: true
  },

  // Configurações de som
  sound: {
    enabled: true,
    types: {
      info: { frequency: 800, duration: 300 },
      success: { frequency: 1000, duration: 400 },
      warning: { frequency: 600, duration: 500 },
      error: { frequency: 400, duration: 600 }
    }
  }
};

// Configurações por categoria
export const CATEGORY_CONFIG = {
  'novo_produto': {
    title: '🆕 Novo Produto',
    color: '#3B82F6',
    sound: 'info',
    priority: 'normal' as const,
    autoClose: 6000
  },
  'promocao': {
    title: '🔥 Promoção',
    color: '#EF4444',
    sound: 'success',
    priority: 'high' as const,
    autoClose: 8000
  },
  'reserva': {
    title: '⏰ Reserva',
    color: '#F59E0B',
    sound: 'warning',
    priority: 'high' as const,
    autoClose: 10000
  },
  'estoque': {
    title: '📦 Estoque',
    color: '#10B981',
    sound: 'info',
    priority: 'normal' as const,
    autoClose: 5000
  },
  'info': {
    title: 'ℹ️ Informação',
    color: '#6B7280',
    sound: 'info',
    priority: 'low' as const,
    autoClose: 4000
  }
};

// Configurações de Service Worker
export const SERVICE_WORKER_CONFIG = {
  path: '/sw.js',
  scope: '/',
  updateInterval: 24 * 60 * 60 * 1000 // 24 horas
};

// Configurações de cache
export const CACHE_CONFIG = {
  name: 'notifications-v1',
  maxEntries: 100,
  maxAgeSeconds: 7 * 24 * 60 * 60, // 1 semana
  strategies: {
    networkFirst: ['/api/notifications'],
    cacheFirst: ['/sounds/', '/icons/']
  }
};

// Configurações de performance
export const PERFORMANCE_CONFIG = {
  debounceTime: 300,
  throttleTime: 1000,
  batchSize: 10,
  retryAttempts: 3,
  retryDelay: 1000
};

// ✅ Função para obter configuração completa
export const getNotificationConfig = () => ({
  vapidPublicKey: VAPID_PUBLIC_KEY,
  notificationSound: NOTIFICATION_SOUND,
  options: NOTIFICATION_OPTIONS,
  categories: CATEGORY_CONFIG,
  serviceWorker: SERVICE_WORKER_CONFIG,
  cache: CACHE_CONFIG,
  performance: PERFORMANCE_CONFIG
});

// ✅ Validação das configurações
export const validateConfig = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY.includes('placeholder')) {
    errors.push('VAPID_PUBLIC_KEY não configurada - notificações push não funcionarão');
  }

  if (!NOTIFICATION_SOUND.src) {
    errors.push('Caminho do som de notificação não configurado');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// ✅ Hook para usar configurações (opcional)
export const useNotificationConfig = () => {
  const config = getNotificationConfig();
  const validation = validateConfig();

  return {
    config,
    validation,
    isConfigured: validation.valid,
    getCategoryConfig: (category: string) =>
      CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.info
  };
};

export default getNotificationConfig;
