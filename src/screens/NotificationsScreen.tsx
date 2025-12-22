// src/screens/NotificationsScreen.tsx - VERSÃO LIMPA E CORRIGIDA
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationPreferences } from '../components/NotificationPreferences';
import { useCategory } from '../context/CategoryContext';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../hooks/useAuth';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { notificationService } from '../services/notificationService';

export const NotificationsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Hooks
  const {
    requestPermission,
    requestPermissionWithModal: _requestPermissionWithModal,
    status,
    supported,
    canRequestPermission,
    isBlocked
  } = usePushNotifications();

  const {
    userNotifications,
    categories,
    userPreferences,
    loading,
    updatePreference,
    markAsRead,
    deleteNotification,
    refreshData,
    notificationStatus,
    addNotification
  } = useNotification();

  const { notificationCategories, refreshNotificationCategories } = useCategory();

  // Estados locais
  const [localLoading, setLocalLoading] = useState(false);
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);

  // Combinar categorias de forma otimizada
  const allCategories = useMemo(() => {
    const combined = [...categories, ...notificationCategories];
    const uniqueMap = new Map();
    combined.forEach(cat => {
      if (!uniqueMap.has(cat.id)) {
        uniqueMap.set(cat.id, cat);
      }
    });
    return Array.from(uniqueMap.values());
  }, [categories, notificationCategories]);

  // Verificar contexto da loja
  const currentStoreId = localStorage.getItem('storeId');
  const hasStoreContext = !!currentStoreId || !!user?.lojaId;

  // Efeitos
  useEffect(() => {
    if (canRequestPermission && supported && canRequestPermission()) {
      setShowPermissionBanner(true);
    }
    refreshNotificationCategories();
  }, [canRequestPermission, supported, refreshNotificationCategories]);

  // Handlers
  const handlePreferenceChange = async (categoryId: string, enabled: boolean) => {
    setLocalLoading(true);
    try {
      await updatePreference(categoryId, enabled);
      addNotification(
        enabled
          ? `Notificações ativadas para esta categoria ✅`
          : `Notificações desativadas para esta categoria 🔕`,
        "success"
      );
    } catch (error) {
      console.error("Erro ao atualizar preferência:", error);
      addNotification("Erro ao atualizar preferência", "error");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleToggleAllPreferences = async (enabled: boolean) => {
    setLocalLoading(true);
    try {
      // Tentar usar o service primeiro
      if (notificationService.toggleAllNotificationPreferences) {
        await notificationService.toggleAllNotificationPreferences(user?.id, enabled);
      } else {
        // Fallback: atualizar individualmente
        console.log('Usando fallback para toggleAllPreferences');
        for (const pref of userPreferences) {
          await updatePreference(pref.category_id, enabled);
        }
      }

      addNotification(
        enabled
          ? "Todas as notificações ativadas! 🔔"
          : "Todas as notificações desativadas! 🔕",
        "success"
      );
      await refreshData();
    } catch (error) {
      console.error("Erro ao alternar todas as preferências:", error);
      addNotification("Erro ao atualizar preferências", "error");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleRequestPermission = async () => {
    setLocalLoading(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        addNotification("Permissão concedida! 🔔 Agora você receberá notificações push.", "success");
        setShowPermissionBanner(false);
      } else {
        addNotification("Permissão não concedida - você ainda receberá notificações dentro do app 📱", "info");
      }
    } catch (error) {
      console.error("❌ Erro ao solicitar permissão:", error);
      addNotification("Erro ao solicitar permissão", "error");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLocalLoading(true);
    try {
      await refreshData();
      await refreshNotificationCategories();
      addNotification("Dados atualizados com sucesso! 🔄", "success");
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
      addNotification("Erro ao atualizar dados", "error");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = userNotifications.filter(n => !n.is_read);
    const unreadCount = unreadNotifications.length;

    if (unreadCount === 0) {
      addNotification("Não há notificações não lidas", "info");
      return;
    }

    if (confirm(`Deseja marcar ${unreadCount} notificação(ões) como lida(s)?`)) {
      setLocalLoading(true);
      try {
        // Processar em batch para melhor performance
        const promises = unreadNotifications.map(notif => markAsRead(notif.id));
        await Promise.all(promises);
        addNotification(`Todas as notificações marcadas como lidas! ✅`, "success");
      } catch (error) {
        console.error("Erro ao marcar notificações como lidas:", error);
        addNotification("Erro ao marcar notificações como lidas", "error");
      } finally {
        setLocalLoading(false);
      }
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (confirm('Tem certeza que deseja excluir esta notificação?')) {
      try {
        await deleteNotification(notificationId);
        addNotification("Notificação excluída com sucesso", "success");
      } catch (error) {
        console.error("Erro ao excluir notificação:", error);
        addNotification("Erro ao excluir notificação", "error");
      }
    }
  };

  // Renderização de itens de notificação
  const renderNotificationItem = (notif: any) => (
    <div
      key={notif.id}
      className={`p-4 border rounded-lg transition-all duration-200 ${
        notif.is_read
          ? 'bg-gray-50 border-gray-200 hover:bg-gray-100'
          : 'bg-blue-50 border-blue-200 hover:bg-blue-100 shadow-sm'
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-medium ${notif.is_read ? 'text-gray-800' : 'text-blue-800'}`}>
              {notif.title}
            </h3>
            {!notif.is_read && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                NOVA
              </span>
            )}
            {notif.source === 'local' && (
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                LOCAL
              </span>
            )}
          </div>
          <p className="text-gray-600 text-sm mt-1">{notif.message}</p>

          <div className="flex flex-wrap gap-2 mt-2">
            {notif.category && (
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                {notif.category}
              </span>
            )}
            <span className="text-gray-400 text-xs">
              {new Date(notif.created_at).toLocaleString('pt-BR')}
            </span>
          </div>
        </div>

        <div className="flex gap-1 ml-4">
          {!notif.is_read && (
            <button
              onClick={() => markAsRead(notif.id)}
              className="text-green-600 hover:text-green-800 text-sm p-2 rounded hover:bg-green-50 transition-colors"
              title="Marcar como lida"
              disabled={localLoading}
            >
              ✅
            </button>
          )}
          <button
            onClick={() => handleDeleteNotification(notif.id)}
            className="text-red-600 hover:text-red-800 text-sm p-2 rounded hover:bg-red-50 transition-colors"
            title="Excluir notificação"
            disabled={localLoading}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );

  // Estatísticas
  const stats = {
    activeCategories: userPreferences.filter(p => p.is_enabled).length,
    availableCategories: allCategories.filter(cat => cat.is_active).length,
    unreadNotifications: userNotifications.filter(n => !n.is_read).length,
    totalNotifications: userNotifications.length
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-800 mb-4 text-sm font-medium transition-colors"
            >
              ← Voltar para Início
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                🔔 Central de Notificações
              </h1>
              {(localLoading || loading) && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              )}
            </div>
            <p className="text-gray-600 mt-2">
              Configure suas preferências e veja todas as notificações recebidas
            </p>

            {/* Status do sistema */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                notificationStatus.functional
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {notificationStatus.functional ? '✅ Sistema Funcional' : '❌ Sistema com Problemas'}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                status === 'granted'
                  ? 'bg-green-100 text-green-800'
                  : status === 'denied'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {status === 'granted' ? '🔔 Push Ativo' :
                 status === 'denied' ? '🔕 Push Bloqueado' :
                 '⏳ Aguardando Permissão'}
              </span>
              {!hasStoreContext && (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                  ⚠️ Sem Loja Ativa
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {stats.unreadNotifications > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={localLoading}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
              >
                ✅ Marcar Todas como Lidas
              </button>
            )}
            <button
              onClick={handleRefresh}
              disabled={localLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              🔄 Atualizar
            </button>
          </div>
        </div>

        {/* Banner de permissão */}
        {showPermissionBanner && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800 flex items-center gap-2">
                  <span>🔔</span>
                  Ativar Notificações Push?
                </h3>
                <p className="text-blue-600 text-sm mt-1">
                  Receba alertas direto no seu dispositivo sobre promoções exclusivas e novidades.
                  <br />
                  <strong className="text-blue-700">Funciona mesmo se você recusar! Você ainda receberá notificações dentro do app.</strong>
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => setShowPermissionBanner(false)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-2 rounded border border-blue-300 hover:bg-blue-100 transition-colors"
                  disabled={localLoading}
                >
                  Agora Não
                </button>
                <button
                  onClick={handleRequestPermission}
                  disabled={localLoading}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {localLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Solicitando...
                    </>
                  ) : (
                    <>
                      <span>🔔</span>
                      Permitir
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Aviso de bloqueio */}
        {isBlocked && isBlocked() && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="text-orange-600 text-lg">🔕</div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-800">Notificações Push Bloqueadas</h3>
                <p className="text-orange-700 text-sm mt-1">
                  As notificações do navegador estão bloqueadas.
                  <strong> Você ainda receberá todas as notificações dentro do app!</strong>
                </p>
              </div>
              <button
                onClick={() => {
                  addNotification("Para ativar, acesse as configurações do navegador 🔧", "info");
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
              >
                Como Ativar
              </button>
            </div>
          </div>
        )}

        {/* Aviso sem loja */}
        {!hasStoreContext && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="text-yellow-600 text-lg">⚠️</div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800">Escaneie uma Loja</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  Para receber notificações personalizadas das categorias de uma loja específica.
                </p>
              </div>
              <button
                onClick={() => navigate('/cliente/scanear')}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                Escanear QR Code
              </button>
            </div>
          </div>
        )}

        {/* Preferências de notificação */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <NotificationPreferences
            categories={allCategories}
            userPreferences={userPreferences}
            onPreferenceChange={handlePreferenceChange}
            onToggleAll={handleToggleAllPreferences}
            loading={localLoading || loading}
            title="Suas Preferências de Notificação"
            description={`Escolha quais categorias você deseja receber notificações. ${
              hasStoreContext
                ? 'Você receberá alertas da loja atual.'
                : 'Escaneie uma loja para ver categorias específicas.'
            }`}
            showGlobalToggle={true}
          />

          {/* Estatísticas */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {stats.activeCategories}
              </div>
              <div className="text-sm text-green-700">Categorias Ativas</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {stats.availableCategories}
              </div>
              <div className="text-sm text-blue-700">Categorias Disponíveis</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">
                {stats.unreadNotifications}
              </div>
              <div className="text-sm text-purple-700">Não Lidas</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-gray-600">
                {stats.totalNotifications}
              </div>
              <div className="text-sm text-gray-700">Total Recebidas</div>
            </div>
          </div>
        </div>

        {/* Notificações recebidas */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              📨 Histórico de Notificações
              {stats.totalNotifications > 0 && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({stats.totalNotifications} total, {stats.unreadNotifications} não lidas)
                </span>
              )}
            </h2>

            {stats.unreadNotifications > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={localLoading}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✅ Marcar Todas como Lidas
                </button>
              </div>
            )}
          </div>

          {/* Estado de carregamento */}
          {(loading || localLoading) && stats.totalNotifications === 0 ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : stats.totalNotifications === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-lg font-medium mb-2">Nenhuma notificação recebida</p>
              <p className="text-sm mb-6 max-w-md mx-auto">
                Quando você receber notificações das categorias selecionadas, elas aparecerão aqui.
                O sistema funciona mesmo com notificações do navegador bloqueadas!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleRefresh}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                >
                  🔄 Verificar Novamente
                </button>
                {!hasStoreContext && (
                  <button
                    onClick={() => navigate('/cliente/scanear')}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                  >
                    📱 Escanear Loja
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {userNotifications.map(renderNotificationItem)}
            </div>
          )}
        </div>

        {/* Ações rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/cliente/promocoes')}
            className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 hover:bg-red-100 transition-colors text-left group"
          >
            <div className="text-xl mb-2 group-hover:scale-110 transition-transform">🔥</div>
            <h4 className="font-semibold">Promoções Ativas</h4>
            <p className="text-sm text-red-600 mt-1">Veja as ofertas das lojas que você segue</p>
          </button>

          <button
            onClick={() => navigate('/cliente/produtos')}
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 hover:bg-blue-100 transition-colors text-left group"
          >
            <div className="text-xl mb-2 group-hover:scale-110 transition-transform">📦</div>
            <h4 className="font-semibold">Explorar Produtos</h4>
            <p className="text-sm text-blue-600 mt-1">Descubra produtos das suas categorias favoritas</p>
          </button>

          <button
            onClick={() => navigate('/cliente/scanear')}
            className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 hover:bg-green-100 transition-colors text-left group"
          >
            <div className="text-xl mb-2 group-hover:scale-110 transition-transform">📱</div>
            <h4 className="font-semibold">Escaneie uma Loja</h4>
            <p className="text-sm text-green-600 mt-1">Para receber notificações personalizadas</p>
          </button>
        </div>

      </div>
    </div>
  );
};
