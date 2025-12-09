// src/hooks/useReservas.ts
import { useEffect, useState } from 'react';
import { Reserva, reservationService } from '../services/reservationService';

export function useReservas(clienteId?: string) {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarReservas = async () => {
    try {
      setLoading(true);
      const reservasAtivas = await reservationService.getReservasAtivas(clienteId);
      setReservas(reservasAtivas);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar reservas');
      setReservas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarReservas();
  }, [clienteId]);

  const atualizarReservas = () => {
    carregarReservas();
  };

  return {
    reservas,
    loading,
    error,
    atualizarReservas
  };
}
