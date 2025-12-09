// src/screens/CategoriesScreen.tsx - VERSÃO ATUALIZADA
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationPreferences } from '../components/NotificationPreferences';
import { useCategory } from '../context/CategoryContext';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../hooks/useAuth';

export const CategoriesScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    userNotifications,
    categories,
    userPreferences,
    loading,
    updatePreference,
    markAsRead,
    deleteNotification,
    refreshData,
    addNotification
  } = useNotification();

  const { notificationCategories, refreshNotificationCategories } = useCategory();
  const [localLoading, setLocalLoading] = useState(false);

  // ✅ CORREÇÃO: Combinar categorias
  const allCategories = React.useMemo(() => {
    const combined = [...categories, ...notificationCategories];
    const unique = combined.filter((cat, index, self) =>
      index === self.findIndex(c => c.id === cat.id)
    );
    return unique;
  }, [categories, notificationCategories]);

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

  // ✅ ATUALIZAR DADOS
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

  // ✅ VERIFICAR SE O CLIENTE ESTÁ EM UMA LOJA
  const currentStoreId = localStorage.getItem('storeId');
  const hasStoreContext = !!currentStoreId || !!user?.lojaId;

  // ✅ MARCAR TODAS COMO LIDAS
  const handleMarkAllAsRead = async () => {
    const unreadCount = userNotifications.filter(n => !n.is_read).length;
    if (unreadCount === 0) {
      addNotification("Não há notificações não lidas", "info");
      return;
    }

    if (confirm(`Deseja marcar ${unreadCount} notificação(ões) como lida(s)?`)) {
      setLocalLoading(true);
      try {
        for (const notif of userNotifications.filter(n => !n.is_read)) {
          await markAsRead(notif.id);
        }
        addNotification(`Todas as notificações marcadas como lidas! ✅`, "success");
      } catch (error) {
        console.error("Erro ao marcar notificações como lidas:", error);
        addNotification("Erro ao marcar notificações como lidas", "error");
      } finally {
        setLocalLoading(false);
      }
    }
  };

  // ✅ RENDERIZAÇÃO DE NOTIFICAÇÕES
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
            <h3 className={`font-medium ${
              notif.is_read ? 'text-gray-800' : 'text-blue-800'
            }`}>
              {notif.title}
            </h3>
            {!notif.is_read && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                NOVA
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
            onClick={() => {
              if (confirm('Excluir esta notificação?')) {
                deleteNotification(notif.id);
              }
            }}
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
                📑 Configurações de Categorias
              </h1>
              {(localLoading || loading) && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              )}
            </div>
            <p className="text-gray-600 mt-2">
              Gerencie suas preferências de categorias e notificações
            </p>

            {/* ✅ STATUS DO SISTEMA */}
            <div className="flex flex-wrap gap-2 mt-3">
              {!hasStoreContext && (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                  ⚠️ Sem Loja Ativa
                </span>
              )}
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                📊 {userPreferences.filter((p) => p.is_enabled).length} categorias ativas
              </span>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {userNotifications.filter(n => !n.is_read).length > 0 && (
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

        {/* ✅ AVISO SEM LOJA */}
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

        {/* Preferências de Notificação */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <NotificationPreferences
            categories={allCategories}
            userPreferences={userPreferences}
            onPreferenceChange={handlePreferenceChange}
            loading={localLoading || loading}
            title="Suas Preferências de Categoria"
            description={`Escolha quais categorias você deseja receber notificações. ${
              hasStoreContext
                ? 'Você receberá alertas da loja atual.'
                : 'Escaneie uma loja para ver categorias específicas.'
            }`}
          />

          {/* Estatísticas */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {userPreferences.filter((p) => p.is_enabled).length}
              </div>
              <div className="text-sm text-green-700">Categorias Ativas</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-gray-600">
                {userPreferences.filter((p) => !p.is_enabled).length}
              </div>
              <div className="text-sm text-gray-700">Categorias Inativas</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {allCategories.filter(cat => cat.is_active).length}
              </div>
              <div className="text-sm text-blue-700">Total Disponível</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">
                {userNotifications.filter(n => !n.is_read).length}
              </div>
              <div className="text-sm text-purple-700">Notificações Não Lidas</div>
            </div>
          </div>
        </div>

        {/* Notificações Recebidas */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              📨 Notificações Recebidas
              {userNotifications.length > 0 && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({userNotifications.length} total, {userNotifications.filter(n => !n.is_read).length} não lidas)
                </span>
              )}
            </h2>

            {userNotifications.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={localLoading || userNotifications.filter(n => !n.is_read).length === 0}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✅ Marcar Todas como Lidas
                </button>
              </div>
            )}
          </div>

          {loading && userNotifications.length === 0 ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : userNotifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-lg font-medium mb-2">Nenhuma notificação recebida</p>
              <p className="text-sm mb-6 max-w-md mx-auto">
                Quando você receber notificações das categorias selecionadas, elas aparecerão aqui.
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

        {/* Informações */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-800 mb-2 flex items-center">
            <span className="mr-2">💡</span>
            Como funciona o sistema de categorias?
          </h3>
          <ul className="text-yellow-700 text-sm space-y-2">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <div>
                <strong>Selecione as categorias</strong> que você tem interesse
                <p className="text-yellow-600 text-xs mt-1">Você só receberá notificações das categorias ativadas</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <div>
                <strong>Receba notificações automáticas</strong> em tempo real
                <p className="text-yellow-600 text-xs mt-1">Novos produtos, promoções e atualizações das lojas que você segue</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <div>
                <strong>Controle total</strong> sobre suas preferências
                <p className="text-yellow-600 text-xs mt-1">Altere suas configurações a qualquer momento</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/cliente/promocoes')}
            className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 hover:bg-red-100 transition-colors text-left group"
          >
            <div className="text-xl mb-2 group-hover:scale-110 transition-transform">🔥</div>
            <h4 className="font-semibold">Ver Promoções</h4>
            <p className="text-sm text-red-600 mt-1">Confira as últimas ofertas das lojas</p>
          </button>

          <button
            onClick={() => navigate('/cliente/produtos')}
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 hover:bg-blue-100 transition-colors text-left group"
          >
            <div className="text-xl mb-2 group-hover:scale-110 transition-transform">📦</div>
            <h4 className="font-semibold">Explorar Produtos</h4>
            <p className="text-sm text-blue-600 mt-1">Descubra novos produtos disponíveis</p>
          </button>
        </div>

      </div>
    </div>
  );
};
