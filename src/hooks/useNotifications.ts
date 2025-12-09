// src/hooks/useNotifications.ts
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { useNotification } from '../context/NotificationContextLtx';
import { supabase } from '../services/supabase';

export interface Notificacao {
  id: string;
  cliente_id: string;
  produto_id?: string;
  tipo: 'novo_produto' | 'promocao' | 'reserva_expirada' | 'lembrete' | 'sistema';
  titulo: string;
  mensagem: string;
  lida: boolean;
  data_leitura?: string;
  created_at: string;
}

export const useNotifications = (clienteId?: string) => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ NOVA ATUALIZAÇÃO: Contexto de Notificação
  const {
    addNotification,
    addUINotification,
    removeNotification: removeUINotification,
    markAsRead: markAsReadContext,
    unreadCount: contextUnreadCount
  } = useNotification();

  // 🔄 Carregar notificações
  const refreshData = async () => {
    if (!clienteId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;
      setNotificacoes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  // 🔔 RealTime listener
  useEffect(() => {
    if (!clienteId) {
      setLoading(false);
      return;
    }

    refreshData();

    const channel = supabase
      .channel('notificacoes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notificacoes',
          filter: `cliente_id=eq.${clienteId}`,
        },
        (payload: RealtimePostgresChangesPayload<Notificacao>) => {
          if (payload.eventType === 'INSERT') {
            setNotificacoes((prev) => [payload.new as Notificacao, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setNotificacoes((prev) =>
              prev.map((notif) =>
                notif.id === payload.new.id ? { ...notif, ...payload.new } : notif
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setNotificacoes((prev) => prev.filter((notif) => notif.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [clienteId]);

  // ✅ Marcar como lida
  const markAsRead = async (notificacaoId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('notificacoes')
        .update({
          lida: true,
          data_leitura: new Date().toISOString(),
        })
        .eq('id', notificacaoId);

      if (updateError) throw updateError;

      setNotificacoes((prev) =>
        prev.map((notif) =>
          notif.id === notificacaoId
            ? { ...notif, lida: true, data_leitura: new Date().toISOString() }
            : notif
        )
      );

      // ✅ ATUALIZAÇÃO: Também marcar no contexto
      markAsReadContext(notificacaoId);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao marcar como lida');
    }
  };

  // 🗑️ Excluir notificação
  const deleteNotification = async (notificacaoId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('notificacoes')
        .delete()
        .eq('id', notificacaoId);

      if (deleteError) throw deleteError;

      setNotificacoes((prev) => prev.filter((n) => n.id !== notificacaoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir notificação');
    }
  };

  // ✅ NOVA ATUALIZAÇÃO: Helpers para notificações UI
  const showSuccess = useCallback((message: string, title: string = 'Sucesso!') => {
    addUINotification({
      message,
      type: 'success'
    });

    addNotification({
      title,
      message,
      type: 'success',
      source: 'system',
      user_id: clienteId || 'current-user',
    });
  }, [addNotification, addUINotification, clienteId]);

  const showError = useCallback((message: string, title: string = 'Erro!') => {
    addUINotification({
      message,
      type: 'error'
    });

    addNotification({
      title,
      message,
      type: 'error',
      source: 'system',
      user_id: clienteId || 'current-user',
    });
  }, [addNotification, addUINotification, clienteId]);

  const showWarning = useCallback((message: string, title: string = 'Aviso!') => {
    addUINotification({
      message,
      type: 'warning'
    });

    addNotification({
      title,
      message,
      type: 'warning',
      source: 'system',
      user_id: clienteId || 'current-user',
    });
  }, [addNotification, addUINotification, clienteId]);

  const showInfo = useCallback((message: string, title: string = 'Informação') => {
    addUINotification({
      message,
      type: 'info'
    });

    addNotification({
      title,
      message,
      type: 'info',
      source: 'system',
      user_id: clienteId || 'current-user',
    });
  }, [addNotification, addUINotification, clienteId]);

  const unreadCount = notificacoes.filter((n) => !n.lida).length;

  return {
    // Funções originais mantidas
    notificacoes,
    loading,
    error,
    unreadCount,
    refreshData,
    markAsRead,
    deleteNotification,

    // ✅ NOVA ATUALIZAÇÃO: Helpers de notificação
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeUINotification,

    // ✅ Compatibilidade com contexto
    contextUnreadCount
  };
};
