// src/hooks/useReservationNotifications.ts - VERSÃO CORRIGIDA
import { useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { useSupabase } from './useSupabase';

export const useReservationNotifications = () => {
  const { renovarReserva, cancelarReservaAutomatico } = useSupabase();

  useEffect(() => {
    // Inicializar notificações
    notificationService.initialize();

    // Ouvir mensagens do Service Worker
    const handleServiceWorkerMessage = async (event: MessageEvent) => {
      const { type, reservaId, horas } = event.data;

      switch (type) {
        case 'RENOVAR_RESERVA':
          try {
            await renovarReserva(reservaId, horas || 8);
            console.log('✅ Reserva renovada via notificação');
          } catch (error) {
            console.error('❌ Erro ao renovar reserva via notificação:', error);
          }
          break;

        case 'CANCELAR_RESERVA':
          try {
            await cancelarReservaAutomatico(reservaId);
            console.log('✅ Reserva cancelada via notificação');
          } catch (error) {
            console.error('❌ Erro ao cancelar reserva via notificação:', error);
          }
          break;

        case 'NOTIFICATION_CLICKED':
          console.log('Notificação clicada:', event.data);
          // Aqui você pode navegar para a página de reservas
          break;

        case 'CHECK_EXPIRED_RESERVATIONS':
          console.log('Verificando reservas expiradas...');
          // Implementar lógica para verificar reservas expiradas
          break;
      }
    };

    // Registrar listener para mensagens do Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [renovarReserva, cancelarReservaAutomatico]);

  return {
    requestPermission: () => notificationService.requestNotificationPermission(),
    isSupported: () => notificationService.isSupported(),
    getPermissionState: () => notificationService.getPermissionState()
  };
};
