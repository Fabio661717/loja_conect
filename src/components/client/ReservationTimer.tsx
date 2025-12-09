// src/components/client/ReservationTimer.tsx - VERSÃO ATUALIZADA
import { useSettings } from '../../context/SettingsContext';
import { useReservationTimer } from '../../hooks/useReservationTimer';

interface ReservationTimerProps {
  reservaId: string;
  fimReserva: string;
  produtoNome?: string;
  onExpired?: () => void;
  showActions?: boolean;
}

export default function ReservationTimer({
  reservaId,
  fimReserva,
  produtoNome = 'Produto',
  onExpired,
  showActions = true
}: ReservationTimerProps) {
  const { theme } = useSettings();

  const {
    timeLeft,
    isExpired,
    progress,
    formatTime,
    renovarReserva,
    cancelarReserva,
    agendarParaDepois
  } = useReservationTimer({
    reservaId,
    fimReserva,
    produtoNome,
    onExpire: onExpired
  });

  const formattedTime = formatTime();

  // Determinar cor baseada no progresso
  const getProgressColor = () => {
    if (progress > 60) return theme === 'dark' ? 'bg-green-500' : 'bg-green-500';
    if (progress > 30) return theme === 'dark' ? 'bg-yellow-500' : 'bg-yellow-500';
    return theme === 'dark' ? 'bg-red-500' : 'bg-red-500';
  };

  const getTimerColor = () => {
    if (progress > 60) return theme === 'dark' ? 'text-green-400' : 'text-green-600';
    if (progress > 30) return theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600';
    return theme === 'dark' ? 'text-red-400' : 'text-red-600';
  };

  const getBackgroundColor = () => {
    if (isExpired) {
      return theme === 'dark' ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200';
    }
    return theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  };

  const getTextColor = () => {
    return theme === 'dark' ? 'text-white' : 'text-gray-900';
  };

  const getSecondaryTextColor = () => {
    return theme === 'dark' ? 'text-gray-300' : 'text-gray-600';
  };

  const handleRenovar = async () => {
    const result = await renovarReserva(8);
    if (result.success) {
      // Feedback visual pode ser adicionado aqui
      console.log('Reserva renovada com sucesso!');
    }
  };

  const handleAgendar = async () => {
    const result = await agendarParaDepois();
    if (result.success) {
      // Feedback visual pode ser adicionado aqui
      console.log('Reserva agendada para depois!');
    }
  };

  const handleCancelar = async () => {
    const result = await cancelarReserva();
    if (result.success) {
      // Feedback visual pode ser adicionado aqui
      console.log('Reserva cancelada!');
    }
  };

  if (isExpired) {
    return (
      <div className={`p-4 rounded-lg border ${getBackgroundColor()}`}>
        <div className="text-center">
          <p className={`font-semibold ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>
            ⏰ Tempo Esgotado!
          </p>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-red-200' : 'text-red-600'}`}>
            Sua reserva expirou e o produto foi liberado.
          </p>

          {showActions && (
            <div className="mt-4 flex space-x-2">
              <button
                onClick={handleRenovar}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
              >
                ✅ Renovar
              </button>
              <button
                onClick={handleAgendar}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
              >
                📅 Agendar
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border shadow-sm p-4 ${getBackgroundColor()}`}>
      {/* Cabeçalho */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className={`font-semibold ${getTextColor()}`}>⏳ Tempo Restante</h3>
          <p className={`text-sm ${getSecondaryTextColor()}`}>
            {formattedTime.totalHours > 0
              ? `${formattedTime.totalHours}h ${formattedTime.minutes}m restantes`
              : `${formattedTime.totalMinutes}m restantes`
            }
          </p>
        </div>
        <div className={`text-sm font-medium ${getTimerColor()}`}>
          {Math.round(progress)}%
        </div>
      </div>

      {/* Barra de Progresso */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ${getProgressColor()}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Temporizador */}
      <div className="text-center mb-4">
        <div className={`text-2xl font-mono font-bold ${getTimerColor()}`}>
          {formattedTime.hours}:{formattedTime.minutes}:{formattedTime.seconds}
        </div>
        <p className={`text-xs mt-1 ${getSecondaryTextColor()}`}>
          Horas : Minutos : Segundos
        </p>
      </div>

      {/* Status de Urgência */}
      <div className="text-center mb-4">
        <p className={`text-sm font-medium ${getTimerColor()}`}>
          {timeLeft < 30 * 60 * 1000
            ? "⏰ Reserve com urgência!"
            : timeLeft < 2 * 60 * 60 * 1000
              ? "⏳ Tempo está passando..."
              : "✅ Tempo suficiente"
          }
        </p>
      </div>

      {/* Ações */}
      {showActions && (
        <div className="flex space-x-2">
          <button
            onClick={handleRenovar}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
          >
            ✅ Renovar
          </button>
          <button
            onClick={handleCancelar}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
          >
            ❌ Cancelar
          </button>
          <button
            onClick={handleAgendar}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
          >
            📅 Agendar
          </button>
        </div>
      )}
    </div>
  );
}
