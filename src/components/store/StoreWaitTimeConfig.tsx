// components/StoreWaitTimeConfig.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';

interface StoreWaitTimeConfigProps {
  lojaId: string;
}

export const StoreWaitTimeConfig: React.FC<StoreWaitTimeConfigProps> = ({ lojaId }) => {
  const [waitTime, setWaitTime] = useState<number>(8);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  const waitTimeOptions = [
    { value: 6, label: '6 horas' },
    { value: 8, label: '8 horas' },
    { value: 12, label: '12 horas' },
    { value: 24, label: '24 horas' }
  ];

  useEffect(() => {
    loadCurrentWaitTime();
  }, [lojaId]);

  const loadCurrentWaitTime = async () => {
    try {
      const { data, error } = await supabase
        .from('lojas')
        .select('wait_time')
        .eq('id', lojaId)
        .single();

      if (error) throw error;
      if (data?.wait_time) {
        setWaitTime(data.wait_time);
      }
    } catch (error) {
      console.error('Erro ao carregar tempo de espera:', error);
    }
  };

  const saveWaitTime = async (newWaitTime: number) => {
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('lojas')
        .update({ wait_time: newWaitTime })
        .eq('id', lojaId);

      if (error) throw error;

      setWaitTime(newWaitTime);
      setMessage('Tempo de espera atualizado com sucesso!');

      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao salvar tempo de espera:', error);
      setMessage('Erro ao atualizar tempo de espera.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        ⏰ Tempo de Espera Padrão
      </h2>

      <p className="text-gray-600 mb-4">
        Configure o tempo padrão para novas reservas:
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {waitTimeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => saveWaitTime(option.value)}
            disabled={loading}
            className={`p-3 rounded-lg border-2 transition-all ${
              waitTime === option.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="font-medium">{option.label}</div>
          </button>
        ))}
      </div>

      {message && (
        <div className={`p-3 rounded-lg ${
          message.includes('Erro')
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message}
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Configuração atual:</strong> {waitTime} horas
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Todas as novas reservas usarão este tempo padrão automaticamente.
        </p>
      </div>
    </div>
  );
};
