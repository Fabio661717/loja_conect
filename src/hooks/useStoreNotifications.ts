// src/hooks/useStoreNotifications.ts
import { useEffect } from 'react';
import { realtimeService } from '../utils/realtime';
import { useAuth } from './useAuth';

export function useStoreNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.type !== 'loja') return;

    // Escutar novas reservas
    const unsubscribeReservations = realtimeService.subscribeToStoreReservations(
      user.lojaId!,
      (payload) => {
        if (payload.eventType === 'INSERT') {
          // Mostrar notificação
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('📦 Nova Reserva!', {
              body: 'Um cliente fez uma nova reserva na sua loja',
              icon: '/icon.png'
            });
          }

          // Atualizar dados em tempo real
          window.dispatchEvent(new CustomEvent('new-reservation'));
        }
      }
    );

    // Escutar mudanças em produtos
    const unsubscribeProducts = realtimeService.subscribeToStoreProducts(
      user.lojaId!,
      (payload) => {
        console.log('Mudança em produtos:', payload);
      }
    );

    return () => {
      unsubscribeReservations();
      unsubscribeProducts();
    };
  }, [user]);
}
