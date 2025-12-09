// SettingsModal.tsx - VERSÃO COMPLETA ATUALIZADA
import { useEffect, useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { notificationService } from '../../services/notificationService';
import { NotificationPreferences } from '../NotificationPreferences';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    categories,
    userPreferences,
    updatePreference,
    loading,
    notificationStatus,
    refreshData,
    userNotifications,
    unreadCount
  } = useNotification();

  const [testNotification, setTestNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // ✅ ATUALIZAÇÃO: Efeito para fechar modal com ESC
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handlePreferenceChange = async (categoryId: string, enabled: boolean) => {
    try {
      await updatePreference(categoryId, enabled);
      await refreshData();

      // ✅ ATUALIZAÇÃO: Usar o serviço de notificação completo
      if (enabled) {
        const category = categories.find(cat => cat.id === categoryId);

        await notificationService.sendCompleteNotification(
          '🔔 Notificações Ativadas!',
          `Agora você receberá alertas sobre ${category?.name || 'esta categoria'}`,
          'sistema'
        );

        setNotificationMessage(`Notificações para ${category?.name} ativadas!`);
        setTimeout(() => setNotificationMessage(''), 3000);
      }
    } catch (error) {
      console.error('Erro ao atualizar preferência:', error);
    }
  };

  const handleTestNotification = async () => {
    setTestNotification(true);

    // ✅ ATUALIZAÇÃO: Testar notificação completa usando o serviço
    await notificationService.sendCompleteNotification(
      '🎉 Notificação de Teste',
      'Esta é uma notificação de teste do sistema! Clique para verificar.',
      'teste',
      '/produtos'
    );

    setNotificationMessage('Notificação de teste enviada!');
    setTimeout(() => {
      setTestNotification(false);
      setNotificationMessage('');
    }, 3000);
  };

  const handleRequestPermission = async () => {
    // ✅ ATUALIZAÇÃO: Usar o serviço de notificação para solicitar permissão
    const granted = await notificationService.requestNotificationPermission();
    if (granted) {
      setNotificationMessage('Permissão concedida! 🎉');
    } else {
      setNotificationMessage('Permissão negada ou não suportada 😔');
    }
    setTimeout(() => setNotificationMessage(''), 3000);
    refreshData();
  };

  // ✅ ATUALIZAÇÃO: Função para limpar todas as notificações
  const handleClearAllNotifications = async () => {
    try {
      notificationService.clearAllNotifications();
      setNotificationMessage('Todas as notificações foram limpas!');
      setTimeout(() => setNotificationMessage(''), 3000);
      refreshData();
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Configurações de Notificação</h2>
            <p className="text-gray-600 mt-1">
              Configure suas preferências e teste as notificações
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold transition-colors"
          >
            ×
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {/* ✅ ATUALIZAÇÃO: Mensagem de Status melhorada */}
          {notificationMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg animate-pulse">
              <div className="flex items-center">
                <span className="text-lg mr-2">🔔</span>
                {notificationMessage}
              </div>
            </div>
          )}

          {/* ✅ ATUALIZAÇÃO: Painel de Controle de Notificações melhorado */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-blue-900">🎮 Controle de Notificações</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleTestNotification}
                  disabled={testNotification}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 transition"
                >
                  {testNotification ? '✅ Testado' : 'Testar Agora'}
                </button>
                <button
                  onClick={handleRequestPermission}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                >
                  Solicitar Permissão
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <span className="font-medium">Status do Som:</span>
                <span className="ml-2 text-green-600">✅ Ativo</span>
              </div>
              <div>
                <span className="font-medium">Permissão:</span>
                <span className={`ml-2 ${
                  notificationStatus.permission === 'granted' ? 'text-green-600' :
                  notificationStatus.permission === 'denied' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {notificationStatus.permission === 'granted' ? 'Concedida' :
                   notificationStatus.permission === 'denied' ? 'Negada' : 'Pendente'}
                </span>
              </div>
            </div>

            {/* ✅ ATUALIZAÇÃO: Estatísticas em Tempo Real */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Notificações:</span>
                <span className="ml-2 text-blue-600">
                  {userNotifications.length} no total
                </span>
              </div>
              <div>
                <span className="font-medium">Não lidas:</span>
                <span className={`ml-2 font-bold ${unreadCount > 0 ? 'text-orange-600 animate-pulse' : 'text-green-600'}`}>
                  {unreadCount}
                </span>
              </div>
            </div>

            {/* ✅ ATUALIZAÇÃO: Botão para limpar notificações */}
            <div className="mt-3 flex justify-between items-center">
              {notificationStatus.permission === 'denied' && (
                <div className="text-yellow-800 text-sm">
                  ⚠️ Para notificações do navegador, permita nas configurações.
                </div>
              )}
              <button
                onClick={handleClearAllNotifications}
                className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition"
              >
                Limpar Todas
              </button>
            </div>
          </div>

          {/* Preferências de Notificação */}
          <NotificationPreferences
            categories={categories}
            userPreferences={userPreferences}
            onPreferenceChange={handlePreferenceChange}
            loading={loading}
            title="Seleção de Categorias"
            description="Escolha para quais categorias você deseja receber notificações:"
          />

          {/* ✅ ATUALIZAÇÃO: Informações de Funcionamento melhoradas */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">🚀</span>
              Sistema de Notificações Ativo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
              <div className="flex items-center">
                <span className="mr-2">🔊</span>
                <span><strong>Som:</strong> Ativo em todos os navegadores</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">📱</span>
                <span><strong>Notificações:</strong> Browser + In-app</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">⚡</span>
                <span><strong>Tempo Real:</strong> Sincronizado com a loja</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">🎯</span>
                <span><strong>Ações:</strong> Clique para navegar</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">🔄</span>
                <span><strong>Atualizações:</strong> Automáticas em tempo real</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">📊</span>
                <span><strong>Estatísticas:</strong> Monitoramento contínuo</span>
              </div>
            </div>
          </div>

          {/* ✅ ATUALIZAÇÃO: Seção de Dicas */}
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-yellow-900 mb-2 flex items-center">
              <span className="mr-2">💡</span>
              Dicas de Uso
            </h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• <strong>Teste as notificações</strong> para verificar o som e visual</li>
              <li>• <strong>Solicite permissão</strong> para receber alertas do navegador</li>
              <li>• <strong>Selecione categorias</strong> que mais te interessam</li>
              <li>• <strong>Notificações funcionam</strong> mesmo sem permissão do navegador</li>
              <li>• <strong>Clique nas notificações</strong> para acessar conteúdo relacionado</li>
            </ul>
          </div>
        </div>

        {/* ✅ ATUALIZAÇÃO: Footer melhorado */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Sistema atualizado em tempo real
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-300 transition"
            >
              Fechar
            </button>
            <button
              onClick={refreshData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? 'Atualizando...' : 'Aplicar Configurações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
