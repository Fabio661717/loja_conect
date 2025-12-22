// src/context/NotificationContext.tsx - VERSÃO CORRIGIDA E OTIMIZADA
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { categoryController } from "../controllers/categoryController";
import { useAuth } from "../hooks/useAuth";
import { categoryService } from "../services/categoryService";
import { notificationService } from "../services/notificationService";
import { pushSubscriptionService } from '../services/pushSubscription';
import { supabase } from "../services/supabase";
import {
  UINotification as ImportedUINotification,
  UserNotification as ImportedUserNotification,
  NotificationCategory,
  UserNotificationPreference
} from "../types/notification";

import { useNotificationConfig } from '../config/notificationConfig';
import { checkAndManageNotificationPermission } from '../utils/notificationUtils';

// ✅ Utilitário de compatibilidade do navegador
const checkBrowserCompatibility = () => {
  const compatibility = {
    notifications: 'Notification' in window,
    serviceWorker: 'serviceWorker' in navigator,
    pushManager: 'PushManager' in window,
    audioContext: 'AudioContext' in window || 'webkitAudioContext' in window,
    localStorage: 'localStorage' in window,
    indexedDB: 'indexedDB' in window,
    lockManager: 'locks' in navigator,
    permissions: 'permissions' in navigator
  };

  const warnings = [];
  const missingFeatures = [];

  if (!compatibility.notifications) missingFeatures.push('notifications');
  if (!compatibility.serviceWorker) warnings.push('serviceWorker');
  if (!compatibility.pushManager) warnings.push('pushManager');
  if (!compatibility.audioContext) warnings.push('audioContext');
  if (!compatibility.lockManager) warnings.push('lockManager');
  if (!compatibility.permissions) warnings.push('permissions');

  return {
    compatibility,
    warnings,
    missingFeatures,
    isCompatible: compatibility.notifications && compatibility.localStorage,
    isFullyCompatible: compatibility.notifications && compatibility.serviceWorker && compatibility.pushManager
  };
};

// ✅ Recomendações de compatibilidade
const getCompatibilityRecommendations = (compatibilityInfo: any) => {
  const recommendations = [];

  if (!compatibilityInfo.compatibility.serviceWorker) {
    recommendations.push('Atualize para um navegador moderno como Chrome, Firefox ou Safari');
  }

  if (!compatibilityInfo.compatibility.pushManager) {
    recommendations.push('Notificações push podem não funcionar corretamente');
  }

  if (compatibilityInfo.warnings.length > 0) {
    recommendations.push('Algumas funcionalidades podem ter comportamento limitado');
  }

  return recommendations;
};

interface NotificationContextType {
  addUINotification: (notification: Omit<ImportedUINotification, 'id'>) => void;
  removeUINotification: (id: number) => void;
  addSimpleNotification: (title: string, message: string, type?: string, source?: string, user_id?: string) => void;

  uiNotifications: ImportedUINotification[];
  addNotification: (message: string, type?: ImportedUINotification["type"]) => void;
  removeNotification: (id: number) => void;

  userNotifications: ImportedUserNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchUserNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;

  categories: NotificationCategory[];
  userPreferences: UserNotificationPreference[];
  updatePreference: (categoryId: string, enabled: boolean) => Promise<void>;
  toggleAllPreferences: (enabled: boolean) => Promise<UserNotificationPreference[]>;
  refreshData: () => Promise<void>;
  getNotificationStats: () => Promise<{ total: number; unread: number }>;

  notificationStatus: {
    supported: boolean;
    permission: NotificationPermission;
    functional: boolean;
  };

  preferredCategories: string[];
  availableCategories: any[];
  categoriesLoading: boolean;
  updateCategoryPreferences: (categoryIds: string[]) => Promise<void>;
  toggleCategoryPreference: (categoryId: string) => Promise<void>;
  fetchAvailableCategories: () => Promise<void>;
  fetchUserPreferences: () => Promise<void>;

  notifications: any[];
  addSystemNotification: (notification: any) => void;
  requestNotificationPermission: () => Promise<boolean>;

  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;

  browserCompatibility: {
    isCompatible: boolean;
    info: any;
    recommendations: string[];
  };

