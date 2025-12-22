// src/components/store/Timer.tsx - VERSÃO COMPLETA ATUALIZADA
import { useEffect, useState } from "react";
import { useSettings } from "../../context/SettingsContext";
import { useAuth } from "../../hooks/useAuth";
import { useSupabase } from "../../hooks/useSupabase";

interface TimerProps {
  fimReserva?: number; // Timestamp em milissegundos
  onExpired?: () => void;
  mode?: 'display' | 'config';
}

export default function Timer({ fimReserva, onExpired, mode = 'display' }: TimerProps) {
  const { user } = useAuth();
  const { getStoreByOwner, updateStoreWaitTime } = useSupabase();
  const { theme } = useSettings();

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [selectedTime, setSelectedTime] = useState<number>(6);
  const [store, setStore] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Modo configuração - para o painel da loja
  useEffect(() => {
    if (mode === 'config' && user) {
      loadStoreConfig();
    }
  }, [user, mode]);

  // Modo display - para contagem regressiva (ATUALIZADO)
  useEffect(() => {
    if (mode === 'display' && fimReserva) {
      const calculateTimeLeft = () => {
        const now = Date.now();
        const difference = fimReserva - now;

        if (difference <= 0) {
          setIsExpired(true);
          setTimeLeft(0);
          onExpired?.();
          return;
        }

        setTimeLeft(difference);
        setIsExpired(false);
      };

      calculateTimeLeft();

      const timer = setInterval(calculateTimeLeft, 1000);

      return () => clearInterval(timer);
    }
  }, [fimReserva, mode, onExpired]);

  const loadStoreConfig = async () => {
    try {
      const storeData = await getStoreByOwner();
      setStore(storeData);
      if (storeData?.wait_time) {
        setSelectedTime(storeData.wait_time);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações da loja:", error);
    }
  };

  const handleTimeSave = async (hours: number) => {
    if (!store?.id) return;

    setSaving(true);
    try {
      await updateStoreWaitTime(store.id, hours);
      setSelectedTime(hours);
      alert(`Tempo de espera configurado para ${hours} horas`);
    } catch (error: any) {
      console.error("Erro ao salvar tempo:", error);
      alert(error.message || "Erro ao configurar tempo");
    } finally {
      setSaving(false);
    }
  };

  // ✅ FUNÇÃO ATUALIZADA: Formatação melhorada
  const formatTime = (milliseconds: number) => {
    if (milliseconds <= 0) {
      return {
        hours: "00",
        minutes: "00",
        seconds: "00",
        totalHours: 0,
        displayText: "Expirada"
      };
    }

    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      hours: hours.toString().padStart(2, "0"),
      minutes: minutes.toString().padStart(2, "0"),
      seconds: seconds.toString().padStart(2, "0"),
      totalHours: hours,
      displayText: hours > 0
        ? `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`
        : `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    };
  };

  // ✅ FUNÇÃO ATUALIZADA: Cores baseadas no tema
 

  // Modo de configuração
  if (mode === 'config') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className={`
            rounded-lg shadow p-6
            ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"}
          `}>
            <h1 className="text-2xl font-bold mb-2">
              ⏰ Configurar Tempo de Espera
            </h1>
            <p className={`
              mb-6
              ${theme === "dark" ? "text-gray-300" : "text-gray-600"}
            `}>
              Defina o tempo padrão para reservas dos clientes. Este tempo será aplicado automaticamente a todas as novas reservas.
            </p>

            {/* Tempos pré-definidos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[6, 8, 12, 24].map((hours) => (
                <button
                  key={hours}
                  onClick={() => handleTimeSave(hours)}
                  disabled={saving}
                  className={`
                    p-4 rounded-lg border-2 transition-all duration-200
                    ${selectedTime === hours
                      ? theme === "dark"
                        ? 'border-blue-500 bg-blue-900 text-blue-100 shadow-md'
                        : 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                      : theme === "dark"
                        ? 'border-gray-600 bg-gray-700 text-gray-300 hover:border-blue-400 hover:shadow-sm'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:shadow-sm'
                    }
                    ${saving ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="text-2xl font-bold mb-1">{hours}h</div>
                  <div className={`
                    text-sm
                    ${theme === "dark" ? "text-gray-400" : "text-gray-500"}
                  `}>
                    {hours === 6 && '⏱️ Padrão'}
                    {hours === 8 && '🕗 1 Turno'}
                    {hours === 12 && '🌗 Meio Dia'}
                    {hours === 24 && '🌙 1 Dia'}
                  </div>
                </button>
              ))}
            </div>

            {/* Tempo personalizado */}
            <div className={`
              rounded-lg p-4 mb-6
              ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}
            `}>
              <h3 className={`
                font-semibold mb-3
                ${theme === "dark" ? "text-gray-200" : "text-gray-900"}
              `}>
                Tempo Personalizado
              </h3>
              <div className="flex gap-3">
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(Number(e.target.value))}
                  className={`
                    flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${theme === "dark"
                      ? "bg-gray-600 border-gray-500 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                    }
                  `}
                >
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((hour) => (
                    <option key={hour} value={hour}>
                      {hour} {hour === 1 ? 'hora' : 'horas'}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleTimeSave(selectedTime)}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md transition duration-200"
                >
                  {saving ? 'Salvando...' : 'Aplicar'}
                </button>
              </div>
            </div>

            {/* Informações */}
            <div className={`
              border rounded-lg p-4
              ${theme === "dark" ? "bg-blue-900 border-blue-700" : "bg-blue-50 border-blue-200"}
            `}>
              <h4 className={`
                font-semibold mb-2
                ${theme === "dark" ? "text-blue-100" : "text-blue-900"}
              `}>
                💡 Como funciona?
              </h4>
              <ul className={`
                text-sm space-y-1
                ${theme === "dark" ? "text-blue-300" : "text-blue-800"}
              `}>
                <li>• O tempo define por quanto tempo o produto ficará reservado</li>
                <li>• Após expirar, a reserva é cancelada automaticamente</li>
                <li>• O estoque é restaurado quando a reserva expira</li>
                <li>• Clientes recebem notificações antes da expiração</li>
              </ul>
            </div>

            {/* Status atual */}
            <div className={`
              mt-6 p-4 border rounded-lg
              ${theme === "dark" ? "bg-green-900 border-green-700" : "bg-green-50 border-green-200"}
            `}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`
                    font-semibold
                    ${theme === "dark" ? "text-green-100" : "text-green-900"}
                  `}>
                    ⏰ Tempo Atual Configurado
                  </p>
                  <p className={theme === "dark" ? "text-green-300" : "text-green-700"}>
                    {selectedTime} {selectedTime === 1 ? 'hora' : 'horas'}
                  </p>
                </div>
                <div className="text-3xl">🕐</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Modo de exibição (contagem regressiva) - ATUALIZADO
  if (mode === 'display') {
    const { hours, minutes, seconds, totalHours, displayText: _displayText } = formatTime(timeLeft);

    if (isExpired) {
      return (
        <div className={`
          p-2 rounded-lg text-center text-sm
          ${theme === "dark"
            ? "bg-red-900 text-red-200"
            : "bg-red-100 text-red-700"
          }
        `}>
          <p className="font-semibold">⏰ Tempo Esgotado!</p>
        </div>
      );
    }

    return (
      <div className={`
        p-3 rounded-lg border text-center
        ${theme === "dark"
          ? "bg-blue-900 border-blue-700"
          : "bg-blue-50 border-blue-200"
        }
      `}>
        <p className={`
          font-semibold mb-2 text-sm
          ${theme === "dark" ? "text-blue-200" : "text-blue-800"}
        `}>
          ⏳ Tempo Restante
        </p>

        {/* Display do timer */}
        <div className="flex justify-center items-center space-x-1 text-lg font-mono font-bold">
          <div className={`
            px-2 py-1 rounded
            ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"}
          `}>
            {hours}
          </div>
          <span>:</span>
          <div className={`
            px-2 py-1 rounded
            ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"}
          `}>
            {minutes}
          </div>
          <span>:</span>
          <div className={`
            px-2 py-1 rounded
            ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"}
          `}>
            {seconds}
          </div>
        </div>

        {/* Texto descritivo */}
        <p className={`
          text-xs mt-1
          ${theme === "dark" ? "text-blue-300" : "text-blue-600"}
        `}>
          {totalHours > 0
            ? `${totalHours} hora${totalHours > 1 ? 's' : ''} restante${totalHours > 1 ? 's' : ''}`
            : 'Menos de 1 hora restante'
          }
        </p>

        {/* Barra de progresso (opcional) */}
        <div className={`
          w-full h-1 rounded-full mt-2
          ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}
        `}>
          <div
            className={`
              h-full rounded-full transition-all duration-1000
              ${timeLeft < 30 * 60 * 1000 // Menos de 30 minutos
                ? "bg-red-500"
                : timeLeft < 2 * 60 * 60 * 1000 // Menos de 2 horas
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }
            `}
            style={{
              width: `${Math.min(100, (timeLeft / (24 * 60 * 60 * 1000)) * 100)}%`
            }}
          />
        </div>
      </div>
    );
  }

  return null;
}
