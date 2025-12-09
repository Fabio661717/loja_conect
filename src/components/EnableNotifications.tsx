// src/components/EnableNotifications.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { pushSubscriptionService } from '../services/pushSubscription';

interface NotificationStatus {
  isSubscribed: boolean;
  permission: NotificationPermission;
  isSupported: boolean;
}

export function EnableNotifications() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<NotificationStatus>({
    isSubscribed: false,
    permission: 'default',
    isSupported: false
  });

  const checkStatus = async () => {
    if (!user) return;

    try {
      const isSubscribed = await pushSubscriptionService.isUserSubscribed(user.id);
      const permission = pushSubscriptionService.getPermissionState();
      const isSupported = pushSubscriptionService.isPushSupported();

      setStatus({ isSubscribed, permission, isSupported });
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  useEffect(() => {
    if (user) {
      checkStatus();
    }
  }, [user]);

  const enableNotifications = async () => {
    if (!user) return;

    setLoading(true);
    setMessage('');

    try {
const success = await pushSubscriptionService.initialize(user.id);

      if (success) {
        setMessage('✅ Notificações ativadas com sucesso! Você receberá alertas no celular.');
        setTimeout(() => checkStatus(), 2000);
      } else {
        setMessage('❌ Não foi possível ativar notificações. Verifique as permissões do navegador.');
      }
    } catch (error) {
      setMessage('❌ Erro ao ativar notificações. Tente novamente.');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const disableNotifications = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const success = await pushSubscriptionService.unsubscribeUser();

      if (success) {
        setMessage('🔕 Notificações desativadas.');
        checkStatus();
      } else {
        setMessage('❌ Erro ao desativar notificações.');
      }
    } catch (error) {
      setMessage('❌ Erro ao desativar notificações.');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.type !== 'cliente') return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="text-blue-600 text-xl mt-1">🔔</div>

        <div className="flex-1">
          <h3 className="font-semibold text-blue-800">Receba Notificações no Celular!</h3>
          <p className="text-blue-700 text-sm mt-1">
            Ative as notificações para receber alertas quando novos produtos chegarem nas suas categorias favoritas.
          </p>

          <div className="mt-3 p-2 bg-white rounded border text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-medium">Navegador:</span>{' '}
                {status.isSupported ? '✅ Compatível' : '❌ Incompatível'}
              </div>
              <div>
                <span className="font-medium">Permissão:</span>{' '}
                {status.permission === 'granted' ? '✅ Concedida' :
                 status.permission === 'denied' ? '❌ Negada' : '⚠️ Pendente'}
              </div>
              <div>
                <span className="font-medium">Inscrição:</span>{' '}
                {status.isSubscribed ? '✅ Ativa' : '❌ Inativa'}
              </div>
            </div>
          </div>

          {message && (
            <p className={`text-sm mt-2 p-2 rounded ${
              message.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' :
              message.includes('🔕') ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
              'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {!status.isSubscribed ? (
            <button
              onClick={enableNotifications}
              disabled={loading || !status.isSupported || status.permission === 'denied'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {loading ? 'Ativando...' : 'Ativar Notificações'}
            </button>
          ) : (
            <button
              onClick={disableNotifications}
              disabled={loading}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md disabled:opacity-50 transition duration-200"
            >
              {loading ? 'Desativando...' : 'Desativar Notificações'}
            </button>
          )}

          {status.permission === 'denied' && (
            <p className="text-red-600 text-xs text-center">
              ⚠️ Permissão negada. Ative nas configurações do navegador.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