  // ✅ NOVAS FUNÇÕES PARA PUSH NOTIFICATIONS
  initializePushNotifications: () => Promise<void>;
  checkPushSubscriptionStatus: () => Promise<{
    isSubscribed: boolean;
    permission: NotificationPermission;
    isSupported: boolean;
  }>;

  // ✅ FUNÇÕES CORRIGIDAS COM SUPORTE PARA (userId, title, body)
  sendNotification: (userId: string, title: string, body: string, type?: string) => Promise<void>;
  sendPushNotification: (userId: string, title: string, body: string, data?: any) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// ✅ FUNÇÃO getCurrentUser REMOVIDA POIS NÃO ERA UTILIZADA

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [uiNotifications, setUiNotifications] = useState<ImportedUINotification[]>([]);
  const [userNotifications, setUserNotifications] = useState<ImportedUserNotification[]>([]);
  const [categories, _setCategories] = useState<NotificationCategory[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserNotificationPreference[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [browserCompatible, setBrowserCompatible] = useState(true);
  const [compatibilityInfo, setCompatibilityInfo] = useState<any>(null);

  const [notificationStatus, setNotificationStatus] = useState({
    supported: "Notification" in window,
    permission: Notification.permission,
    functional: true
  });

  // ✅ NOVAS FUNÇÕES PARA PUSH NOTIFICATIONS
  const initializePushNotifications = async () => {
    if (!user) {
      console.log('❌ Usuário não autenticado para inicializar push notifications');
      return;
    }

    try {
      console.log('🚀 Inicializando push notifications para:', user.id);

      // ✅ ATUALIZAÇÃO APLICADA: Verificar status da subscription antes
      console.log('📱 Status da subscription:', {
        userId: user.id,
        hasSubscription: await pushSubscriptionService.hasActiveSubscription(),
        isSubscribed: await pushSubscriptionService.isUserSubscribed(user.id)
      });

      // Aguardar um pouco para garantir que o app está carregado
      await new Promise(resolve => setTimeout(resolve, 2000));

      const success = await pushSubscriptionService.initialize(user.id);

      if (success) {
        console.log('✅ Push notifications inicializadas com sucesso');
        addNotification('🔔 Notificações ativadas! Você receberá alertas no celular.', 'success');

        // ✅ ATUALIZAÇÃO APLICADA: Testar apenas se houver subscription válida
        const isSubscribed = await pushSubscriptionService.isUserSubscribed(user.id);
        if (isSubscribed) {
          // Adicionar delay antes do teste
          setTimeout(async () => {
            try {
              await pushSubscriptionService.sendTestNotification(
                user.id,
                '🔔 Notificações Ativadas!',
                'Agora você receberá alertas quando novos produtos chegarem!'
              );
            } catch (testError) {
              console.warn('⚠️ Teste de notificação falhou (não crítico):', testError);
            }
          }, 5000); // Aguardar mais tempo
        }
      } else {
        console.warn('⚠️ Push notifications não foram ativadas');
        addNotification('Para receber notificações, permita as notificações no seu navegador.', 'warning');
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar push notifications:', error);
      addNotification('Erro ao ativar notificações. Tente novamente.', 'error');
    }
  };

  const checkPushSubscriptionStatus = async (): Promise<{
    isSubscribed: boolean;
    permission: NotificationPermission;
    isSupported: boolean;
  }> => {
    if (!user) {
      return { isSubscribed: false, permission: 'denied', isSupported: false };
    }

    try {
      const isSubscribed = await pushSubscriptionService.isUserSubscribed(user.id);
      const permission = pushSubscriptionService.getPermissionState();
      const isSupported = pushSubscriptionService.isPushSupported();

      return { isSubscribed, permission, isSupported };
    } catch (error) {
      console.error('❌ Erro ao verificar status da subscription:', error);
      return { isSubscribed: false, permission: 'denied', isSupported: false };
    }
  };

  // ✅ FUNÇÃO CORRIGIDA: sendNotification com suporte para (userId, title, body)
  const sendNotification = async (userId: string, title: string, body: string, type: string = 'info'): Promise<void> => {
    try {
      console.log(`📨 Enviando notificação para ${userId}: ${title} - ${body}`);

      // Adicionar notificação UI
      addUINotification({
        message: `${title}: ${body}`,
        type: type as ImportedUINotification["type"]
      });

      // Adicionar notificação do usuário
      const newNotification: ImportedUserNotification = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        message: body,
        type,
        source: 'system',
        user_id: userId,
        created_at: new Date().toISOString(),
        is_read: false,
        category_id: undefined,
        loja_id: undefined,
        category: undefined
      };

      setUserNotifications(prev => [...prev, newNotification]);

      // Salvar no banco de dados se usuário autenticado
      if (user) {
        const { error } = await supabase
          .from('notificacoes')
          .insert([
            {
              user_id: userId,
              type,
              title,
              message: body,
              data: { source: 'direct_send' },
              read: false
            }
          ]);

        if (error) {
          console.error('❌ Erro ao salvar notificação no banco:', error);
        }
      }

      // Mostrar notificação do navegador se permitido
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/logo.png'
        });
      }

      console.log('✅ Notificação enviada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao enviar notificação:', error);
      throw error;
    }
  };

  // ✅ FUNÇÃO CORRIGIDA: sendPushNotification com suporte para (userId, title, body)
  const sendPushNotification = async (userId: string, title: string, body: string, data?: any): Promise<void> => {
    try {
      console.log(`📲 Enviando push notification para ${userId}: ${title}`);

      // Verificar se o usuário está inscrito
      const isSubscribed = await pushSubscriptionService.isUserSubscribed(userId);

      if (!isSubscribed) {
        console.log('⚠️ Usuário não inscrito para push notifications');
        // Fallback para notificação normal
        await sendNotification(userId, title, body, 'info');
        return;
      }

      // Enviar push notification
      const success = await pushSubscriptionService.sendPushNotification(userId , title, body, data);

      if (success) {
        console.log('✅ Push notification enviada com sucesso');

        // Também adicionar como notificação local
        await sendNotification(userId, title, body, 'info');
      } else {
        console.warn('⚠️ Falha ao enviar push notification, usando fallback');
        await sendNotification(userId, title, body, 'info');
      }
    } catch (error) {
      console.error('❌ Erro ao enviar push notification:', error);
      // Fallback para notificação normal
      await sendNotification(userId, title, body, 'error');
    }
  };

  const updateNotificationStatus = () => {
    setNotificationStatus({
      supported: "Notification" in window,
      permission: Notification.permission,
      functional: true
    });
  };

  const showSuccess = useCallback((message: string, title: string = 'Sucesso!') => {
    addUINotification({ message, type: 'success' });
    addSimpleNotification(title, message, 'success', 'system', user?.id || 'current-user');
  }, [user]);

  const showError = useCallback((message: string, title: string = 'Erro!') => {
    addUINotification({ message, type: 'error' });
    addSimpleNotification(title, message, 'error', 'system', user?.id || 'current-user');
  }, [user]);

  const addUINotification = useCallback((notification: Omit<ImportedUINotification, 'id'>) => {
    const newUINotification: ImportedUINotification = {
      ...notification,
      id: Date.now()
    };

    setUiNotifications(prev => [...prev, newUINotification]);

    setTimeout(() => {
      setUiNotifications(prev => prev.filter(n => n.id !== newUINotification.id));
    }, 5000);
  }, []);

  const removeUINotification = useCallback((id: number) => {
    setUiNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const addSimpleNotification = useCallback((
    title: string,
    message: string,
    type: string = 'info',
    source: string = 'system',
    user_id: string = 'current-user'
  ) => {
    const newNotification: ImportedUserNotification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      type,
      source,
      user_id,
      created_at: new Date().toISOString(),
      is_read: false,
      category_id: undefined,
      loja_id: undefined,
      category: undefined
    };

    setUserNotifications(prev => [...prev, newNotification]);
  }, []);

  const showBrowserNotification = (notification: any) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png'
      });
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      updateNotificationStatus();
      return permission === 'granted';
    }
    return false;
  };

  const handleReservaNotification = (payload: any) => {
    let notification: any;

    switch (payload.eventType) {
      case 'INSERT':
        notification = {
          type: 'reserva',
          title: '✅ Reserva Confirmada',
          message: `Sua reserva foi realizada com sucesso! ID: ${payload.new.id.slice(-8)}`,
          data: payload.new
        };
        break;

      case 'UPDATE':
        if (payload.new.status === 'expirada') {
          notification = {
            type: 'alerta',
            title: '⏰ Reserva Expirada',
            message: `Sua reserva expirou. ID: ${payload.new.id.slice(-8)}`,
            data: payload.new
          };
        } else if (payload.new.status === 'cancelada') {
          notification = {
            type: 'alerta',
            title: '❌ Reserva Cancelada',
            message: `Sua reserva foi cancelada. ID: ${payload.new.id.slice(-8)}`,
            data: payload.new
          };
        } else {
          return;
        }
        break;

      default:
        return;
    }

    addSystemNotification(notification);
    showBrowserNotification(notification);
  };

  const handlePromocaoNotification = (payload: any) => {
    const oldPrice = payload.old.preco;
    const newPrice = payload.new.preco;

    if (newPrice < oldPrice) {
      const notification = {
        type: 'promocao',
        title: '🔥 Promoção Relâmpago!',
        message: `🎉 ${payload.new.nome} agora por R$ ${newPrice.toFixed(2)}!`,
        data: payload.new
      };

      addSystemNotification(notification);
      showBrowserNotification(notification);
    }
  };

  const handleNovoProdutoNotification = (payload: any) => {
    const notification = {
      type: 'promocao',
      title: '🆕 Novo Produto!',
      message: `📦 ${payload.new.nome} acabou de chegar na loja!`,
      data: payload.new
    };

    addSystemNotification(notification);
    showBrowserNotification(notification);
  };

  const addSystemNotification = async (notification: any) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .insert([
          {
            user_id: userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            read: false
          }
        ])
        .select()
        .single();

      if (!error && data) {
        setNotifications(prev => [data, ...prev]);
        const userNotification: ImportedUserNotification = {
          id: data.id,
          title: data.title,
          message: data.message,
          created_at: data.created_at,
          is_read: data.read,
          source: 'system',
          user_id: userId,
          type: notification.type,
          category_id: undefined,
          loja_id: undefined,
          category: undefined
        };
        setUserNotifications(prev => [userNotification, ...prev]);
      }
    } catch (error) {
      console.error('Erro ao salvar notificação:', error);
      const localNotification = {
        ...notification,
        id: Date.now().toString(),
        read: false,
        created_at: new Date().toISOString()
      };
      setNotifications(prev => [localNotification, ...prev]);
    }
  };

  const setupRealtimeNotifications = () => {
    if (!user) return;

    const storeId = localStorage.getItem('storeId');
    if (!storeId) return;

    const produtosChannel = supabase
      .channel('novos-produtos')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'produtos',
          filter: `loja_id=eq.${storeId}`
        },
        async (payload) => {
          if (preferredCategories.includes('novos-produtos') || preferredCategories.includes('promocoes')) {
            const notification = {
              user_id: user.id,
              type: 'novo_produto',
              title: '🆕 Novo Produto!',
              message: `📦 ${payload.new.nome} acabou de chegar!`,
              category: 'novos-produtos',
              data: payload.new,
              read: false
            };

            const { error } = await supabase
              .from('notificacoes')
              .insert([notification]);

            if (!error) {
              const userNotification: ImportedUserNotification = {
                id: Date.now().toString(),
                title: notification.title,
                message: notification.message,
                created_at: new Date().toISOString(),
                is_read: false,
                source: 'system',
                user_id: user.id,
                type: notification.type,
                category_id: undefined,
                loja_id: undefined,
                category: undefined
              };
              setUserNotifications(prev => [userNotification, ...prev]);
              setUnreadCount(prev => prev + 1);

              if (Notification.permission === 'granted') {
                new Notification(notification.title, {
                  body: notification.message,
                  icon: '/logo.png'
                });
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(produtosChannel);
    };
  };

  const setupRealtime = (userId: string) => {
    const reservasChannel = supabase
      .channel('reservas-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservas',
          filter: `usuario_id=eq.${userId}`
        },
        (payload) => {
          handleReservaNotification(payload);
        }
      )
      .subscribe();

    const storeId = localStorage.getItem('storeId');
    if (storeId) {
      supabase
        .channel('produtos-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'produtos',
            filter: `loja_id=eq.${storeId}`
          },
          (payload) => {
            handlePromocaoNotification(payload);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'produtos',
            filter: `loja_id=eq.${storeId}`
          },
          (payload) => {
            handleNovoProdutoNotification(payload);
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(reservasChannel);
    };
  };

  const addNotification = (
    message: string,
    type: ImportedUINotification["type"] = "info"
  ) => {
    const id = Date.now();
    const newNotification: ImportedUINotification = { id, message, type };
    setUiNotifications((prev) => [...prev, newNotification]);
    setTimeout(() => removeNotification(id), 5000);
  };

  const removeNotification = (id: number) => {
    setUiNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handlePreferencesFallback = async () => {
    try {
      const localPrefs = localStorage.getItem('user_category_preferences');
      const fallbackCategories = localPrefs ? JSON.parse(localPrefs) : [];

      setPreferredCategories(fallbackCategories);
      console.log('✅ Preferências carregadas do localStorage (fallback):', fallbackCategories);

      if (user) {
        setTimeout(async () => {
          try {
            await updateCategoryPreferences(fallbackCategories);
          } catch (e) {
            // Ignora erros em background
          }
        }, 1000);
      }
    } catch (fallbackError) {
      console.error('❌ Erro crítico no fallback:', fallbackError);
      setPreferredCategories([]);
    }
  };

  const fetchUserPreferences = async (): Promise<void> => {
    if (!user) return;

    try {
      console.log('🔄 Carregando preferências do usuário...');

      let userData = null;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('preferred_categories')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          userData = data;
          console.log('✅ Preferências carregadas da tabela users:', data.preferred_categories);
        }
      } catch (error) {
        console.warn('⚠️ Tabela users não disponível, tentando clientes...');
      }

      if (!userData) {
        try {
          const { data, error } = await supabase
            .from('clientes')
            .select('preferred_categories')
            .eq('id', user.id)
            .single();

        if (!error && data) {
          userData = data;
          console.log('✅ Preferências carregadas da tabela clientes:', data.preferred_categories);
        }
        } catch (error) {
          console.warn('⚠️ Tabela clientes também não disponível');
        }
      }

      const categories = userData?.preferred_categories || [];
      setPreferredCategories(categories);

      if (categories.length === 0) {
        await handlePreferencesFallback();
      }

    } catch (error) {
      console.warn('⚠️ Erro ao buscar preferências do usuário:', error);
      await handlePreferencesFallback();
    }
  };

  // ✅ CORREÇÃO COMPLETA DO MÉTODO updateCategoryPreferences
  const updateCategoryPreferences = async (categories: string[]) => {
    try {
      console.log('🔄 Atualizando preferências...', categories);

      // ✅ VERIFICAR SE USER EXISTE
      if (!user) {
        console.error('❌ Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }

      // ✅ PRIMEIRO: Verificar se já existe uma preferência
      const { data: existingPref, error: checkError } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('cliente_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erro ao verificar preferências:', checkError);
        throw checkError;
      }

      let error;

      if (existingPref) {
        // ✅ ATUALIZAR preferência existente
        const { error: updateError } = await supabase
          .from('user_preferences')
          .update({
            preferred_categories: categories,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPref.id);

        error = updateError;
      } else {
        // ✅ CRIAR nova preferência
        const { error: insertError } = await supabase
          .from('user_preferences')
          .insert([{
            cliente_id: user.id,
            preferred_categories: categories,
            preferred_categories_active: true,
            notifications_enabled: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        error = insertError;
      }

      if (error) {
        console.error('❌ Erro ao salvar preferências:', {
          message: error.message,
          code: error.code,
          details: error.details
        });
        throw error;
      }

      // ✅ ATUALIZAR ESTADO LOCAL
      setPreferredCategories(categories);
      localStorage.setItem('user_category_preferences', JSON.stringify(categories));

      console.log('✅ Preferências atualizadas com sucesso!', categories);

    } catch (error) {
      console.error('❌ Erro ao atualizar preferências:', error);
      // ✅ FALLBACK: Salvar apenas no localStorage e estado local
      setPreferredCategories(categories);
      localStorage.setItem('user_category_preferences', JSON.stringify(categories));
      throw error;
    }
  };

  const fetchAvailableCategories = async (): Promise<void> => {
    if (!user) return;

    setCategoriesLoading(true);
    try {
      const currentStoreId = localStorage.getItem('storeId');

      if (currentStoreId) {
        const { data, error } = await supabase
          .from('categorias')
          .select('*')
          .eq('loja_id', currentStoreId)
          .order('nome');

        if (!error && data) {
          const formattedCategories = data.map(cat => ({
            id: cat.id,
            name: cat.nome,
            description: cat.descricao || `Produtos ${cat.nome}`,
            source: 'store',
            store_id: cat.loja_id
          }));
          setAvailableCategories(formattedCategories);
          return;
        }
      }

      try {
        const categories = await categoryController.getAvailableCategories(user.id);
        setAvailableCategories(categories);
        console.log('✅ Categorias disponíveis carregadas:', categories.length);
      } catch (error) {
        console.error("❌ Erro ao buscar categorias do controller:", error);

        const mockCategories = [
          { id: 'blusa-feminina', name: 'Blusa Feminina', description: 'Blusas e camisas femininas' },
          { id: 'camisa-masculina', name: 'Camisa Masculina', description: 'Camisas masculinas' },
          { id: 'calcados', name: 'Calçados', description: 'Sapatos, tênis e sandálias' },
          { id: 'acessorios', name: 'Acessórios', description: 'Bolsas, cintos e acessórios' },
        ];

        setAvailableCategories(mockCategories);
        console.log('✅ Categorias carregadas do mock (fallback):', mockCategories.length);
      }
    } catch (error) {
      console.error("❌ Erro ao buscar categorias:", error);
      addNotification('Erro ao carregar categorias', 'error');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const toggleCategoryPreference = async (categoryId: string) => {
    const newPreferences = preferredCategories.includes(categoryId)
      ? preferredCategories.filter((id) => id !== categoryId)
      : [...preferredCategories, categoryId];
    await updateCategoryPreferences(newPreferences);
  };

  // src/context/NotificationContext.tsx - CORREÇÃO DO USO DO MÉTODO
// ... (código anterior) ...

const toggleAllPreferences = async (enabled: boolean) => {
  setLoading(true);
  try {
    console.log(`🔄 Alternando todas as preferências para: ${enabled}`);

    // ✅ CORREÇÃO: Usar método sem parâmetros
    const updatedPreferences = await notificationService.getUserNotificationPreferences();

    // ✅ ATUALIZAR CADA PREFERÊNCIA INDIVIDUALMENTE
    if (updatedPreferences.length > 0) {
      for (const pref of updatedPreferences) {
        try {
          await notificationService.updateNotificationPreference(pref.category_id, enabled);
        } catch (updateError) {
          console.warn(`⚠️ Erro ao atualizar preferência ${pref.category_id}:`, updateError);
        }
      }
    }

    // ✅ ATUALIZAR ESTADO LOCAL
    const finalPreferences = await notificationService.getUserNotificationPreferences();
    setUserPreferences(finalPreferences);

    addNotification(
      enabled ? "Todas as notificações ativadas! 🔔" : "Todas as notificações desativadas! 🔕",
      "success"
    );

    return finalPreferences;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar preferências";
    addNotification(errorMessage, "error");
    throw err;
  } finally {
    setLoading(false);
  }
};

const updatePreference = async (categoryId: string, enabled: boolean) => {
  setLoading(true);
  try {
    // ✅ CORREÇÃO: Usar método correto
    const updated = await notificationService.updateNotificationPreference(categoryId, enabled);
    setUserPreferences(updated);

    const category = categories.find((cat) => cat.id === categoryId);
    if (category) {
      addNotification(`${category.name} ${enabled ? "ativada" : "desativada"}!`, "success");
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar preferência";
    addNotification(errorMessage, "error");
    throw err;
  } finally {
    setLoading(false);
  }
};

const refreshData = async () => {
  try {
    setLoading(true);
    setError(null);
    updateNotificationStatus();

    // ✅ CORREÇÃO: Chamar métodos com assinaturas corretas
    const [_categoriesData, _preferencesData, _userNotifs] = await Promise.all([
      categoryService.getActiveCategories(),
      notificationService.getUserNotificationPreferences(), // ✅ SEM PARÂMETROS
      notificationService.getUserNotifications()
    ]);

    // ... (resto do código permanece igual) ...
  } catch (err) {
    console.error("❌ Erro ao carregar notificações:", err);
    setError(err instanceof Error ? err.message : "Erro ao carregar notificações");
  } finally {
    setLoading(false);
  }
};

// ... (resto do código) ...

  const fetchUserNotifications = async () => {
    await refreshData();
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markNotificationAsRead(id);
      setUserNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("❌ Erro ao marcar notificação:", err);
      addNotification("Erro ao marcar notificação como lida", "error");
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllNotificationsAsRead();
      setUserNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      addNotification("Todas as notificações marcadas como lidas", "success");
    } catch (err) {
      console.error("❌ Erro ao marcar todas como lidas:", err);
      addNotification("Erro ao marcar notificações como lidas", "error");
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const notificationToDelete = userNotifications.find((n) => n.id === id);
      await notificationService.deleteNotification(id);
      setUserNotifications((prev) => prev.filter((n) => n.id !== id));

      if (notificationToDelete && !notificationToDelete.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      addNotification("Notificação excluída", "warning");
    } catch (err) {
      console.error("❌ Erro ao excluir notificação:", err);
      addNotification("Erro ao excluir notificação", "error");
    }
  };

  const getNotificationStats = async (): Promise<{ total: number; unread: number }> => {
    try {
      return await notificationService.getNotificationStats();
    } catch (err) {
      console.error("❌ Erro ao buscar estatísticas:", err);
      return { total: userNotifications.length, unread: unreadCount };
    }
  };

  useEffect(() => {
    const checkCompatibility = () => {
      const compatibility = checkBrowserCompatibility();
      setCompatibilityInfo(compatibility);
      setBrowserCompatible(compatibility.isCompatible);

      if (!compatibility.isCompatible || compatibility.warnings.length > 0) {
        console.warn('⚠️ Problemas de compatibilidade detectados:', {
          missing: compatibility.missingFeatures,
          warnings: compatibility.warnings
        });
      }
    };

    checkCompatibility();
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log("🔄 Iniciando NotificationContext...");

        if (!browserCompatible && compatibilityInfo) {
          console.warn('🚨 Navegador com problemas de compatibilidade:', compatibilityInfo.warnings);
        }

        await refreshData();

        if (user) {
          console.log("🔄 Carregando preferências do usuário...");
          setUserId(user.id);

          await Promise.race([
            Promise.all([
              fetchAvailableCategories(),
              fetchUserPreferences()
            ]),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout carregando preferências')), 10000)
            )
          ]);

          if (browserCompatible) {
            setupRealtime(user.id);
            setupRealtimeNotifications();
          } else {
            console.warn('🔕 Notificações em tempo real desativadas devido a problemas de compatibilidade');
          }

          // ✅ INICIALIZAR PUSH NOTIFICATIONS PARA CLIENTES
          if (user && user.type === 'cliente') {
            console.log("👤 Usuário cliente detectado, inicializando push notifications...");

            // Inicializar push notifications para clientes após um delay
            setTimeout(() => {
              initializePushNotifications();
            }, 5000); // Aguardar 5 segundos após o carregamento
          }
        }

        const { isConfigured, validation } = useNotificationConfig();
        if (!isConfigured) {
          console.warn('⚠️ Configurações de notificação incompletas:', validation.errors);
        }

        await checkAndManageNotificationPermission();

        console.log("✅ NotificationContext inicializado com sucesso");
      } catch (error) {
        console.error("❌ Erro na inicialização do NotificationContext:", error);
        setLoading(false);

        try {
          await handlePreferencesFallback();
        } catch (fallbackError) {
          console.error('❌ Falha crítica na inicialização:', fallbackError);
        }
      }
    };

    initialize();

    if ("permissions" in navigator) {
      navigator.permissions
        .query({ name: "notifications" as PermissionName })
        .then((permissionStatus) => {
          permissionStatus.onchange = updateNotificationStatus;
        })
        .catch(() => {});
    }

    requestNotificationPermission();
  }, [user, browserCompatible]);

  useEffect(() => {
    if (user) {
      fetchUserNotifications();
    }
  }, [preferredCategories]);

  const value: NotificationContextType = {
    addUINotification,
    removeUINotification,
    addSimpleNotification,

    uiNotifications,
    addNotification,
    removeNotification,
    userNotifications,
    unreadCount,
    loading,
    error,
    fetchUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationStats,
    categories,
    userPreferences,
    updatePreference,
    toggleAllPreferences,
    refreshData,
    notificationStatus,

    preferredCategories,
    availableCategories,
    categoriesLoading,
    updateCategoryPreferences,
    toggleCategoryPreference,
    fetchAvailableCategories,
    fetchUserPreferences,

    notifications,
    addSystemNotification,
    requestNotificationPermission,

    showSuccess,
    showError,

    browserCompatibility: {
      isCompatible: browserCompatible,
      info: compatibilityInfo,
      recommendations: compatibilityInfo ? getCompatibilityRecommendations(compatibilityInfo) : []
    },

    // ✅ NOVAS FUNÇÕES PARA PUSH NOTIFICATIONS
    initializePushNotifications,
    checkPushSubscriptionStatus,

    // ✅ FUNÇÕES CORRIGIDAS COM SUPORTE PARA (userId, title, body)
    sendNotification,
    sendPushNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}

      {!browserCompatible && compatibilityInfo && (
        <div className="fixed bottom-4 left-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg z-50">
          <div className="flex items-start gap-3">
            <div className="text-yellow-600 text-lg mt-0.5">⚠️</div>
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-800">Compatibilidade Limitada</h4>
              <p className="text-yellow-700 text-sm mt-1">
                Seu navegador tem limitações que podem afetar algumas funcionalidades.
                Recomendamos usar Chrome, Firefox ou Safari atualizados.
              </p>
              <div className="mt-2 text-xs text-yellow-600">
                Problemas detectados: {compatibilityInfo.missingFeatures.join(', ')}
              </div>
            </div>
            <button
              onClick={() => setBrowserCompatible(true)}
              className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
        {uiNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`relative flex items-center justify-between p-4 rounded-lg shadow-lg min-w-80 max-w-md
              ${
                notification.type === "success"
                  ? "bg-green-500 text-white"
                  : notification.type === "error"
                  ? "bg-red-500 text-white"
                  : notification.type === "warning"
                  ? "bg-yellow-500 text-white"
                  : "bg-blue-500 text-white"
              } transition-all duration-300 transform hover:scale-105 animate-in slide-in-from-right-full`}
          >
            <span className="flex-1 pr-6">{notification.message}</span>
            <button
              onClick={() => removeNotification(notification.id)}
              className="absolute top-2 right-2 bg-white bg-opacity-20 hover:bg-opacity-30 w-6 h-6 rounded-full flex items-center justify-center font-bold"
            >
              ×
            </button>
            <div
              className="absolute bottom-0 left-0 h-1 bg-white bg-opacity-50 rounded-b-lg"
              style={{ animation: `shrinkWidth 5s linear forwards` }}
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes slideInFromRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-in {
          animation: slideInFromRight 0.3s ease-out;
        }
        .slide-in-from-right-full {
          transform: translateX(100%);
        }
      `}</style>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotification deve ser usado dentro de NotificationProvider");
  }
  return ctx;
}

export const useNotifications = () => {
  const context = useNotification();

  const showSuccess = useCallback((message: string, title: string = 'Sucesso!') => {
    context.addUINotification({ message, type: 'success' });
    context.addSimpleNotification(title, message, 'success', 'system', 'current-user');
  }, [context]);

  const showError = useCallback((message: string, title: string = 'Erro!') => {
    context.addUINotification({ message, type: 'error' });
    context.addSimpleNotification(title, message, 'error', 'system', 'current-user');
  }, [context]);

  const showWarning = useCallback((message: string, title: string = 'Aviso!') => {
    context.addUINotification({ message, type: 'warning' });
    context.addSimpleNotification(title, message, 'warning', 'system', 'current-user');
  }, [context]);

  const showInfo = useCallback((message: string, title: string = 'Informação') => {
    context.addUINotification({ message, type: 'info' });
    context.addSimpleNotification(title, message, 'info', 'system', 'current-user');
  }, [context]);

  return {
    ...context,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};
