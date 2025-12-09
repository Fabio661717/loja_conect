// src/components/NotificationPreferences.tsx - VERSÃO COMPLETA ATUALIZADA
import React, { useEffect, useState } from 'react';
import { notificationService } from '../services/notificationService';
import { NotificationCategory, UserNotificationPreference } from '../types/notification';

interface NotificationPreferencesProps {
  categories: NotificationCategory[];
  userPreferences: UserNotificationPreference[];
  onPreferenceChange: (categoryId: string, enabled: boolean) => void;
  onToggleAll?: (enabled: boolean) => void;
  loading?: boolean;
  title?: string;
  description?: string;
  showGlobalToggle?: boolean;
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  categories,
  userPreferences,
  onPreferenceChange,
  onToggleAll,
  loading = false,
  title = "Configurar Notificações",
  description = "Escolha quais tipos de notificação você deseja receber",
  showGlobalToggle = true
}) => {
  const [allEnabled, setAllEnabled] = useState<boolean>(true);
  const [notificationMessage, setNotificationMessage] = useState<string>('');
  const [activeChange, setActiveChange] = useState<string>('');

  // Verificar se uma categoria está ativada
  const isCategoryEnabled = (categoryId: string): boolean => {
    const preference = userPreferences.find(pref => pref.category_id === categoryId);
    return preference ? preference.is_enabled : true;
  };

  // Verificar se todas as categorias estão ativadas
  useEffect(() => {
    if (categories.length > 0 && userPreferences.length > 0) {
      const allCategoriesEnabled = categories.every(cat =>
        userPreferences.some(pref => pref.category_id === cat.id && pref.is_enabled)
      );
      setAllEnabled(allCategoriesEnabled);
    }
  }, [categories, userPreferences]);

  // ✅ ATUALIZAÇÃO: Alternar todas as categorias com feedback sonoro
  const handleToggleAll = async (enabled: boolean) => {
    setAllEnabled(enabled);

    if (onToggleAll) {
      await onToggleAll(enabled);
    } else {
      for (const category of categories) {
        await onPreferenceChange(category.id, enabled);
      }
    }

    // ✅ ATUALIZAÇÃO: Feedback sonoro imediato
    await notificationService.playNotificationSound();

    // ✅ ATUALIZAÇÃO: Mensagem de confirmação
    setNotificationMessage(enabled
      ? 'Todas as notificações foram ativadas! 🔊'
      : 'Todas as notificações foram desativadas! 🔇'
    );
    setTimeout(() => setNotificationMessage(''), 3000);
  };

  // ✅ ATUALIZAÇÃO: Função melhorada para alternar categoria individual
  const handleCategoryToggle = async (categoryId: string, enabled: boolean) => {
    setActiveChange(categoryId);
    await onPreferenceChange(categoryId, enabled);

    // ✅ ATUALIZAÇÃO: Feedback sonoro imediato
    if (enabled) {
      await notificationService.playNotificationSound();
    }

    setTimeout(() => setActiveChange(''), 1000);
  };

  // Obter ícone para categoria
  const getCategoryIcon = (categoryName: string): string => {
    const icons: { [key: string]: string } = {
      'reservas': '⏰',
      'promocoes': '💰',
      'novos_produtos': '🆕',
      'estoque': '📦',
      'newsletter': '📰',
      'lembretes': '🔔',
      'pedidos': '📦',
      'sistema': '⚙️',
      'seguranca': '🔒',
      'geral': '📢'
    };

    const key = categoryName.toLowerCase();
    return icons[key] || '🔔';
  };

  // Obter descrição padrão se não houver
  const getCategoryDescription = (category: NotificationCategory): string => {
    if (category.description && category.description !== "Descrição não disponível") {
      return category.description;
    }

    const descriptions: { [key: string]: string } = {
      'reservas': 'Alertas sobre o status das suas reservas e prazos',
      'promocoes': 'Ofertas especiais e descontos exclusivos - Clique para ver promoções',
      'novos_produtos': 'Lançamentos e novos itens disponíveis - Clique para ver produtos',
      'estoque': 'Alertas quando produtos desejados voltam ao estoque',
      'newsletter': 'Notícias e atualizações da loja',
      'lembretes': 'Lembretes importantes sobre seus pedidos',
      'pedidos': 'Atualizações sobre seus pedidos e entregas',
      'sistema': 'Notificações técnicas e do sistema',
      'seguranca': 'Alertas de segurança e acesso à conta',
      'geral': 'Comunicados gerais e informações importantes'
    };

    const key = category.name.toLowerCase();
    return descriptions[key] || 'Receba notificações sobre esta categoria';
  };

  // Agrupar categorias por tipo (loja/sistema)
  const storeCategories = categories.filter(cat => cat.source === 'store');
  const systemCategories = categories.filter(cat => cat.source === 'system' || !cat.source);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {showGlobalToggle && (
          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-gray-300 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
            <div className="w-12 h-6 bg-gray-300 rounded-full"></div>
          </div>
        )}
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-300 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
            <div className="w-12 h-6 bg-gray-300 rounded-full"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="text-gray-600 mt-2">{description}</p>
      </div>

      {/* ✅ ATUALIZAÇÃO: Mensagem de Notificação */}
      {notificationMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg animate-pulse">
          <div className="flex items-center">
            <span className="text-lg mr-2">🔔</span>
            {notificationMessage}
          </div>
        </div>
      )}

      {/* Toggle Global - "Receber Todas as Notificações" */}
      {showGlobalToggle && categories.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <span className="text-xl mt-1">🔊</span>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900">
                  Receber Todas as Notificações
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  {allEnabled ? 'Todas ativadas' : 'Todas desativadas'}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleToggleAll(!allEnabled)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                allEnabled ? 'bg-green-600' : 'bg-gray-300'
              }`}
              role="switch"
              aria-checked={allEnabled}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  allEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Categorias da Loja */}
        {storeCategories.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">🏪</span>
              Categorias da Loja
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {storeCategories.filter(cat => cat.is_active).length}
              </span>
            </h3>
            <div className="space-y-3">
              {storeCategories.filter(cat => cat.is_active).map(category => {
                const enabled = isCategoryEnabled(category.id);
                const isChanging = activeChange === category.id;

                return (
                  <div
                    key={category.id}
                    className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-300 ${
                      enabled
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 bg-white'
                    } ${isChanging ? 'animate-pulse' : ''}`}
                  >
                    <div className="flex items-start space-x-3 flex-1">
                      <span className={`text-xl mt-1 transition-transform duration-300 ${
                        enabled ? 'scale-110' : 'scale-100 opacity-60'
                      }`}>
                        {getCategoryIcon(category.name)}
                      </span>
                      <div className="flex-1">
                        <h3 className={`font-medium transition-colors duration-300 ${
                          enabled ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                        </h3>
                        <p className={`text-sm mt-1 transition-colors duration-300 ${
                          enabled ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {getCategoryDescription(category)}
                        </p>
                        {enabled && (
                          <div className="flex items-center mt-2 text-xs text-green-600">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                            Ativo - Com som de alerta
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleCategoryToggle(category.id, !enabled)}
                      disabled={isChanging}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        enabled ? 'bg-green-500 shadow-lg shadow-green-200' : 'bg-gray-300'
                      } ${isChanging ? 'opacity-50' : ''}`}
                      role="switch"
                      aria-checked={enabled}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-all duration-300 ${
                          enabled ? 'translate-x-5 shadow-green-300' : 'translate-x-0 shadow-gray-400'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Categorias do Sistema */}
        {systemCategories.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">⚙️</span>
              Categorias do Sistema
              <span className="ml-2 text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                {systemCategories.filter(cat => cat.is_active).length}
              </span>
            </h3>
            <div className="space-y-3">
              {systemCategories.filter(cat => cat.is_active).map(category => {
                const enabled = isCategoryEnabled(category.id);
                const isChanging = activeChange === category.id;

                return (
                  <div
                    key={category.id}
                    className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-300 ${
                      enabled
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 bg-white'
                    } ${isChanging ? 'animate-pulse' : ''}`}
                  >
                    <div className="flex items-start space-x-3 flex-1">
                      <span className={`text-xl mt-1 transition-transform duration-300 ${
                        enabled ? 'scale-110' : 'scale-100 opacity-60'
                      }`}>
                        {getCategoryIcon(category.name)}
                      </span>
                      <div className="flex-1">
                        <h3 className={`font-medium transition-colors duration-300 ${
                          enabled ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                        </h3>
                        <p className={`text-sm mt-1 transition-colors duration-300 ${
                          enabled ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {getCategoryDescription(category)}
                        </p>
                        {enabled && (
                          <div className="flex items-center mt-2 text-xs text-green-600">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                            Ativo - Com som de alerta
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleCategoryToggle(category.id, !enabled)}
                      disabled={isChanging}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        enabled ? 'bg-green-500 shadow-lg shadow-green-200' : 'bg-gray-300'
                      } ${isChanging ? 'opacity-50' : ''}`}
                      role="switch"
                      aria-checked={enabled}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-all duration-300 ${
                          enabled ? 'translate-x-5 shadow-green-300' : 'translate-x-0 shadow-gray-400'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Estado Vazio */}
        {categories.filter(cat => cat.is_active).length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-4xl mb-2">🔔</div>
            <p className="font-medium">Nenhuma categoria disponível</p>
            <p className="text-sm mt-1">
              {storeCategories.length === 0
                ? "Esta loja ainda não configurou categorias de notificação."
                : "Todas as categorias estão desativadas no momento."
              }
            </p>
          </div>
        )}
      </div>

      {/* ✅ ATUALIZAÇÃO: Informações Adicionais melhoradas */}
      <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-3 flex items-center">
          <span className="mr-2">🎯</span>
          Sistema de Notificações Ativo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
          <div className="flex items-center">
            <span className="mr-2">🔊</span>
            Som de alerta em tempo real
          </div>
          <div className="flex items-center">
            <span className="mr-2">🔄</span>
            Sincronização com painel da loja
          </div>
          <div className="flex items-center">
            <span className="mr-2">📱</span>
            Clique para ver produtos/promoções
          </div>
          <div className="flex items-center">
            <span className="mr-2">⚡</span>
            Notificações em tempo real
          </div>
          <div className="flex items-center">
            <span className="mr-2">🎮</span>
            Feedback sonoro imediato
          </div>
          <div className="flex items-center">
            <span className="mr-2">📊</span>
            Controle total das preferências
          </div>
        </div>
      </div>
    </div>
  );
};
