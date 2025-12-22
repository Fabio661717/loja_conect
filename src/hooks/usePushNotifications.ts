// src/hooks/usePushNotifications.ts - VERSÃO COM FUNÇÕES NOMEADAS
import { useEffect, useState } from "react";
import { notificationService } from "../services/notificationService";
import { pushSubscriptionService } from '../services/pushSubscription';
import { supabase } from '../services/supabase';
import { NotificationCategory, UserNotificationPreference } from '../types/notification';
import { pushNotificationService } from '../utils/pushNotifications';
import { useAuth } from "./useAuth";
import { useSupabase } from "./useSupabase";

// 🔹 Tipagem para status
type PushStatus = "loading" | "granted" | "denied" | "unsupported";

export interface NotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
  //actions?: NotificationAction[];

}

export function usePushNotifications() {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<PushStatus>("loading");
  const [supported, setSupported] = useState(true);
  const { user } = useAuth();
  const { createNotification } = useSupabase();

  // ✅ NOVOS ESTADOS DA ATUALIZAÇÃO
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isInitialized, setIsInitialized] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserNotificationPreference[]>([]);
  const [categories, setCategories] = useState<NotificationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);

  // ✅ FUNÇÕES NOMEADAS

  // ✅ INICIALIZAR TOKEN
  async function initializeToken() {
    try {
      const hasActiveSubscription = await pushSubscriptionService.hasActiveSubscriptionForCurrentDevice();

      if (hasActiveSubscription) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          setToken(subscription.endpoint);
          console.log("✅ Token de notificação inicializado:", subscription.endpoint.substring(0, 50) + '...');
          return;
        }
      }

      const simulatedToken = `push-token-${Date.now()}-${user?.id || 'anonymous'}`;
      setToken(simulatedToken);
      console.log("✅ Token simulado inicializado:", simulatedToken);
    } catch (error) {
      console.error("❌ Erro ao inicializar token:", error);
    }
  }

  // ✅ CARREGAR CATEGORIAS
  async function loadCategories() {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  }

  // ✅ CARREGAR PREFERÊNCIAS DO USUÁRIO
  async function loadUserPreferences(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select(`
          *,
          category:category_id (*)
        `)
        .eq('user_id', userId);

      if (error) throw error;

      setUserPreferences(data || []);
    } catch (error) {
      console.error('Erro ao carregar preferências:', error);
    }
  }

  // ✅ VERIFICAR SE USUÁRIO JÁ TEM SUBSCRIPTION
  async function checkExistingSubscription(userId: string) {
    try {
      const hasSubscription = await pushNotificationService.hasActiveSubscription(userId);

      if (hasSubscription) {
        const category = await pushNotificationService.getUserCategory(userId);
        setCurrentCategory(category);
        setIsInitialized(true);
      }

      return hasSubscription;
    } catch (error) {
      console.error('Erro ao verificar subscription:', error);
      return false;
    }
  }

  // ✅ VERIFICAR SE CATEGORIA ESTÁ ATIVA
  function isCategoryEnabled(categoryId: string): boolean {
    const preference = userPreferences.find(p => p.category_id === categoryId);
    return preference ? preference.is_enabled : true; // Padrão ativado
  }

  // ✅ SOLICITAR PERMISSÃO
  async function requestPermission(): Promise<boolean> {
    try {
      console.log("🔄 Solicitando permissão de notificação...");

      if (!supported) {
        console.warn("❌ Notificações não suportadas");
        return false;
      }

      if (status === "granted") {
        console.log("✅ Permissão já concedida");
        return true;
      }

      if (status === "denied") {
        console.warn("🔕 Permissão já negada anteriormente");
        return false;
      }

      const permissionResult = await Notification.requestPermission();
      console.log("🔔 Resultado da permissão:", permissionResult);

      setPermission(permissionResult);

      if (permissionResult === "granted") {
        setStatus("granted");
      } else if (permissionResult === "denied") {
        setStatus("denied");
      } else {
        setStatus("loading");
      }

      if (permissionResult === "granted") {
        console.log("🎉 Permissão concedida! Notificações ativadas.");

        await pushSubscriptionService.initialize();
        await initializeToken();

        // ✅ Mostrar notificação de boas-vindas
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification('🔔 Notificações Ativadas!', {
              body: 'Agora você receberá alertas sobre promoções e novidades.',
              icon: '/icon-192x192.png',
              tag: 'welcome'
            });
          }).catch(error => {
            console.warn('⚠️ Erro ao mostrar notificação de boas-vindas:', error);
          });
        }

        // ✅ Salvar no banco de dados se usuário estiver logado
        if (user?.id) {
          try {
            await createNotification({
              titulo: "Notificações Ativadas",
              mensagem: "Você ativou as notificações do sistema",
              user_id: user.id,
              tipo: "sistema"
            });
          } catch (error) {
            console.log("ℹ️ Notificação não salva no banco (modo offline)");
          }
        }

        return true;
      } else {
        console.warn("❌ Permissão negada pelo usuário");
        return false;
      }
    } catch (error) {
      console.error("❌ Erro ao solicitar permissão:", error);
      setStatus("denied");
      return false;
    }
  }

  // ✅ INICIALIZAR PUSH NOTIFICATIONS COM CATEGORIA
  async function initializePush(userId: string, category?: string): Promise<boolean> {
    if (!supported || !userId) {
      console.warn('Push não suportado ou usuário não autenticado');
      return false;
    }

    setLoading(true);
    try {
      // ✅ Solicitar permissão primeiro se necessário
      if (permission === 'default') {
        const granted = await requestPermission();
        if (!granted) return false;
      }

      // ✅ Usar o serviço de push notifications
      const success = await pushNotificationService.initialize(userId, category);

      if (success) {
        setIsInitialized(true);
        setCurrentCategory(category || null);

        // ✅ Carregar preferências após inicialização
        await loadUserPreferences(userId);

        // ✅ Obter token de subscription
        await initializeToken();
      }

      return success;
    } catch (error) {
      console.error('Erro ao inicializar push:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }

  // ✅ ATUALIZAR PREFERÊNCIA DE CATEGORIA
  async function updatePreference(
    userId: string,
    categoryId: string,
    enabled: boolean
  ): Promise<boolean> {
    try {
      // ✅ Atualizar no banco
      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: userId,
          category_id: categoryId,
          is_enabled: enabled,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,category_id'
        });

      if (error) throw error;

      // ✅ Atualizar estado local
      setUserPreferences(prev => {
        const existing = prev.find(p => p.category_id === categoryId);
        if (existing) {
          return prev.map(p =>
            p.category_id === categoryId
              ? { ...p, is_enabled: enabled }
              : p
          );
        } else {
          return [...prev, {
            id: '', // Será gerado pelo banco
            user_id: userId,
            category_id: categoryId,
            is_enabled: enabled
          }];
        }
      });

      // ✅ Se habilitado, atualizar categoria no push
      if (enabled) {
        await pushNotificationService.updateUserCategory(userId, categoryId);
        setCurrentCategory(categoryId);
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar preferência:', error);
      return false;
    }
  }

  // ✅ REGISTRAR PUSH
  async function registerPush(): Promise<PushSubscription | null> {
    if (!supported || !user) return null;

    try {
      console.log("🔄 Registrando push notification...");

      const subscription = await pushSubscriptionService.registerPush();

      if (subscription) {
        setToken(subscription.endpoint);
        console.log("✅ Push notification registrada com sucesso");

        setPermission('granted');
        setStatus('granted');
      }

      return subscription;

    } catch (error) {
      console.error('❌ Erro ao registrar push:', error);
      return null;
    }
  }

  // ✅ DESREGISTRAR PUSH
  async function unregisterPush() {
    if (!user) return;

    try {
      console.log("🔄 Desregistrando push notification...");

      await pushSubscriptionService.unregisterPush();

      setToken(null);
      setPermission('default');
      setStatus('loading');
      setIsInitialized(false);

      console.log('✅ Push notification desregistrada');
    } catch (error) {
      console.error('❌ Erro ao desregistrar push:', error);
    }
  }

  // ✅ ENVIAR NOTIFICAÇÃO TESTE
  async function sendTestNotification() {
    if (!user || permission !== 'granted') return;

    try {
      console.log("🔄 Enviando notificação de teste...");

      const { error } = await supabase
        .from('notificacoes')
        .insert([
          {
            user_id: user.id,
            title: '🔔 Teste de Notificação',
            message: 'Esta é uma notificação de teste do sistema!',
            type: 'sistema',
            read: false,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;

      await sendNotification(
        '🔔 Teste de Notificação',
        'Esta é uma notificação de teste do sistema!',
        { tag: 'test', data: { type: 'test' } }
      );

      console.log('✅ Notificação de teste enviada');
    } catch (error) {
      console.error('❌ Erro ao enviar notificação teste:', error);
    }
  }

  // ✅ SOLICITAR PERMISSÃO COM MODAL
  async function requestPermissionWithModal(): Promise<boolean> {
    try {
      console.log("🔄 Iniciando solicitação com modal...");

      if (!supported) {
        console.warn("⚠️ Notificações não suportadas");
        return false;
      }

      const granted = await notificationService.showPermissionModal?.() ||
                     await requestPermission();

      return granted;
    } catch (error) {
      console.error("❌ Erro ao solicitar permissão com modal:", error);
      return false;
    }
  }

  // ✅ ENVIAR NOTIFICAÇÃO DIRETA
  async function sendNotification(
    title: string,
    body: string,
    options: any = {}
  ): Promise<boolean> {
    try {
      console.log("📤 Tentando enviar notificação:", title);

      // ✅ Tentar via service worker primeiro
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          data: {
            title,
            body,
            icon: '/icon-192x192.png',
            tag: options.tag || 'general',
            data: options.data || {},
            requireInteraction: options.requireInteraction || false
          }
        });
        console.log("✅ Notificação enviada via Service Worker");

        // ✅ Salvar no banco se usuário estiver logado
        if (user?.id) {
          try {
            await createNotification({
              titulo: title,
              mensagem: body,
              user_id: user.id,
              tipo: options.data?.type || "info",
              payload: options.data
            });
          } catch (dbError) {
            console.log("ℹ️ Notificação não salva no banco", dbError);
          }
        }

        return true;
      }

      // ✅ Fallback: Notificação direta do navegador
      if (Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: '/icon-192x192.png',
          tag: options.tag || 'general'
        });

        console.log("✅ Notificação enviada diretamente");

        // ✅ Salvar no banco
        if (user?.id) {
          try {
            await createNotification({
              titulo: title,
              mensagem: body,
              user_id: user.id,
              tipo: options.data?.type || "info",
              payload: options.data
            });
          } catch (dbError) {
            console.log("ℹ️ Notificação não salva no banco", dbError);
          }
        }

        return true;
      }

      console.warn("⚠️ Sem permissão para notificações");

      // ✅ Fallback final: Notificação in-app
      notificationService.showInAppNotification?.(title, body);
      return true;

    } catch (error) {
      console.error("❌ Erro ao enviar notificação:", error);

      notificationService.showInAppNotification?.(title, body);
      return true;
    }
  }

  // ✅ ENVIAR NOTIFICAÇÃO CATEGORIZADA
  async function sendCategorizedNotification(
    category: string,
    title: string,
    message: string,
    userId?: string
  ): Promise<boolean> {
    try {
      let notificationTitle = title;
      let notificationBody = message;
      let emoji = "📢";

      switch (category) {
        case 'reserva':
          notificationTitle = `🛒 ${title}`;
          notificationBody = message;
          emoji = "🛒";
          break;
        case 'promocao':
          notificationTitle = `🔥 ${title}`;
          notificationBody = message;
          emoji = "🔥";
          break;
        case 'estoque':
          notificationTitle = `⚠️ ${title}`;
          notificationBody = message;
          emoji = "⚠️";
          break;
        case 'sistema':
          notificationTitle = `⚙️ ${title}`;
          notificationBody = message;
          emoji = "⚙️";
          break;
        case 'categoria':
          notificationTitle = `🎯 ${title}`;
          notificationBody = message;
          emoji = "🎯";
          break;
        default:
          notificationTitle = `📢 ${title}`;
          notificationBody = message;
          emoji = "📢";
      }

      const result = await sendNotification(
        notificationTitle,
        notificationBody,
        {
          tag: category,
          requireInteraction: true,
          data: {
            type: category,
            emoji,
            originalTitle: title,
            userId
          }
        }
      );

      return result;
    } catch (error) {
      console.error("❌ Erro ao enviar notificação categorizada:", error);
      notificationService.showInAppNotification?.(title, message);
      return true;
    }
  }

  // ✅ NOTIFICAÇÃO DE NOVO PRODUTO
  async function sendProductNotification(
    productName: string,
    price?: number
  ): Promise<boolean> {
    const title = "🛍️ Novo Produto Disponível!";
    const body = price
      ? `Confira ${productName} por R$ ${price}`
      : `Confira nosso novo produto: ${productName}`;

    return await sendNotification(title, body, {
      tag: 'new-product',
      requireInteraction: true,
      data: { type: 'product', productName, price }
    });
  }

  // ✅ NOTIFICAÇÃO DE NOVA PROMOÇÃO
  async function sendPromotionNotification(
    promotionTitle: string,
    discount?: string
  ): Promise<boolean> {
    const title = "🔥 Nova Promoção!";
    const body = discount
      ? `${promotionTitle} - ${discount} de desconto`
      : promotionTitle;

    return await sendNotification(title, body, {
      tag: 'new-promotion',
      requireInteraction: true,
      data: { type: 'promotion', promotionTitle, discount }
    });
  }

  // ✅ NOTIFICAÇÃO DE RESERVA
  async function sendReservationNotification(
    productName: string,
    clientName: string,
    reservationId: string,
    isStore: boolean = false
  ): Promise<boolean> {
    try {
      const title = isStore ? "🛒 Nova Reserva Recebida" : "✅ Reserva Confirmada";
      const body = isStore
        ? `${clientName} reservou ${productName}`
        : `Sua reserva de ${productName} foi confirmada`;

      const result = await sendNotification(title, body, {
        tag: 'reservation',
        requireInteraction: true,
        data: {
          type: 'reservation',
          productName,
          clientName,
          reservationId,
          isStore
        }
      });

      if (result) {
        console.log(`✅ Notificação de reserva enviada: ${productName}`);
      }

      return result;
    } catch (error) {
      console.error("❌ Erro ao enviar notificação de reserva:", error);
      return false;
    }
  }

  // ✅ NOTIFICAÇÃO DE ESTOQUE BAIXO
  async function sendLowStockNotification(
    productName: string,
    currentStock: number
  ): Promise<boolean> {
    try {
      const title = "⚠️ Estoque Baixo";
      const body = `${productName} está com apenas ${currentStock} unidades`;

      const result = await sendNotification(title, body, {
        tag: 'low-stock',
        requireInteraction: true,
        data: { type: 'stock', productName, currentStock }
      });

      if (result) {
        console.log(`✅ Notificação de estoque baixo enviada: ${productName}`);
      }

      return result;
    } catch (error) {
      console.error("❌ Erro ao enviar notificação de estoque baixo:", error);
      return false;
    }
  }

  // ✅ NOTIFICAÇÃO DE CATEGORIA
  async function sendCategoryNotification(
    categoryName: string,
    message: string,
    userId?: string
  ): Promise<boolean> {
    try {
      const title = `🎯 ${categoryName}`;

      const result = await sendNotification(title, message, {
        tag: 'category',
        data: { type: 'category', categoryName, userId }
      });

      if (result) {
        console.log(`✅ Notificação de categoria enviada: ${categoryName}`);
      }

      return result;
    } catch (error) {
      console.error("❌ Erro ao enviar notificação de categoria:", error);
      return false;
    }
  }

  // ✅ NOTIFICAÇÃO DE SISTEMA
  async function sendSystemNotification(
    title: string,
    message: string,
    userId?: string
  ): Promise<boolean> {
    try {
      const result = await sendNotification(title, message, {
        tag: 'system',
        data: { type: 'system', userId }
      });

      if (result) {
        console.log(`✅ Notificação de sistema enviada: ${title}`);
      }

      return result;
    } catch (error) {
      console.error("❌ Erro ao enviar notificação de sistema:", error);
      return false;
    }
  }

  // ✅ OBTER ESTATÍSTICAS
  async function getNotificationStats() {
    try {
      return await notificationService.getNotificationStats?.() || { total: 0, unread: 0 };
    } catch (error) {
      console.error("❌ Erro ao buscar estatísticas:", error);
      return { total: 0, unread: 0 };
    }
  }

  // ✅ VERIFICAR SE PODE SOLICITAR PERMISSÃO
  function canRequestPermission(): boolean {
    return Notification.permission === "default";
  }

  // ✅ VERIFICAR SE ESTÁ BLOQUEADO
  function isBlocked(): boolean {
    return Notification.permission === "denied";
  }

  // ✅ VERIFICAR SE ESTÁ ATIVO
  function isGranted(): boolean {
    return Notification.permission === "granted";
  }

  // ✅ INICIALIZAR SISTEMA
  async function initializeSystem(): Promise<boolean> {
    try {
      console.log("🚀 Inicializando sistema de notificações...");

      if (Notification.permission === "granted") {
        console.log("✅ Sistema já inicializado");
        setStatus("granted");

        await pushSubscriptionService.initialize();
        await initializeToken();

        if (user?.id) {
          await initializePush(user.id);
        }

        return true;
      }

      if (Notification.permission === "default") {
        console.log("🔄 Solicitando permissão...");
        return await requestPermission();
      }

      console.log("🔕 Permissão negada, usando modo local");
      setStatus("denied");
      return false;
    } catch (error) {
      console.error("❌ Erro na inicialização:", error);
      setStatus("denied");
      return false;
    }
  }

  // ✅ REINICIALIZAR SISTEMA
  async function reinitializeSystem(): Promise<boolean> {
    try {
      console.log("🔄 Reinicializando sistema de notificações...");

      setToken(null);
      setStatus("loading");
      setIsInitialized(false);

      await new Promise(resolve => setTimeout(resolve, 1000));

      return await initializeSystem();
    } catch (error) {
      console.error("❌ Erro ao reinicializar sistema:", error);
      return false;
    }
  }

  // ✅ LIMPAR NOTIFICAÇÕES LOCAIS
  function clearLocalNotifications(): void {
    try {
      localStorage.removeItem('app_notification_history');
      console.log("🗑️ Notificações locais limpas");
    } catch (error) {
      console.warn("⚠️ Erro ao limpar notificações locais:", error);
    }
  }

  // ✅ OBTER STATUS DO SISTEMA
  async function getSystemStatus() {
    try {
      const pushStatus = await pushSubscriptionService.getSystemStatus();
      const permission = Notification.permission;

      return {
        supported: pushStatus.pushManager && pushStatus.serviceWorker,
        permission,
        granted: permission === "granted",
        serviceWorker: pushStatus.serviceWorker,
        pushManager: pushStatus.pushManager,
        vapidKey: pushStatus.vapidKey,
        user: user ? {
          id: user.id,
          type: user.type,
          lojaId: user.lojaId
        } : null,
        isInitialized,
        currentCategory,
        userPreferences
      };
    } catch (error) {
      console.error("❌ Erro ao obter status do sistema:", error);
      const permission = Notification.permission;
      return {
        supported: "Notification" in window && "serviceWorker" in navigator,
        permission,
        granted: permission === "granted",
        serviceWorker: 'serviceWorker' in navigator,
        pushManager: 'PushManager' in window,
        vapidKey: { present: false, valid: false },
        user: user ? { id: user.id, type: user.type, lojaId: user.lojaId } : null,
        isInitialized,
        currentCategory,
        userPreferences
      };
    }
  }

  // ✅ INICIALIZAÇÃO COMPLETA DO SISTEMA
  useEffect(() => {
    async function initializePushSystem() {
      try {
        // ✅ Verificar status do sistema usando serviço unificado
        const pushStatus = await pushSubscriptionService.getSystemStatus();

        setSupported(pushStatus.pushManager && pushStatus.serviceWorker);
        setPermission(Notification.permission);

        const currentPermission = Notification.permission;
        console.log("🔍 Permissão inicial detectada:", currentPermission);

        if (currentPermission === "granted") {
          setStatus("granted");
          console.log("✅ Permissão já concedida anteriormente");

          // ✅ Inicializar usando serviço unificado
          await pushSubscriptionService.initialize();

          // ✅ Verificar subscription ativa
          const hasActiveSubscription = await pushSubscriptionService.hasActiveSubscriptionForCurrentDevice();
          if (hasActiveSubscription) {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
              setToken(subscription.endpoint);
              console.log("✅ Token de subscription obtido:", subscription.endpoint.substring(0, 50) + '...');
            }
            setIsInitialized(true);
          }
        } else if (currentPermission === "denied") {
          setStatus("denied");
          console.log("🔕 Permissão negada - usando modo local");
        } else {
          setStatus("loading");
          console.log("⏳ Permissão nunca solicitada - pronto para solicitar");
        }

        // ✅ Carregar categorias se usuário estiver logado
        if (user?.id) {
          await loadCategories();
          await loadUserPreferences(user.id);
          await checkExistingSubscription(user.id);
        }

      } catch (error) {
        console.error("❌ Erro ao inicializar push:", error);
        setStatus("unsupported");
        setSupported(false);
      } finally {
        setLoading(false);
      }
    }

    initializePushSystem();
  }, [user]);

  // ✅ RETORNO FINAL COMPLETO
  return {
    // Estado principal
    token,
    status,
    supported,
    isSupported: supported,
    permission,

    // ✅ NOVOS ESTADOS DA ATUALIZAÇÃO
    isInitialized,
    userPreferences,
    categories,
    loading,
    currentCategory,

    // Ações principais
    requestPermission,
    requestPermissionWithModal,
    initializeSystem,
    reinitializeSystem,

    // ✅ NOVAS AÇÕES DA ATUALIZAÇÃO
    initializePush,              // ✅ Inicializar com categoria
    updatePreference,            // ✅ Atualizar preferência
    checkExistingSubscription,   // ✅ Verificar subscription existente
    loadCategories,              // ✅ Carregar categorias
    loadUserPreferences,         // ✅ Carregar preferências
    isCategoryEnabled,           // ✅ Verificar categoria ativa


    // Ações de registro
    registerPush,
    unregisterPush,
    sendTestNotification,

    // Envio de notificações
    sendNotification,
    sendCategorizedNotification,

    // Notificações específicas do sistema
    sendReservationNotification,
    sendPromotionNotification,
    sendLowStockNotification,
    sendCategoryNotification,
    sendSystemNotification,

    // Notificações simplificadas
    sendProductNotification,

    // Utilitários
    getNotificationStats,
    canRequestPermission,
    isBlocked,
    isGranted,


    // Compatibilidade
    checkPermission: () => Notification.permission,

    // Métodos para modo local
    getLocalNotifications: () => notificationService.getLocalHistory?.() || [],
    markLocalAsRead: (id: string) => notificationService.markLocalNotificationAsRead?.(id),
    clearLocalNotifications,

    // Status do sistema
    getSystemStatus,

    // Debug info
    debugInfo: () => ({
      token,
      status,
      supported,
      permission: Notification.permission,
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      user: user ? { id: user.id, type: user.type } : null,
      isInitialized,
      currentCategory,
      userPreferencesCount: userPreferences.length,
      categoriesCount: categories.length,
      timestamp: new Date().toISOString()
    })
  };
}
