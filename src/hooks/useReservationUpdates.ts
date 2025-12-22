// hooks/useReservationUpdates.ts - VERSÃO CORRIGIDA
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

// Definir a interface para a reserva
interface Reserva {
  id: string;
  status: string;
  produto_nome?: string;
  fim_reserva?: string;
  [key: string]: any;
}

// Interface para o payload do Supabase Realtime
export interface ReservaUpdatePayload {
  new: Reserva;
  old: Reserva;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

export const useReservationUpdates = (reservaId?: string) => {
  const [updates, setUpdates] = useState<any[]>([]);

  useEffect(() => {
    if (!reservaId) return;

    // Subscrever para mudanças na reserva específica
    const subscription = supabase
      .channel(`reserva-${reservaId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservas',
          filter: `id=eq.${reservaId}`
        },
        (payload: RealtimePostgresChangesPayload<Reserva>) => {
          console.log('Mudança na reserva:', payload);
          setUpdates(prev => [...prev, payload]);

          // Verificar se a reserva expirou - COM TIPAGEM SEGURA
          if (payload.new && 'status' in payload.new && payload.new.status === 'expirada') {
            console.log('Reserva expirada detectada:', reservaId);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [reservaId]);

  return { updates };
};
