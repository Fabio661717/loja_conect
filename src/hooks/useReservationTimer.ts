// src/hooks/useReservationTimer.ts
import { useCallback, useEffect, useState } from 'react';
import { reservationService } from '../services/reservationService';

interface UseReservationTimerProps {
  reservaId: string;
  fimReserva: string;
  produtoNome?: string;
  onExpire?: () => void;
}

export function useReservationTimer({
  reservaId,
  fimReserva,
  onExpire
}: UseReservationTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  const calculateTimeLeft = useCallback((): number => {
    try {
      const agora = new Date();
      const fim = new Date(fimReserva);

      if (isNaN(fim.getTime())) {
        return 0;
      }

      const diferenca = fim.getTime() - agora.getTime();
      return Math.max(0, diferenca);
    } catch (error) {
      return 0;
    }
  }, [fimReserva]);

  useEffect(() => {
    const updateTimer = () => {
      const calculatedTimeLeft = calculateTimeLeft();
      setTimeLeft(calculatedTimeLeft);

      if (calculatedTimeLeft <= 0 && !isExpired) {
        setIsExpired(true);
        if (onExpire) {
          onExpire();
        }
      }
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);

    return () => clearInterval(timerId);
  }, [fimReserva, calculateTimeLeft, isExpired, onExpire]);

  const formatTime = useCallback(() => {
    if (timeLeft <= 0) {
      return {
        hours: '00',
        minutes: '00',
        seconds: '00',
        totalHours: 0,
        totalMinutes: 0
      };
    }

    const totalSeconds = Math.floor(timeLeft / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
      totalHours: hours,
      totalMinutes: hours * 60 + minutes
    };
  }, [timeLeft]);

  const progress = Math.min((timeLeft / (2 * 60 * 60 * 1000)) * 100, 100);

  const renovarReserva = async (horas: number = 2) => {
    return await reservationService.renovarReserva(reservaId, horas);
  };

  const cancelarReserva = async () => {
    return await reservationService.cancelarReserva(reservaId);
  };

  // MÉTODO ADICIONADO PARA CORRIGIR O ERRO
  const agendarParaDepois = async () => {
    try {
      // Implementação temporária - você pode ajustar conforme sua lógica de negócio
      const result = await reservationService.renovarReserva(reservaId, 24); // Agenda para 24 horas depois
      return {
        success: result.success,
        message: result.message || 'Reserva agendada para depois com sucesso!'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Erro ao agendar reserva para depois'
      };
    }
  };

  return {
    timeLeft,
    isExpired,
    progress,
    formatTime,
    renovarReserva,
    cancelarReserva,
    agendarParaDepois // MÉTODO ADICIONADO NO RETURN
  };
}
