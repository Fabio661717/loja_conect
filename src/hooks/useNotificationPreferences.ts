// loja-conect/src/hooks/useNotificationPreferences.ts
import { useCallback, useState } from 'react';
import { notificationService } from '../services/notificationService';
import { NotificationCategory, UserNotificationPreference } from '../types/notification';

export const useNotificationPreferences = () => {
  const [categories, setCategories] = useState<NotificationCategory[]>([]);
  const [preferences, setPreferences] = useState<UserNotificationPreference[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [categoriesData, preferencesData] = await Promise.all([
        notificationService.getNotificationCategories(),
        notificationService.getUserNotificationPreferences()
      ]);

      setCategories(categoriesData);
      setPreferences(preferencesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar preferências');
      console.error('Erro no useNotificationPreferences:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePreference = useCallback(async (categoryId: string, enabled: boolean) => {
    try {
      setError(null);
      const updatedPreferences = await notificationService.updateNotificationPreference(
        categoryId,
        enabled
      );
      setPreferences(updatedPreferences);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar preferência';
      setError(errorMessage);
      console.error('Erro ao atualizar preferência:', err);
      return false;
    }
  }, []);

  const isCategoryEnabled = useCallback((categoryId: string): boolean => {
    const preference = preferences.find(pref => pref.category_id === categoryId);
    return preference ? preference.is_enabled : true; // Padrão: ativado
  }, [preferences]);

  const getEnabledCategories = useCallback((): string[] => {
    return preferences
      .filter(pref => pref.is_enabled)
      .map(pref => pref.category_id);
  }, [preferences]);

  return {
    categories,
    preferences,
    loading,
    error,
    loadPreferences,
    updatePreference,
    isCategoryEnabled,
    getEnabledCategories,
    refresh: loadPreferences
  };
};
