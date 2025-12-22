// src/components/client/ReservaItem.tsx - NOVO COMPONENTE
import React from 'react';
import { useReservationUpdates } from '../../hooks/useReservationUpdates';
import ReservationTimer from './ReservationTimer';

interface ReservaItemProps {
  reserva: {
    id: string;
    produto_id: string;
    produto_nome: string;
    fim_reserva: string;
    status: string;
    quantidade: number;
    tamanho?: string;
    created_at: string;
  };
  onStatusChange?: (reservaId: string, novoStatus: string) => void;
}

export const ReservaItem: React.FC<ReservaItemProps> = ({
  reserva,
  onStatusChange
}) => {
  useReservationUpdates(reserva.id);

  const handleExpired = () => {
    onStatusChange?.(reserva.id, 'expirada');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 dark:text-white">
            {reserva.produto_nome}
          </h3>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Qtd: {reserva.quantidade}
            </span>
            {reserva.tamanho && (
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Tamanho: {reserva.tamanho}
              </span>
            )}
            <span className={`text-sm px-2 py-1 rounded ${
              reserva.status === 'pendente'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : reserva.status === 'renovada'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : reserva.status === 'expirada'
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}>
              {reserva.status.charAt(0).toUpperCase() + reserva.status.slice(1)}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Reservado em: {new Date(reserva.created_at).toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      {(reserva.status === 'pendente' || reserva.status === 'renovada') ? (
        <ReservationTimer
          reservaId={reserva.id}
          fimReserva={reserva.fim_reserva}
          produtoNome={reserva.produto_nome}
          onExpired={handleExpired}
          showActions={true}
        />
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-500 dark:text-gray-400">
            {reserva.status === 'expirada'
              ? '⏰ Esta reserva expirou'
              : reserva.status === 'cancelada'
              ? '❌ Esta reserva foi cancelada'
              : '✅ Esta reserva foi finalizada'
            }
          </p>
          {reserva.status === 'expirada' && (
            <button className="mt-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded text-sm font-medium transition-colors">
              Tentar Novamente
            </button>
          )}
        </div>
      )}
    </div>
  );
};
