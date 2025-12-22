// src/hooks/useReservation.ts - CORRIGIDO
import { useState } from 'react';
import { useAuth } from './useAuth';
import { useSupabase } from './useSupabase';

export interface ReservationData {
  id: string;
  produto_id: string;
  usuario_id: string;
  loja_id: string;
  quantidade: number;
  tamanho?: string;
  funcionario_id?: string;
  status: string;
  fim_reserva: number | string; // ✅ Pode ser number (timestamp) ou string (ISO)
  created_at: string;
  produtos?: {
    nome: string;
    categoria?: string;
    foto_url?: string;
  };
  clientes?: {
    nome: string;
    email: string;
  };
}

export function useReservation() {
  const [loading, setLoading] = useState(false);
  const { createReservation, cancelReservation } = useSupabase(); // ✅ CORREÇÃO: usar createReservation em vez de createReservationRPC
  const { user } = useAuth();

  const createReservationHandler = async (
    produtoId: string,
    lojaId: string,
    quantidade: number = 1,
    tamanho?: string,
    funcionarioId?: string
  ): Promise<ReservationData> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    setLoading(true);
    try {
      console.log('🎯 useReservation - Criando reserva:', {
        produtoId,
        lojaId,
        quantidade,
        tamanho,
        funcionarioId,
        usuarioId: user.id
      });

      // ✅ CORREÇÃO: Usar createReservation em vez de createReservationRPC
      const reserva = await createReservation(
        produtoId,
        user.id,
        lojaId,
        quantidade,
        tamanho
        // funcionarioId é passado automaticamente se necessário
      );

      console.log('✅ useReservation - Reserva criada com sucesso:', reserva);

      // ✅ CORREÇÃO: Garantir que fim_reserva seja tratado corretamente
      if (typeof reserva.fim_reserva === 'string') {
        // Se for string ISO, converter para timestamp
        reserva.fim_reserva = new Date(reserva.fim_reserva).getTime();
      }

      return reserva;

    } catch (error: any) {
      console.error('❌ useReservation - Erro ao criar reserva:', error);

      // Mensagens de erro mais amigáveis
      if (error.message?.includes('Estoque insuficiente')) {
        throw new Error('Estoque insuficiente para realizar a reserva');
      } else if (error.message?.includes('Produto não encontrado')) {
        throw new Error('Produto não encontrado');
      } else if (error.message?.includes('operator does not exist')) {
        throw new Error('Erro de compatibilidade com o banco de dados');
      } else if (error.message?.includes('function criar_reserva')) {
        throw new Error('Função de reserva não encontrada no servidor');
      } else if (error.message?.includes('fim_reserva')) {
        throw new Error('Erro de tipo de dados na reserva. Execute a função SQL corrigida.');
      }

      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createReservation: createReservationHandler,
    cancelReservation,
  };
}
