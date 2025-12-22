// src/utils/realtime.ts - VERSÃO COMPATÍVEL COM SUPABASE
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from "../services/supabase";

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimeCallback {
  (payload: RealtimePostgresChangesPayload<any>): void;
}

class RealtimeService {
  private channels: Map<string, any> = new Map();

  // Método simplificado sem usar '*'
  subscribeToTable(
    table: string,
    events: RealtimeEvent[] = ['INSERT', 'UPDATE', 'DELETE'],
    filter: string = '',
    callback: RealtimeCallback
  ): () => void {
    const channelName = `${table}-${events.join('-')}-${filter}`;

    // Remover canal existente se houver
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName);
    }

    const channel = supabase.channel(channelName);

    // Adiciona cada evento individualmente
    events.forEach(eventType => {
      // CORREÇÃO: Usando a sintaxe correta para a versão atual
      const config: any = {
        event: eventType,
        schema: 'public',
        table: table
      };

      if (filter) {
        config.filter = filter;
      }

      channel.on(
        'postgres_changes',
        config,
        callback
      );
    });

    // Subscrever
    channel.subscribe((status: string) => {
      console.log(`📡 Canal ${channelName}: ${status}`);
    });

    this.channels.set(channelName, channel);

    // Retornar função de unsubscribe
    return () => this.unsubscribe(channelName);
  }

  // Escutar reservas de uma loja específica
  subscribeToStoreReservations(
    storeId: string,
    callback: RealtimeCallback
  ): () => void {
    return this.subscribeToTable(
      'reservas',
      ['INSERT', 'UPDATE', 'DELETE'],
      `loja_id=eq.${storeId}`,
      callback
    );
  }

  // Escutar produtos de uma loja específica
  subscribeToStoreProducts(
    storeId: string,
    callback: RealtimeCallback
  ): () => void {
    return this.subscribeToTable(
      'produtos',
      ['INSERT', 'UPDATE', 'DELETE'],
      `loja_id=eq.${storeId}`,
      callback
    );
  }

  // Escutar funcionários de uma loja específica
  subscribeToStoreEmployees(
    storeId: string,
    callback: RealtimeCallback
  ): () => void {
    return this.subscribeToTable(
      'funcionarios',
      ['INSERT', 'UPDATE', 'DELETE'],
      `loja_id=eq.${storeId}`,
      callback
    );
  }

  // Escutar apenas INSERT em uma tabela
  subscribeToTableInserts(
    table: string,
    filter: string = '',
    callback: RealtimeCallback
  ): () => void {
    return this.subscribeToTable(
      table,
      ['INSERT'],
      filter,
      callback
    );
  }

  // Escutar apenas UPDATE em uma tabela
  subscribeToTableUpdates(
    table: string,
    filter: string = '',
    callback: RealtimeCallback
  ): () => void {
    return this.subscribeToTable(
      table,
      ['UPDATE'],
      filter,
      callback
    );
  }

  // Escutar apenas DELETE em uma tabela
  subscribeToTableDeletes(
    table: string,
    filter: string = '',
    callback: RealtimeCallback
  ): () => void {
    return this.subscribeToTable(
      table,
      ['DELETE'],
      filter,
      callback
    );
  }

  // Unsubscribe de um canal específico
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
      console.log(`🔇 Canal ${channelName} removido`);
    }
  }

  // Unsubscribe de todos os canais
  unsubscribeAll(): void {
    this.channels.forEach((channel, channelName) => {
      supabase.removeChannel(channel);
      console.log(`🔇 Canal ${channelName} removido`);
    });
    this.channels.clear();
  }

  // Verificar status da conexão
  getConnectionStatus(): string {
    return (supabase as any).realtime?.status || 'disconnected';
  }
}

export const realtimeService = new RealtimeService();

// Hook para usar o serviço realtime no React
export const useRealtime = () => {
  return realtimeService;
};
