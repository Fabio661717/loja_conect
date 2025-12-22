// src/hooks/useCreateReserva.ts
import { useState } from 'react';
import { CreateReservaData, reservationService } from '../services/reservationService';

export function useCreateReserva() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const criarReserva = async (reservaData: CreateReservaData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await reservationService.criarReserva(reservaData);

      if (result.success) {
        return {
          success: true,
          data: result.data,
          message: result.message
        };
      } else {
        setError(result.message || 'Erro ao criar reserva');
        return {
          success: false,
          message: result.message
        };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro desconhecido ao criar reserva';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    criarReserva,
    loading,
    error,
    clearError
  };
}
