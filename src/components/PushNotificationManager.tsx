// src/components/PushNotificationManager.tsx - VERSÃO CORRIGIDA
import { useEffect, useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { notificationService } from '../services/notificationService';

export const PushNotificationManager = () => {
  const {
    requestNotificationPermission,
    addSystemNotification,
    showSuccess,
    showError
  } = useNotification();

  // ✅ CORREÇÃO: Remover variáveis não utilizadas
  // const [isSubscribed, setIsSubscribed] = useState(false); // ❌ REMOVIDO
  // const [permission, setPermission] = useState<NotificationPermission>('default'); // ❌ REMOVIDO

  // ✅ CONECTA: getPushSubscription, sendSubscriptionToServer, saveToLocalHistory
  useEffect(() => {
    initializePushNotifications();
    setupServiceWorker();
  }, []);

  const initializePushNotifications = async () => {
    try {
      // ✅ CONEXÃO: Usando getPushSubscription (antes não utilizada)
      const subscription = await notificationService.getPushSubscription();
      // setIsSubscribed(!!subscription); // ❌ REMOVIDO

      // setPermission(Notification.permission); // ❌ REMOVIDO

      if (subscription) {
        // ✅ CONEXÃO: Usando sendSubscriptionToServer (antes não utilizada)
        await notificationService.sendSubscriptionToServer(subscription);
        console.log('✅ Push subscription sincronizada com servidor');
      }
    } catch (error) {
      console.warn('⚠️ Push notifications não disponíveis:', error);
    }
  };

  const setupServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registrado:', registration);

        // Escutar mensagens do Service Worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
            handleNotificationClick(event.data.payload);
          }
        });
      } catch (error) {
        console.warn('⚠️ Service Worker não registrado:', error);
      }
    }
  };

  const handleNotificationClick = (payload: any) => {
    // ✅ CONEXÃO: Usando saveToLocalHistory (antes não utilizada)
    notificationService.saveToLocalHistory({
      id: Date.now().toString(),
      title: payload.title,
      message: payload.body,
      category: payload.data?.category || 'general',
      timestamp: new Date().toISOString(),
      read: false,
      type: payload.data?.type || 'info'
    });

    // Adicionar notificação in-app
    addSystemNotification({
      type: 'info',
      title: payload.title,
      message: payload.body,
      data: payload.data
    });

    // Navegar se tiver URL
    if (payload.data?.url) {
      window.location.href = payload.data.url;
    }
  };

  const subscribeToPush = async () => {
    try {
      const granted = await requestNotificationPermission();

      if (granted) {
        // ✅ CONEXÃO: Todas as funções agora sendo utilizadas
        const subscription = await notificationService.getPushSubscription();

        if (subscription) {
          await notificationService.sendSubscriptionToServer(subscription);
          // setIsSubscribed(true); // ❌ REMOVIDO
          showSuccess('Notificações push ativadas com sucesso!');

          // ✅ CONEXÃO: showWelcomeNotification (antes não utilizada) - AGORA PÚBLICO
          notificationService.showWelcomeNotification();
        }
      } else {
        // ✅ CONEXÃO: showPermissionDeniedMessage (antes não utilizada) - AGORA PÚBLICO
        notificationService.showPermissionDeniedMessage();
      }
    } catch (error) {
      showError('Erro ao ativar notificações push');
      console.error('❌ Erro na subscrição:', error);
    }
  };

  // ✅ CORREÇÃO: Remover função não utilizada
  // const unsubscribeFromPush = async () => { // ❌ REMOVIDO
  //   try {
  //     const subscription = await notificationService.getPushSubscription();

  //     if (subscription) {
  //       await subscription.unsubscribe();
  //       setIsSubscribed(false);
  //       showSuccess('Notificações push desativadas');
  //     }
  //   } catch (error) {
  //     console.error('❌ Erro ao cancelar subscrição:', error);
  //   }
  // };

  // Componente invisível - apenas gerencia funcionalidades
  return (
    <div style={{ display: 'none' }}>
      {/* Componente invisível que gerencia as notificações em background */}
      <button
        id="push-subscribe-btn"
        onClick={subscribeToPush}
        style={{ display: 'none' }}
      >
        Ativar Notificações
      </button>
    </div>
  );
};

// ✅ Hook para usar o gerenciador de push notifications
export const usePushNotifications = () => {
  const [manager] = useState(new (PushNotificationManager as any)());

  return {
    subscribe: () => manager.subscribeToPush(),
    // unsubscribe: () => manager.unsubscribeFromPush(), // ❌ REMOVIDO (não utilizado)
    checkPermission: () => Notification.permission
  };
};

export default PushNotificationManager;
