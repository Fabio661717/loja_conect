// src/components/CategorySelector.tsx
import React, { useEffect, useState } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface CategorySelectorProps {
    userId: string;
    onInitialized?: (initialized: boolean) => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
    userId,
    onInitialized
}) => {
    const {
        isSupported,
        permission,
        isInitialized,
        userPreferences: _userPreferences, // ✅ Prefixar com _
        categories,
        loading,
        currentCategory,
        initializePush,
        updatePreference,
        checkExistingSubscription,
        loadCategories,
        loadUserPreferences,
        isCategoryEnabled
    } = usePushNotifications();

    const [localLoading, setLocalLoading] = useState(true);

    useEffect(() => {
        const initialize = async () => {
            if (!userId) return;

            setLocalLoading(true);

            // Carregar categorias
            await loadCategories();

            // Verificar se já tem subscription
            const hasExisting = await checkExistingSubscription(userId);

            // Carregar preferências
            await loadUserPreferences(userId);

            setLocalLoading(false);

            if (onInitialized) {
                onInitialized(hasExisting || isInitialized);
            }
        };

        initialize();
    }, [userId]);

    const handleToggle = async (categoryId: string, enabled: boolean) => {
        if (!userId) return;

        const success = await updatePreference(userId, categoryId, enabled);

        if (success && enabled) {
            // Se está habilitando uma categoria, inicializar push se necessário
            if (!isInitialized) {
                await initializePush(userId, categoryId);
            }
        }
    };

    const handleInitializePush = async () => {
        if (!userId || categories.length === 0) return;

        // Encontrar primeira categoria ativa ou selecionar uma
        const defaultCategory = categories.find(cat =>
            isCategoryEnabled(cat.id)
        )?.id || categories[0]?.id;

        if (defaultCategory) {
            const success = await initializePush(userId, defaultCategory);
            if (onInitialized) {
                onInitialized(success);
            }
        }
    };

    if (!isSupported) {
        return (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">
                    ⚠️ Seu navegador não suporta notificações push.
                </p>
            </div>
        );
    }

    if (permission === 'denied') {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">
                    ❌ Você bloqueou as notificações. Para receber notificações,
                    por favor permita-as nas configurações do seu navegador.
                </p>
            </div>
        );
    }

    if (localLoading || loading) {
        return (
            <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
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

    if (!isInitialized && permission === 'granted') {
        return (
            <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    🔔 Ativar Notificações
                </h3>
                <p className="text-blue-700 mb-4">
                    Receba notificações sobre novos produtos nas categorias que você escolher.
                </p>
                <button
                    onClick={handleInitializePush}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Ativar Notificações
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                    Configurar Notificações
                </h3>
                {isInitialized && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                        ✅ Ativo
                    </span>
                )}
            </div>

            {currentCategory && (
                <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                        Categoria atual: <span className="font-medium">
                            {categories.find(c => c.id === currentCategory)?.name || currentCategory}
                        </span>
                    </p>
                </div>
            )}

            <div className="space-y-3">
                {categories.filter(cat => cat.is_active).map(category => {
                    const enabled = isCategoryEnabled(category.id);

                    return (
                        <div
                            key={category.id}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex-1">
                                <h4 className="font-medium text-gray-900">
                                    {category.name}
                                </h4>
                                {category.description && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        {category.description}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => handleToggle(category.id, !enabled)}
                                disabled={!isInitialized && permission !== 'granted'}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                    enabled ? 'bg-blue-600' : 'bg-gray-200'
                                } ${(!isInitialized && permission !== 'granted') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                role="switch"
                                aria-checked={enabled}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        enabled ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>
                    );
                })}

                {categories.filter(cat => cat.is_active).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        Nenhuma categoria disponível no momento.
                    </div>
                )}
            </div>

            {isInitialized && (
                <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">
                        Você receberá notificações quando novos produtos forem cadastrados
                        nas categorias ativadas acima.
                    </p>
                </div>
            )}
        </div>
    );
};
