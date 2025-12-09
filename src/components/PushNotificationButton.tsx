// loja-conect/src/components/PushNotificationButton.tsx
import React, { useState } from 'react';
import { notificationService } from '../services/notificationService';

interface PushNotificationButtonProps {
  categoryId: string;
  storeId: string;
  onNotificationSent?: (success: boolean) => void;
}

export const PushNotificationButton: React.FC<PushNotificationButtonProps> = ({
  categoryId,
  storeId,
  onNotificationSent
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');

  // ✅ CORREÇÃO: Armazenar o resultado da função em uma variável antes de comparar
  const handleTestNotification = async () => {
    if (!categoryId || !storeId) {
      setLastResult('❌ Categoria ou Loja ID não fornecidos');
      return;
    }

    setIsLoading(true);
    setLastResult('');

    try {
      // ✅ CORREÇÃO CRÍTICA: Armazenar o resultado da função em uma variável
      const result = await notificationService.testNotification(categoryId, storeId);

      // ✅ AGORA podemos comparar corretamente, pois 'result' é um objeto, não void
      if (result.success === true) {
        setLastResult('✅ ' + result.message);
        onNotificationSent?.(true);
      } else {
        setLastResult('❌ ' + result.message);
        onNotificationSent?.(false);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setLastResult('❌ Erro: ' + errorMessage);
      onNotificationSent?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ CORREÇÃO ALTERNATIVA: Se a função originalmente não retornava nada (void)
  // e você estava comparando incorretamente, aqui está a versão corrigida:
  const handleTestNotificationAlternative = async () => {
    if (!categoryId || !storeId) {
      setLastResult('❌ Categoria ou Loja ID não fornecidos');
      return;
    }

<button onClick={handleTestNotificationAlternative}>
  Testar Notificação Alternativa
</button>


    setIsLoading(true);
    setLastResult('');

    try {
      // Se a função realmente retorna void, não faça comparação
      await notificationService.testNotification(categoryId, storeId);

      // ✅ CORREÇÃO: Em vez de comparar, assuma sucesso ou use callbacks
      setLastResult('✅ Notificação de teste enviada com sucesso!');
      onNotificationSent?.(true);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setLastResult('❌ Erro: ' + errorMessage);
      onNotificationSent?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleTestNotification}
        disabled={isLoading || !categoryId || !storeId}
        className={`
          px-4 py-2 rounded-lg font-medium text-sm
          ${isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
          }
          text-white transition-colors
        `}
      >
        {isLoading ? '🔄 Enviando...' : '🧪 Testar Notificação'}
      </button>

      {lastResult && (
        <div className={`
          text-sm p-2 rounded border
          ${lastResult.includes('✅')
            ? 'bg-green-50 text-green-800 border-green-200'
            : 'bg-red-50 text-red-800 border-red-200'
          }
        `}>
          {lastResult}
        </div>
      )}

      {(!categoryId || !storeId) && (
        <div className="text-yellow-600 text-xs bg-yellow-50 p-2 rounded border border-yellow-200">
          ⚠️ Selecione uma categoria e loja para testar notificações
        </div>
      )}
    </div>
  );
};

export default PushNotificationButton;
