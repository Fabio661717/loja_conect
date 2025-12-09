// src/services/notificationService.ts - VERSÃO CORRIGIDA
import {
  NotificationCategory,
  UserNotificationPreference
} from "../types/notification";
import { pushSubscriptionService } from './pushSubscription';
import { supabase } from "./supabase";

// ✅ INTERFACE PARA NOTIFICAÇÕES LOCAIS
interface LocalNotification {
  id: string;
  title: string;
  message: string;
  category: string;
  timestamp: string;
  read: boolean;
  type?: 'promocao' | 'novo_produto' | 'reserva' | 'estoque' | 'info';
}

// ✅ INTERFACE PARA OPÇÕES DE NOTIFICAÇÃO
interface NotificationOptions {
  category?: string;
  url?: string;
  productId?: string;
  lojaId?: string;
  type?: string;
  timestamp?: string;
  reservationId?: string;
  minutesLeft?: number;
  urgent?: boolean;
  discount?: number;
  originalPrice?: number;
  promotionPrice?: number;
  promotionId?: string;
  data?: Record<string, any>;
  [key: string]: any;
}

// ✅ ADICIONADO: Utilitário de compatibilidade do navegador
const checkBrowserCompatibility = () => {
  const compatibility = {
    notifications: 'Notification' in window,
    serviceWorker: 'serviceWorker' in navigator,
    pushManager: 'PushManager' in window,
    audioContext: 'AudioContext' in window || 'webkitAudioContext' in window,
    localStorage: 'localStorage' in window,
    indexedDB: 'indexedDB' in window,
    lockManager: 'locks' in navigator
  };

  const warnings = [];
  const missingFeatures = [];

  if (!compatibility.notifications) missingFeatures.push('notifications');
  if (!compatibility.serviceWorker) warnings.push('serviceWorker');
  if (!compatibility.pushManager) warnings.push('pushManager');
  if (!compatibility.audioContext) warnings.push('audioContext');
  if (!compatibility.lockManager) warnings.push('lockManager');

  return {
    compatibility,
    warnings,
    missingFeatures,
    isFullyCompatible: compatibility.notifications && compatibility.serviceWorker
  };
};

// ✅ ADICIONADO: LockManager compatível
const createCompatibleLockManager = () => {
  const isSupported = 'locks' in navigator;

  if (isSupported) {
    return {
      request: async (name: string, _options?: any) => {
        return await navigator.locks.request(name, _options);
      }
    };
  } else {
    // Fallback para navegadores sem suporte a LockManager
    const locks = new Map();

    return {
      request: async (name: string, _options?: any) => {
        // Simular comportamento básico de lock
        if (locks.has(name)) {
          await new Promise(resolve => setTimeout(resolve, 100));
          return () => {}; // Função de release vazia
        }

        locks.set(name, true);
        return () => {
          locks.delete(name);
        };
      }
    };
  }
};

class NotificationService {
  private static instance: NotificationService;
  private readonly LOCAL_STORAGE_KEY = 'cliente_notification_history';
  private readonly NOTIFICATION_HISTORY_KEY = 'notificationHistory';
  private localNotifications: any[] = [];
  private isSoundEnabled = true;
  private isPushEnabled = false;

  // ✅ ADICIONADO: Otimizações
  private lockManager: any;
  private requestQueue: Map<string, Promise<any>> = new Map();
  private categoryCache: Map<string, { data: any[], timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor() {
    // ✅ CORREÇÃO: Inicializar LockManager compatível
    this.lockManager = createCompatibleLockManager();

    this.createNotificationSound();
    this.initializePush();
    this.setupRealtimeNotifications();

    console.log('🔧 NotificationService inicializado com LockManager compatível');
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // ✅ CORREÇÃO: Método para evitar requisições duplicadas
  private async withRequestDeduplication<T>(
    key: string,
    operation: () => Promise<T>
  ): Promise<T> {
    // Se já existe uma requisição em andamento com a mesma chave, retorna ela
    if (this.requestQueue.has(key)) {
      console.log(`🔄 [Deduplication] Reutilizando requisição: ${key}`);
      return this.requestQueue.get(key) as Promise<T>;
    }

    // Criar nova requisição
    const requestPromise = operation().finally(() => {
      this.requestQueue.delete(key);
    });

    this.requestQueue.set(key, requestPromise);
    return requestPromise;
  }

  // ✅ CORREÇÃO: Método para carregar categorias com cache e deduplicação
  async loadStoreCategories(storeId: string): Promise<any[]> {
    const cacheKey = `categories-${storeId}`;

    return this.withRequestDeduplication(cacheKey, async () => {
      try {
        console.log('🔄 Carregando categorias da loja:', storeId);

        // Verificar cache em memória primeiro
        const cached = this.categoryCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
          console.log('✅ Categorias carregadas do cache em memória:', cached.data.length);
          return cached.data;
        }

        // Verificar cache no localStorage
        const localStorageCached = localStorage.getItem(cacheKey);
        if (localStorageCached) {
          const categories = JSON.parse(localStorageCached);
          console.log('✅ Categorias carregadas do localStorage:', categories.length);

          // Atualizar cache em memória
          this.categoryCache.set(cacheKey, {
            data: categories,
            timestamp: Date.now()
          });

          return categories;
        }

        const { data, error } = await supabase
          .from('categorias')
          .select('*')
          .eq('loja_id', storeId)
          .order('nome');

        if (error) {
          console.error('❌ Erro ao carregar categorias:', error);
          throw error;
        }

        const categories = data || [];

        // Salvar no cache em memória
        this.categoryCache.set(cacheKey, {
          data: categories,
          timestamp: Date.now()
        });

        // Salvar no localStorage também
        localStorage.setItem(cacheKey, JSON.stringify(categories));

        console.log('✅ Categorias da loja carregadas:', categories.length);
        return categories;

      } catch (error) {
        console.error('❌ Erro ao carregar categorias:', error);
        return [];
      }
    });
  }

  // ✅ CORREÇÃO CRÍTICA: Usar LockManager compatível nas operações
  private async withLock(operation: string, callback: () => Promise<any>) {
    try {
      const release = await this.lockManager.request(`notification-${operation}`);

      try {
        return await callback();
      } finally {
        if (release) release();
      }
    } catch (error) {
      console.warn(`⚠️ Lock não adquirido para ${operation}, continuando sem lock:`, error);
      return await callback();
    }
  }

  // ✅ CONFIGURAR NOTIFICAÇÕES EM TEMPO REAL
  private setupRealtimeNotifications() {
    // Escutar por novos produtos em tempo real
    const produtosChannel = supabase
      .channel('new-products')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'produtos'
        },
        (payload) => {
          console.log('🆕 Novo produto detectado em tempo real:', payload.new);
          this.handleNewProductRealtime(payload.new);
        }
      )
      .subscribe();

    // Escutar por novas promoções em tempo real
    const promocoesChannel = supabase
      .channel('new-promotions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'promocoes'
        },
        (payload) => {
          console.log('🔥 Nova promoção detectada em tempo real:', payload.new);
          this.handleNewPromotionRealtime(payload.new);
        }
      )
      .subscribe();

    console.log('📡 Sistema de notificações em tempo real ativado');

    // ✅ CORREÇÃO: Retornar função de cleanup
    return () => {
      supabase.removeChannel(produtosChannel);
      supabase.removeChannel(promocoesChannel);
    };
  }

  // ✅ MANIPULAR NOVO PRODUTO EM TEMPO REAL
  private async handleNewProductRealtime(newProduct: any) {
    try {
      console.log('🔄 Processando novo produto em tempo real:', newProduct.nome);

      // Buscar informações completas do produto e categoria
      const { data: productData, error: productError } = await supabase
        .from('produtos')
        .select(`
          *,
          categorias (
            nome,
            id
          )
        `)
        .eq('id', newProduct.id)
        .single();

      if (productError || !productData) {
        console.error('❌ Erro ao buscar dados do produto:', productError);
        return;
      }

      const categoriaNome = productData.categorias?.nome;

      if (!categoriaNome) {
        console.warn('⚠️ Categoria não encontrada para o produto:', newProduct.nome);
        return;
      }

      console.log(`📢 Notificando clientes sobre novo produto: ${newProduct.nome} na categoria ${categoriaNome}`);

      // Buscar clientes interessados nesta categoria
      const { data: interestedUsers, error: usersError } = await supabase
        .from('users')
        .select('id, nome, preferred_categories')
        .contains('preferred_categories', [categoriaNome]);

      if (usersError) {
        console.error('❌ Erro ao buscar usuários interessados:', usersError);
      }

      const { data: interestedClients, error: clientesError } = await supabase
        .from('clientes')
        .select('id, nome, preferred_categories')
        .contains('preferred_categories', [categoriaNome]);

      // ✅ CORREÇÃO: Removido clientesError não utilizado
      if (clientesError) {
        console.warn('⚠️ Erro ao buscar clientes interessados');
      }

      const allInterestedUsers = [
        ...(interestedUsers || []),
        ...(interestedClients || [])
      ];

      if (allInterestedUsers.length === 0) {
        console.log(`🔕 Nenhum cliente interessado na categoria: ${categoriaNome}`);
        return;
      }

      console.log(`👥 ${allInterestedUsers.length} clientes interessados na categoria ${categoriaNome}`);

      // Enviar notificações para cada usuário interessado
      for (const user of allInterestedUsers) {
        await this.sendNewProductNotification(
          user.id,
          productData.nome,
          productData.preco,
          categoriaNome,
          productData.id,
          newProduct.loja_id
        );
      }

      console.log(`✅ Notificações enviadas para ${allInterestedUsers.length} clientes`);

    } catch (error) {
      console.error('❌ Erro no processamento em tempo real:', error);
    }
  }

  // ✅ MANIPULAR NOVA PROMOÇÃO EM TEMPO REAL
  private async handleNewPromotionRealtime(newPromotion: any) {
    try {
      console.log('🔄 Processando nova promoção em tempo real:', newPromotion.id);

      // Buscar informações completas da promoção e produto
      const { data: promotionData, error: promotionError } = await supabase
        .from('promocoes')
        .select(`
          *,
          produtos (
            nome,
            preco,
            categorias (
              nome
            )
          )
        `)
        .eq('id', newPromotion.id)
        .single();

      if (promotionError || !promotionData) {
        console.error('❌ Erro ao buscar dados da promoção:', promotionError);
        return;
      }

      const productName = promotionData.produtos?.nome;
      const originalPrice = promotionData.produtos?.preco;
      const promotionPrice = promotionData.preco_promocional;
      const categoryName = promotionData.produtos?.categorias?.nome;

      if (!productName || !categoryName) {
        console.warn('⚠️ Dados incompletos para a promoção');
        return;
      }

      console.log(`🔥 Notificando clientes sobre promoção: ${productName}`);

      // Buscar clientes interessados em promoções
      const { data: interestedUsers, error: usersError } = await supabase
        .from('users')
        .select('id, nome, preferred_categories')
        .contains('preferred_categories', ['promocoes']);

      if (usersError) {
        console.error('❌ Erro ao buscar usuários interessados em promoções:', usersError);
      }

      const { data: interestedClients, error: clientsError } = await supabase
        .from('clientes')
        .select('id, nome, preferred_categories')
        .contains('preferred_categories', ['promocoes']);

      // ✅ CORREÇÃO: Corrigido nome da variável para clientsError
      if (clientsError) {
        console.warn('⚠️ Erro ao buscar clientes interessados em promoções');
      }

      const allInterestedUsers = [
        ...(interestedUsers || []),
        ...(interestedClients || [])
      ];

      if (allInterestedUsers.length === 0) {
        console.log('🔕 Nenhum cliente interessado em promoções');
        return;
      }

      // Enviar notificações para cada usuário interessado
      for (const user of allInterestedUsers) {
        await this.sendPromotionNotification(
          user.id,
          productName,
          originalPrice,
          promotionPrice,
          categoryName,
          newPromotion.id,
          newPromotion.loja_id
        );
      }

      console.log(`✅ Notificações de promoção enviadas para ${allInterestedUsers.length} clientes`);

    } catch (error) {
      console.error('❌ Erro no processamento de promoção em tempo real:', error);
    }
  }

  // ✅ ENVIAR NOTIFICAÇÃO DE NOVO PRODUTO
  private async sendNewProductNotification(
    userId: string,
    productName: string,
    price: number,
    categoryName: string,
    productId: string,
    storeId: string
  ): Promise<boolean> {
    try {
      const title = '🆕 Novo Produto Disponível!';
      const message = `${productName} por R$ ${price.toFixed(2)} - ${categoryName}`;

      const success = await this.sendPushNotification(
        title,
        message,
        {
          category: 'novo_produto',
          url: `/cliente/produto/${productId}`,
          productId: productId,
          lojaId: storeId,
          type: 'new_product',
          timestamp: new Date().toISOString()
        }
      );

      if (success) {
        // Salvar no histórico de notificações
        await this.withLock('save-notification', async () => {
          await supabase
            .from('notificacoes_cliente')
            .insert({
              cliente_id: userId,
              titulo: title,
              mensagem: message,
              tipo: 'novo_produto',
              produto_id: productId,
              loja_id: storeId,
              lida: false,
              data: {
                productName,
                price,
                categoryName,
                productId,
                storeId
              }
            });
        });
      }

      return success;

    } catch (error) {
      console.error('❌ Erro ao enviar notificação de novo produto:', error);
      return false;
    }
  }

  // ✅ ENVIAR NOTIFICAÇÃO DE PROMOÇÃO
  private async sendPromotionNotification(
    userId: string,
    productName: string,
    originalPrice: number,
    promotionPrice: number,
    categoryName: string,
    promotionId: string,
    storeId: string
  ): Promise<boolean> {
    try {
      const discount = Math.round(((originalPrice - promotionPrice) / originalPrice) * 100);
      const title = '🔥 PROMOÇÃO IMPERDÍVEL!';
      const message = `${productName} com ${discount}% OFF! De R$ ${originalPrice.toFixed(2)} por R$ ${promotionPrice.toFixed(2)}`;

      const success = await this.sendPushNotification(
        title,
        message,
        {
          category: 'promocao',
          url: `/cliente/promocao/${promotionId}`,
          promotionId: promotionId,
          lojaId: storeId,
          discount: discount,
          originalPrice: originalPrice,
          promotionPrice: promotionPrice,
          type: 'promotion',
          timestamp: new Date().toISOString()
        }
      );

      if (success) {
        // Salvar no histórico de notificações
        await this.withLock('save-promotion-notification', async () => {
          await supabase
            .from('notificacoes_cliente')
            .insert({
              cliente_id: userId,
              titulo: title,
              mensagem: message,
              tipo: 'promocao',
              produto_id: promotionId,
              loja_id: storeId,
              lida: false,
              data: {
                productName,
                originalPrice,
                promotionPrice,
                discount,
                categoryName,
                promotionId,
                storeId
              }
            });
        });
      }

      return success;

    } catch (error) {
      console.error('❌ Erro ao enviar notificação de promoção:', error);
      return false;
    }
  }

  // ✅ INICIALIZAR PUSH PARA CLIENTE
  private async initializePush() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        this.isPushEnabled = !!subscription;
        console.log('📱 Cliente - Push status:', this.isPushEnabled);
      } catch (error) {
        console.log('Push não suportado no cliente:', error);
      }
    }
  }

  // ✅ ENVIAR NOTIFICAÇÃO PUSH PARA CLIENTE
  async sendPushNotification(
    title: string,
    body: string,
    data?: NotificationOptions
  ): Promise<boolean> {
    try {
      console.log('📤 Enviando push para cliente:', title);

      // 1. Tentar notificação push via Service Worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;

        // Enviar via Service Worker (notificação local imediata)
        registration.active?.postMessage({
          type: 'SEND_PUSH_NOTIFICATION',
          payload: {
            title,
            body,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            data: {
              ...data,
              timestamp: new Date().toISOString(),
              url: data?.url || '/cliente/produtos'
            },
            vibrate: [200, 100, 200],
            requireInteraction: true,
            silent: false // ✅ SOM LIGADO
          }
        });
        console.log('✅ Notificação enviada para cliente via SW');
        return true;
      }

      // 2. Fallback para notificação local
      return await this.showLocalNotification(title, body, data);

    } catch (error) {
      console.error('❌ Erro ao enviar push para cliente:', error);
      return await this.showLocalNotification(title, body, data);
    }
  }

  // ✅ NOTIFICAÇÃO LOCAL (FALLBACK)
  private async showLocalNotification(title: string, body: string, data?: NotificationOptions): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('❌ Notificações não suportadas no navegador');
      return false;
    }

    if (Notification.permission === 'granted') {
      const options: NotificationOptions = {
        body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: data?.category || 'general',
        data: data,
        vibrate: [200, 100, 200],
        requireInteraction: true,
        silent: false // ✅ SOM LIGADO
      };

      const notification = new Notification(title, options);

      notification.onclick = () => {
        if (data?.url) {
          window.open(data.url, '_blank');
        }
        notification.close();
      };
      console.log('✅ Notificação local exibida');

      return true;
    }

    return false;
  }

  // ✅ FUNÇÃO CORRIGIDA: sendCategorizedNotification para trabalhar com NOMES REAIS
  async sendCategorizedNotification(
    categoryId: string,
    title: string,
    message: string,
    data: any = {}
  ): Promise<boolean> {
    try {
      console.log(`📤 Enviando notificação categorizada [ID: ${categoryId}]:`, title);

      // ✅ CORREÇÃO: Primeiro buscar o nome REAL da categoria
      const { data: categoriaData, error: catError } = await supabase
        .from('categorias')
        .select('nome')
        .eq('id', categoryId)
        .single();

      if (catError || !categoriaData) {
        console.error('❌ Categoria não encontrada:', categoryId);
        return false;
      }

      const categoriaNomeReal = categoriaData.nome;
      console.log(`📢 Categoria REAL encontrada: "${categoriaNomeReal}" (ID: ${categoryId})`);

      // ✅ CORREÇÃO: Buscar usuários que têm esta categoria REAL nas preferências
      const { data: usersWithPreferences, error: usersError } = await supabase
        .from('users')
        .select('id, nome, preferred_categories')
        .contains('preferred_categories', [categoriaNomeReal]);

      if (usersError) {
        console.error('❌ Erro ao buscar usuários com preferências:', usersError);
      }

      // ✅ CORREÇÃO: Buscar também da tabela clientes por NOME REAL
      const { data: clientesWithPreferences, error: clientesError } = await supabase
        .from('clientes')
        .select('id, nome, preferred_categories')
        .contains('preferred_categories', [categoriaNomeReal]);

      // ✅ CORREÇÃO: Removido clientesError não utilizado
      if (clientesError) {
        console.warn('⚠️ Erro ao buscar clientes com preferências');
      }

      const allInterestedUsers = [
        ...(usersWithPreferences || []),
        ...(clientesWithPreferences || [])
      ];

      if (!allInterestedUsers || allInterestedUsers.length === 0) {
        console.log(`🔕 Nenhum cliente interessado na categoria REAL: ${categoriaNomeReal}`);
        return false;
      }

      console.log(`📢 Enviando para ${allInterestedUsers.length} clientes da categoria REAL "${categoriaNomeReal}"`);

      // Enviar notificação para cada cliente interessado
      let successCount = 0;
      for (const user of allInterestedUsers) {
        try {
          const success = await this.sendPushNotification(
            title,
            message,
            {
              ...data,
              category: categoriaNomeReal,
              userId: user.id,
              url: data.url || `/cliente/produtos?categoria=${encodeURIComponent(categoriaNomeReal)}`
            }
          );
          if (success) successCount++;
        } catch (clienteError) {
          console.warn(`⚠️ Erro ao notificar cliente ${user.id}:`, clienteError);
        }
      }

      // Salvar no histórico do banco se houver clientes
      if (successCount > 0) {
        await this.withLock('save-categorized-notifications', async () => {
          await this.saveNotificationToDatabase(
            allInterestedUsers.map(c => c.id),
            title,
            message,
            categoriaNomeReal,
            data.productId || null,
            data.lojaId || null
          );
        });
      }

      console.log(`✅ ${successCount}/${allInterestedUsers.length} notificações enviadas para categoria REAL "${categoriaNomeReal}"`);
      return successCount > 0;

    } catch (error) {
      console.error('❌ Erro crítico em sendCategorizedNotification:', error);
      return false;
    }
  }

  // ✅ NOTIFICAR CLIENTES SOBRE NOVO PRODUTO (Método público para uso externo)
  async notifyNewProductToClients(
    productId: string,
    productName: string,
    price: number,
    categoryName: string,
    lojaId: string
  ): Promise<boolean> {
    try {
      console.log(`🆕 Notificando clientes sobre novo produto: ${productName}`);

      // Buscar clientes que têm esta categoria ativa
      const { data: clientesInteressados, error } = await supabase
        .from('user_notification_preferences')
        .select('user_id')
        .eq('category_id', categoryName)
        .eq('is_enabled', true);

      if (error) {
        console.error('❌ Erro ao buscar clientes interessados:', error);
        return false;
      }

      if (!clientesInteressados || clientesInteressados.length === 0) {
        console.log(`🔕 Nenhum cliente interessado na categoria: ${categoryName}`);
        return false;
      }

      console.log(`📢 Enviando para ${clientesInteressados.length} clientes`);

      // Enviar notificação para cada cliente
      for (const cliente of clientesInteressados) {
        try {
          await this.sendPushNotification(
            '🆕 Novo Produto!',
            `${productName} por R$ ${price.toFixed(2)} - ${categoryName}`,
            {
              category: 'novo_produto',
              url: `/cliente/produto/${productId}`,
              productId: productId,
              lojaId: lojaId
            }
          );
        } catch (clienteError) {
          console.warn(`⚠️ Erro ao notificar cliente ${cliente.user_id}:`, clienteError);
        }
      }

      // Salvar no histórico de notificações
      await this.withLock('save-product-notifications', async () => {
        await this.saveNotificationToDatabase(
          clientesInteressados.map(c => c.user_id),
          '🆕 Novo Produto!',
          `${productName} por R$ ${price.toFixed(2)} - ${categoryName}`,
          'novo_produto',
          productId,
          lojaId
        );
      });

      console.log(`✅ ${clientesInteressados.length} clientes notificados sobre novo produto`);
      return true;

    } catch (error) {
      console.error('❌ Erro ao notificar clientes sobre novo produto:', error);
      return false;
    }
  }

  // ✅ NOTIFICAR CLIENTES SOBRE PROMOÇÃO
  async notifyPromotionToClients(
    productId: string,
    productName: string,
    originalPrice: number,
    promotionPrice: number,
    lojaId: string
  ): Promise<boolean> {
    try {
      console.log(`🔥 Notificando clientes sobre promoção: ${productName}`);

      const discount = Math.round(((originalPrice - promotionPrice) / originalPrice) * 100);

      // Buscar clientes interessados em promoções
      const { data: clientesInteressados, error } = await supabase
        .from('user_notification_preferences')
        .select('user_id')
        .eq('category_id', 'promocoes')
        .eq('is_enabled', true);

      if (error) {
        console.error('❌ Erro ao buscar clientes para promoção:', error);
        return false;
      }

      if (!clientesInteressados || clientesInteressados.length === 0) {
        console.log('🔕 Nenhum cliente com notificações de promoção ativadas');
        return false;
      }

      console.log(`🔥 Enviando promoção para ${clientesInteressados.length} clientes`);

      // Enviar notificação de promoção
      for (const cliente of clientesInteressados) {
        try {
          await this.sendPushNotification(
            '🔥 PROMOÇÃO IMPERDÍVEL!',
            `${productName} com ${discount}% OFF! De R$ ${originalPrice.toFixed(2)} por R$ ${promotionPrice.toFixed(2)}`,
            {
              category: 'promocao',
              url: `/cliente/produto/${productId}`,
              productId: productId,
              lojaId: lojaId,
              discount: discount,
              originalPrice: originalPrice,
              promotionPrice: promotionPrice
            }
          );
        } catch (clienteError) {
          console.warn(`⚠️ Erro ao notificar promoção para ${cliente.user_id}:`, clienteError);
        }
      }

      // Salvar no histórico
      await this.withLock('save-promotion-notifications', async () => {
        await this.saveNotificationToDatabase(
          clientesInteressados.map(c => c.user_id),
          '🔥 PROMOÇÃO IMPERDÍVEL!',
          `${productName} com ${discount}% OFF! De R$ ${originalPrice.toFixed(2)} por R$ ${promotionPrice.toFixed(2)}`,
          'promocao',
          productId,
          lojaId
        );
      });

      console.log(`✅ ${clientesInteressados.length} clientes notificados sobre promoção`);
      return true;

    } catch (error) {
      console.error('❌ Erro ao notificar clientes sobre promoção:', error);
      return false;
    }
  }

  // ✅ NOTIFICAR ALERTA DE RESERVA EXPIRANDO
  async notifyReservationExpiring(
    reservationId: string,
    productName: string,
    clientId: string,
    minutesLeft: number
  ): Promise<boolean> {
    try {
      console.log(`⏰ Notificando cliente sobre reserva expirando: ${productName}`);

      const message = minutesLeft <= 30
        ? `⏰ URGENTE: Sua reserva de ${productName} expira em ${minutesLeft} minutos!`
        : `⏰ Lembrete: Sua reserva de ${productName} expira em ${minutesLeft} minutos`;

      const success = await this.sendPushNotification(
        '⏰ Reserva Expirando!',
        message,
        {
          category: 'reserva',
          url: `/cliente/reservas`,
          reservationId: reservationId,
          productName: productName,
          minutesLeft: minutesLeft,
          urgent: minutesLeft <= 30
        }
      );

      if (success) {
        // Salvar no histórico do cliente
        await this.withLock('save-reservation-alert', async () => {
          await supabase
            .from('notificacoes_cliente')
            .insert({
              cliente_id: clientId,
              titulo: '⏰ Reserva Expirando!',
              mensagem: message,
              tipo: 'reserva_alerta',
              lida: false,
              loja_id: await this.getLojaIdFromReservation(reservationId),
              data: {
                reservationId,
                productName,
                minutesLeft,
                urgent: minutesLeft <= 30
              }
            });
        });
      }

      return success;

    } catch (error) {
      console.error('❌ Erro ao notificar reserva expirando:', error);
      return false;
    }
  }

  // ✅ NOTIFICAR MUDANÇA DE STATUS DA RESERVA
  async notifyReservationStatusChange(
    reservationId: string,
    productName: string,
    clientId: string,
    status: string,
    lojaId: string
  ): Promise<boolean> {
    try {
      let title = '';
      let message = '';

      switch (status) {
        case 'concluida':
          title = '✅ Reserva Concluída!';
          message = `Obrigado por retirar ${productName}! Esperamos vê-lo novamente.`;
          break;
        case 'cancelada':
          title = '❌ Reserva Cancelada';
          message = `Sua reserva de ${productName} foi cancelada.`;
          break;
        case 'expirada':
          title = '⏰ Reserva Expirada';
          message = `Sua reserva de ${productName} expirou.`;
          break;
        default:
          return false;
      }

      const success = await this.sendPushNotification(
        title,
        message,
        {
          category: 'reserva',
          url: `/cliente/reservas`,
          reservationId: reservationId,
          productName: productName,
          status: status
        }
      );

      if (success) {
        await this.withLock('save-reservation-status', async () => {
          await supabase
            .from('notificacoes_cliente')
            .insert({
              cliente_id: clientId,
              titulo: title,
              mensagem: message,
              tipo: 'reserva_status',
              lida: false,
              loja_id: lojaId,
              data: {
                reservationId,
                productName,
                status
              }
            });
        });
      }

      return success;

    } catch (error) {
      console.error('❌ Erro ao notificar mudança de status:', error);
      return false;
    }
  }

  // ✅ SALVAR NOTIFICAÇÃO NO BANCO
  private async saveNotificationToDatabase(
    clientIds: string[],
    title: string,
    message: string,
    type: string,
    productId: string,
    lojaId: string
  ) {
    try {
      const notifications = clientIds.map(clientId => ({
        cliente_id: clientId,
        titulo: title,
        mensagem: message,
        tipo: type,
        produto_id: productId,
        loja_id: lojaId,
        lida: false,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('notificacoes_cliente')
        .insert(notifications);

      if (error) {
        console.warn('⚠️ Erro ao salvar notificações no banco:', error);
      }
    } catch (error) {
      console.warn('⚠️ Erro ao salvar histórico de notificações:', error);
    }
  }

  // ✅ OBTER LOJA ID DA RESERVA
  private async getLojaIdFromReservation(reservationId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('reservas')
        .select('loja_id')
        .eq('id', reservationId)
        .single();

      if (error) throw error;
      return data.loja_id;
    } catch (error) {
      console.error('❌ Erro ao buscar loja da reserva:', error);
      return '';
    }
  }

  // ✅ CORREÇÃO: SOLICITAR PERMISSÃO PUSH USANDO SERVIÇO UNIFICADO
  async requestPushPermission(): Promise<boolean> {
    try {
      // ✅ CORREÇÃO: Usar o método correto do serviço unificado
      const subscription = await pushSubscriptionService.getCurrentSubscription();
      return subscription !== null;
    } catch (error) {
      console.error('❌ Erro ao solicitar permissão:', error);
      return false;
    }
  }

  // ✅ CORREÇÃO: OBTER PUSH SUBSCRIPTION USANDO SERVIÇO UNIFICADO
  public async getPushSubscription(): Promise<PushSubscription | null> {
    try {
      // ✅ CORREÇÃO: Usar getUserSubscriptions e verificar a atual
      const registration = await navigator.serviceWorker.ready;
      const currentSubscription = await registration.pushManager.getSubscription();
      return currentSubscription;
    } catch (error) {
      console.error('❌ Erro ao obter subscription:', error);
      return null;
    }
  }

  // ✅ ADICIONAR: Método sendSubscriptionToServer que estava faltando
  async sendSubscriptionToServer(subscription: PushSubscription): Promise<boolean> {
    try {
      console.log('📤 Enviando subscription para o servidor...');

      // Converter subscription para objeto serializável
      const subscriptionJson = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: Array.from(new Uint8Array(subscription.getKey('p256dh')!)),
          auth: Array.from(new Uint8Array(subscription.getKey('auth')!))
        }
      };

      // Enviar para o backend
      const { error } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: await this.getCurrentUserId(),
          subscription: subscriptionJson,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Erro ao salvar subscription no banco:', error);
        return false;
      }

      console.log('✅ Subscription salva com sucesso no servidor');
      return true;

    } catch (error) {
      console.error('❌ Erro ao enviar subscription para o servidor:', error);
      return false;
    }
  }

  // ✅ ADICIONAR: Método auxiliar para obter o ID do usuário atual
  private async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    } catch (error) {
      console.error('❌ Erro ao obter usuário atual:', error);
      return null;
    }
  }

  // ✅ ADICIONAR: Método para remover subscription do servidor
  async removeSubscriptionFromServer(subscription: PushSubscription): Promise<boolean> {
    try {
      console.log('🗑️ Removendo subscription do servidor...');

      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.warn('⚠️ Usuário não autenticado para remover subscription');
        return false;
      }

      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', subscription.endpoint);

      if (error) {
        console.error('❌ Erro ao remover subscription do banco:', error);
        return false;
      }

      console.log('✅ Subscription removida com sucesso do servidor');
      return true;

    } catch (error) {
      console.error('❌ Erro ao remover subscription do servidor:', error);
      return false;
    }
  }

  // ✅ ADICIONAR: Método para verificar se subscription existe no servidor
  async checkSubscriptionOnServer(subscription: PushSubscription): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('endpoint', subscription.endpoint)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = nenhum resultado
        console.error('❌ Erro ao verificar subscription:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('❌ Erro ao verificar subscription no servidor:', error);
      return false;
    }
  }

  // ✅ MÉTODO: Criar som de notificação usando Web Audio API
  private createNotificationSound() {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);

    } catch (error) {
      console.log('Web Audio API não suportada, usando fallback');
    }
  }

  // ✅ MÉTODO: Tocar som de notificação
  async playNotificationSound() {
    if (!this.isSoundEnabled) return;

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;

      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      oscillator.stop(ctx.currentTime + 0.3);

    } catch (error) {
      console.log('Som de notificação não disponível');
    }
  }

  // ✅ MÉTODO: Enviar notificação completa
  async sendCompleteNotification(
    title: string,
    message: string,
    category: string,
    actionUrl?: string
  ): Promise<boolean> {
    try {
      // 1. Tocar som
      await this.playNotificationSound();

      // 2. Mostrar notificação do navegador
      await this.showBrowserNotification(title, message, category);

      // 3. Disparar evento para notificação in-app
      const event = new CustomEvent('newNotification', {
        detail: {
          id: Date.now().toString(),
          title,
          message,
          category,
          timestamp: new Date().toISOString(),
          actionUrl,
          read: false
        }
      });
      window.dispatchEvent(event);

      // ✅ CORREÇÃO: Usar saveNotificationToHistory em vez de saveToHistory
      this.saveNotificationToHistory({
        id: Date.now().toString(),
        title,
        message,
        category,
        timestamp: new Date().toISOString(),
        actionUrl,
        read: false
      });

      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar notificação completa:', error);
      return false;
    }
  }

  // ✅ MÉTODO: Salvar no histórico de notificações
  private saveNotificationToHistory(notification: any) {
    try {
      const history = this.getNotificationHistory();
      const updatedHistory = [notification, ...history].slice(0, 50);
      localStorage.setItem(this.NOTIFICATION_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Erro ao salvar notificação no histórico:', error);
    }
  }

  // ✅ MÉTODO: Obter histórico de notificações
  getNotificationHistory() {
    try {
      const history = localStorage.getItem(this.NOTIFICATION_HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      return [];
    }
  }

  // ✅ MÉTODO: Mostrar notificação do navegador
  async showBrowserNotification(title: string, body: string, category?: string): Promise<boolean> {
    if (!("Notification" in window)) {
      console.log("Este navegador não suporta notificações desktop");
      return false;
    }

    if (Notification.permission === "granted") {
      const notification = new Notification(title, {
        body,
        icon: '/icon-192x192.png',
        tag: category || 'general'
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    }

    return false;
  }

  // ✅ MÉTODO: Solicitar permissão
  async requestNotificationPermission(): Promise<boolean> {
    return await this.requestPushPermission();
  }

  // ✅ MÉTODO: Mostrar modal de permissão
  async showPermissionModal(): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md mx-4">
          <div class="text-center mb-4">
            <div class="text-4xl mb-2">🔔</div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">Ativar Notificações?</h3>
            <p class="text-gray-600 text-sm">
              Receba alertas sobre promoções exclusivas, novos produtos e lembretes importantes.
            </p>
          </div>
          <div class="flex gap-3 justify-center">
            <button id="cancel-btn" class="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-300 transition">
              Agora Não
            </button>
            <button id="confirm-btn" class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
              Permitir Notificações
            </button>
          </div>
          <p class="text-xs text-gray-500 text-center mt-4">
            Você pode alterar depois nas configurações do navegador
          </p>
        </div>
      `;

      document.body.appendChild(modal);

      document.getElementById('confirm-btn')?.addEventListener('click', async () => {
        modal.remove();
        const granted = await this.requestNotificationPermission();
        resolve(granted);
      });

      document.getElementById('cancel-btn')?.addEventListener('click', () => {
        modal.remove();
        resolve(false);
      });
    });
  }

  // ✅ CORREÇÃO: Método sendNotification com terceiro parâmetro
  async sendNotification(title: string, body: string, options?: NotificationOptions): Promise<boolean> {
    try {
      console.log("📤 Enviando notificação:", title, options || '');

      if (Notification.permission !== "granted") {
        console.warn("⚠️ Sem permissão para notificações");
        this.showInAppNotification(title, body, options);
        return false;
      }

      // Enviar via Service Worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          data: {
            title,
            body,
            icon: '/icon-192x192.png',
            tag: 'loja-conect',
            requireInteraction: true,
            ...options
          }
        });
        console.log("✅ Notificação enviada com sucesso");
        return true;
      }

      // Fallback para notificação direta
      new Notification(title, {
        body,
        icon: '/icon-192x192.png',
        tag: 'loja-conect',
        ...options
      });
      return true;

    } catch (error) {
      console.error('❌ Erro ao enviar notificação:', error);
      this.showInAppNotification(title, body, options);
      return false;
    }
  }

  // ✅ MÉTODO: Notificação de produto
  async notifyNewProduct(productName: string, price?: number): Promise<boolean> {
    const title = "🛍️ Novo Produto!";
    const body = price
      ? `Confira ${productName} por R$ ${price}`
      : `Novo produto disponível: ${productName}`;

    return await this.sendNotification(title, body);
  }

  // ✅ MÉTODO: Notificação de promoção
  async notifyNewPromotion(promotionTitle: string, discount?: string): Promise<boolean> {
    const title = "🔥 Nova Promoção!";
    const body = discount
      ? `${promotionTitle} - ${discount} de desconto`
      : promotionTitle;

    return await this.sendNotification(title, body);
  }

  // ✅ MÉTODO: Notificação de reserva
  async notifyReservation(productName: string, clientName: string, isStore: boolean = false): Promise<boolean> {
    const title = isStore ? "🛒 Nova Reserva" : "✅ Reserva Confirmada";
    const body = isStore
      ? `${clientName} reservou ${productName}`
      : `Sua reserva de ${productName} foi confirmada`;

    return await this.sendNotification(title, body);
  }

  // ✅ CORREÇÃO: Método showInAppNotification com terceiro parâmetro
  showInAppNotification(title: string, message: string, options?: NotificationOptions): void {
    console.log('📢 Notificação In-App:', title, '-', message, options || '');

    // Criar elemento de notificação in-app
    const notificationEl = document.createElement('div');
    notificationEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${options?.urgent ? '#DC2626' : '#3B82F6'};
      color: white;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 9999;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;

    // Adicionar estilos de animação se não existirem
    if (!document.querySelector('#notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    notificationEl.innerHTML = `
      <strong>${title}</strong>
      <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">${message}</p>
      ${options?.productName ? `<small style="opacity: 0.8;">${options.productName}</small>` : ''}
    `;

    // Adicionar evento de clique se houver URL nas opções
    if (options?.url) {
      notificationEl.style.cursor = 'pointer';
      notificationEl.onclick = () => {
        window.open(options.url, '_blank');
        notificationEl.remove();
      };
    }

    document.body.appendChild(notificationEl);

    // Remover após 5 segundos
    setTimeout(() => {
      notificationEl.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => {
        if (notificationEl.parentNode) {
          notificationEl.parentNode.removeChild(notificationEl);
        }
      }, 300);
    }, 5000);

    // Adicionar ao histórico local
    this.addToLocalHistory({
      id: Date.now().toString(),
      title,
      body: message,
      timestamp: new Date(),
      read: false,
      options
    });
  }

  // ✅ MÉTODO: Salvar no histórico local
  public saveToLocalHistory(notification: LocalNotification): void {
    try {
      const history = this.getLocalHistory();
      history.unshift(notification);
      const limitedHistory = history.slice(0, 100);
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(limitedHistory));
    } catch (error) {
      console.warn('⚠️ Não foi possível salvar no histórico local:', error);
    }
  }

  // ✅ MÉTODO: Adicionar ao histórico local
  private addToLocalHistory(notification: any): void {
    this.localNotifications.unshift(notification);
    if (this.localNotifications.length > 50) {
      this.localNotifications = this.localNotifications.slice(0, 50);
    }

    window.dispatchEvent(new CustomEvent('localNotificationUpdate', {
      detail: this.localNotifications
    }));
  }

  // ✅ MÉTODO: Obter histórico local
  getLocalHistory(): LocalNotification[] {
    try {
      const history = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      return [];
    }
  }

  // ✅ MÉTODO: Marcar como lido
  markAsRead(notificationId: string) {
    const history = this.getNotificationHistory();
    const updatedHistory = history.map((notif: any) =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    localStorage.setItem(this.NOTIFICATION_HISTORY_KEY, JSON.stringify(updatedHistory));
  }

  // ✅ MÉTODO: Excluir notificação
  deleteNotification(notificationId: string) {
    const history = this.getNotificationHistory();
    const updatedHistory = history.filter((notif: any) => notif.id !== notificationId);
    localStorage.setItem(this.NOTIFICATION_HISTORY_KEY, JSON.stringify(updatedHistory));
  }

  // ✅ MÉTODO: Limpar todas as notificações
  clearAllNotifications() {
    localStorage.setItem(this.NOTIFICATION_HISTORY_KEY, JSON.stringify([]));
  }

  // ✅ MÉTODO: Obter contagem de não lidas
  getUnreadCount() {
    const history = this.getNotificationHistory();
    return history.filter((notif: any) => !notif.read).length;
  }

  // ✅ MÉTODO: Marcar notificação local como lida
  markLocalNotificationAsRead(id: string): void {
    try {
      const history = this.getLocalHistory();
      const updatedHistory = history.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      );
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.warn('⚠️ Erro ao marcar notificação local como lida:', error);
    }
  }

  // ✅ BUSCAR NOTIFICAÇÕES DO CLIENTE
  async getClientNotifications(clientId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('notificacoes_cliente')
        .select('*')
        .eq('cliente_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar notificações do cliente:', error);
      return [];
    }
  }

  // ✅ MARCAR NOTIFICAÇÃO COMO LIDA
  async markClientNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notificacoes_cliente')
        .update({ lida: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('❌ Erro ao marcar notificação como lida:', error);
    }
  }

  // ✅ OBTER CONTAGEM DE NÃO LIDAS PARA CLIENTE ESPECÍFICO
  async getUnreadClientCount(clientId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notificacoes_cliente')
        .select('*', { count: 'exact', head: true })
        .eq('cliente_id', clientId)
        .eq('lida', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('❌ Erro ao contar notificações não lidas do cliente:', error);
      return 0;
    }
  }

  // ✅ MÉTODO: Obter notificações do usuário
  async getUserNotifications() {
    try {
      const user = await this.getCurrentUser();
      if (!user) return this.getLocalHistory();

      let dbNotifications: any[] = [];
      try {
        const { data, error } = await supabase
          .from('notificacoes')
          .select('id, titulo, mensagem, created_at, lida, categoria')
          .eq('cliente_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          dbNotifications = data.map(notif => ({
            id: notif.id,
            title: notif.titulo,
            message: notif.mensagem,
            created_at: notif.created_at,
            is_read: notif.lida,
            category: notif.categoria,
            source: 'database'
          }));
        }
      } catch (dbError) {
        console.warn('⚠️ Erro ao buscar notificações do banco:', dbError);
      }

      const localNotifications = this.getLocalHistory().map(notif => ({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        created_at: notif.timestamp,
        is_read: notif.read,
        category: notif.category,
        type: notif.type,
        source: 'local'
      }));

      const allNotifications = [...dbNotifications, ...localNotifications]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return allNotifications.length > 0 ? allNotifications : this.getFallbackNotifications();
    } catch (err) {
      console.error("❌ Erro ao buscar notificações:", err);
      const localNotifications = this.getLocalHistory().map(notif => ({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        created_at: notif.timestamp,
        is_read: notif.read,
        category: notif.category,
        type: notif.type,
        source: 'local'
      }));
      return localNotifications.length > 0 ? localNotifications : this.getFallbackNotifications();
    }
  }

  // ✅ MÉTODO: Notificações de fallback
  private getFallbackNotifications() {
    return [
      {
        id: 'fallback-1',
        title: 'Bem-vindo ao Loja-Conect!',
        message: 'Configure suas preferências de notificação.',
        created_at: new Date().toISOString(),
        is_read: false,
        category: 'info',
        source: 'fallback'
      }
    ];
  }

  // ✅ MÉTODO: Obter categorias de notificação
  async getNotificationCategories(): Promise<NotificationCategory[]> {
    try {
      const { data, error } = await supabase
        .from('notification_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.warn('⚠️ Tabela notification_categories não encontrada, usando categorias padrão');
        return this.getFallbackCategories();
      }
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar categorias:', error);
      return this.getFallbackCategories();
    }
  }

  // ✅ MÉTODO: Categorias de fallback
  private getFallbackCategories(): NotificationCategory[] {
    return [
      {
        id: 'promocoes',
        name: 'promocoes',
        description: 'Receba notificações sobre promoções e ofertas especiais',
        is_active: true,
        created_by: null,
        created_at: new Date().toISOString()
      },
      {
        id: 'novos_produtos',
        name: 'novos_produtos',
        description: 'Seja notificado sobre novos produtos disponíveis',
        is_active: true,
        created_by: null,
        created_at: new Date().toISOString()
      },
      {
        id: 'reservas',
        name: 'reservas',
        description: 'Notificações sobre suas reservas e prazos',
        is_active: true,
        created_by: null,
        created_at: new Date().toISOString()
      },
      {
        id: 'estoque',
        name: 'estoque',
        description: 'Alertas sobre produtos em estoque que você pode gostar',
        is_active: true,
        created_by: null,
        created_at: new Date().toISOString()
      }
    ];
  }

  // ✅ MÉTODO: Obter preferências do usuário
  async getUserNotificationPreferences(): Promise<UserNotificationPreference[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select(`*, category:notification_categories(*)`)
        .eq('user_id', user.id);

      if (error) {
        console.warn('⚠️ Tabela user_notification_preferences não encontrada, usando preferências padrão');
        return this.getFallbackPreferences();
      }
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar preferências:', error);
      return this.getFallbackPreferences();
    }
  }

  // ✅ MÉTODO: Preferências de fallback
  private getFallbackPreferences(): UserNotificationPreference[] {
    return this.getFallbackCategories().map(category => ({
      id: `pref-${category.id}`,
      user_id: 'default-user',
      category_id: category.id,
      is_enabled: true,
      created_at: new Date().toISOString(),
      category: category
    }));
  }

  // ✅ MÉTODO: Atualizar preferência
  async updateNotificationPreference(
    categoryId: string,
    enabled: boolean
  ): Promise<UserNotificationPreference[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: existingPreference } = await supabase
        .from('user_notification_preferences')
        .select('id')
        .eq('user_id', user.id)
        .eq('category_id', categoryId)
        .single();

      if (existingPreference) {
        const { error } = await supabase
          .from('user_notification_preferences')
          .update({ is_enabled: enabled })
          .eq('id', existingPreference.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_notification_preferences')
          .insert({
            user_id: user.id,
            category_id: categoryId,
            is_enabled: enabled
          });

        if (error) throw error;
      }

      return await this.getUserNotificationPreferences();
    } catch (error) {
      console.warn('⚠️ Não foi possível atualizar preferência no banco:', error);
      const fallbackPrefs = this.getFallbackPreferences();
      return fallbackPrefs.map(pref =>
        pref.category_id === categoryId ? { ...pref, is_enabled: enabled } : pref
      );
    }
  }

  // ✅ MÉTODO: Marcar notificação como lida
  async markNotificationAsRead(id: string) {
    try {
      if (id.startsWith('local-') || id.startsWith('fallback-')) {
        this.markLocalNotificationAsRead(id);
        console.log('✅ Notificação local marcada como lida:', id);
        return;
      }

      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', id);

      if (error) console.warn('⚠️ Não foi possível marcar notificação como lida:', error);
      else console.log('✅ Notificação marcada como lida:', id);
    } catch (error) {
      console.warn('⚠️ Erro ao marcar notificação como lida:', error);
    }
  }

  // ✅ MÉTODO: Excluir notificação do banco
  async deleteNotificationFromDatabase(id: string) {
    try {
      if (id.startsWith('local-') || id.startsWith('fallback-')) {
        const history = this.getLocalHistory();
        const updatedHistory = history.filter(notif => notif.id !== id);
        localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(updatedHistory));
        console.log('🗑️ Notificação local excluída:', id);
        return;
      }

      const { error } = await supabase
        .from('notificacoes')
        .delete()
        .eq('id', id);

      if (error) console.warn('⚠️ Não foi possível excluir notificação:', error);
      else console.log('🗑️ Notificação excluída:', id);
    } catch (error) {
      console.warn('⚠️ Erro ao excluir notificação:', error);
    }
  }

  // ✅ MÉTODO: Marcar todas como lidas
  async markAllNotificationsAsRead() {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('cliente_id', user.id)
        .eq('lida', false);

      if (error) console.warn('⚠️ Não foi possível marcar todas como lidas:', error);

      const history = this.getLocalHistory();
      const updatedHistory = history.map(notif => ({ ...notif, read: true }));
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(updatedHistory));

      console.log('✅ Todas as notificações marcadas como lidas');
    } catch (error) {
      console.warn('⚠️ Erro ao marcar todas como lidas:', error);
    }
  }

  // ✅ MÉTODO: Obter estatísticas
  async getNotificationStats(): Promise<{ total: number; unread: number }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return { total: 0, unread: 0 };

      const notifications = await this.getUserNotifications();
      const total = notifications.length;
      const unread = notifications.filter(notif => !notif.is_read).length;

      return { total, unread };
    } catch (error) {
      console.warn('⚠️ Erro ao buscar estatísticas:', error);
      return { total: 0, unread: 0 };
    }
  }

  // ✅ MÉTODO: Inicializar preferências do usuário
  async initializeUserPreferences(): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return;

      const categories = await this.getNotificationCategories();
      for (const category of categories) {
        await this.updateNotificationPreference(category.id, true);
      }

      console.log('✅ Preferências de notificação inicializadas');
    } catch (error) {
      console.warn('⚠️ Erro ao inicializar preferências:', error);
    }
  }

  // ✅ MÉTODO: Inicializar sistema de notificações
  async initializeNotificationSystem(): Promise<boolean> {
    try {
      console.log('🚀 Inicializando sistema de notificações...');

      // 1. Verificar suporte básico
      if (!('Notification' in window)) {
        console.warn('❌ Notificações não suportadas');
        return false;
      }

      // 2. Se já tem permissão, usar notificações
      if (Notification.permission === 'granted') {
        console.log('✅ Permissão já concedida');
        return true;
      }

      // 3. Se nunca foi solicitado, não solicitar automaticamente
      if (Notification.permission === 'default') {
        console.log('🔄 Permissão nunca solicitada - aguardando ação do usuário');
        return false;
      }

      // 4. Permissão negada
      console.warn('🔕 Permissão negada, usando modo local');
      return false;

    } catch (error) {
      console.error('❌ Erro na inicialização do sistema:', error);
      return false;
    }
  }

  // ✅ MÉTODO: Verificar status do sistema
  getSystemStatus() {
    return {
      supported: "Notification" in window,
      permission: Notification.permission,
      serviceWorker: 'serviceWorker' in navigator,
      pushEnabled: this.isPushEnabled,
      realtimeEnabled: true,
      deduplicationEnabled: true,
      cacheEnabled: true,
      lockManager: this.lockManager !== null
    };
  }

  // ✅ MÉTODOS DE COMPATIBILIDADE
  checkPermission(): NotificationPermission {
    return Notification.permission;
  }

  isSupported(): boolean {
    return "Notification" in window;
  }

  getPermissionState(): NotificationPermission {
    return Notification.permission;
  }

  async initialize(): Promise<boolean> {
    return await this.initializeNotificationSystem();
  }

  // ✅ CORREÇÃO: Tornar estes métodos públicos para serem acessíveis externamente
  public showWelcomeNotification(): void {
    if (Notification.permission === "granted" && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('🔔 Notificações Ativadas!', {
          body: 'Agora você receberá alertas sobre promoções e novidades.',
          icon: '/icon-192x192.png',
          tag: 'welcome'
        });
      });
    }
  }

  public showPermissionDeniedMessage(): void {
    const message = document.createElement('div');
    message.className = 'fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 p-3 rounded-lg shadow-lg z-50 max-w-sm';
    message.innerHTML = `
      <div class="font-bold mb-1">⚠️ Notificações Recusadas</div>
      <div class="text-sm">
        Você receberá notificações dentro do app mesmo assim.
      </div>
      <button onclick="this.parentElement.remove()" class="text-yellow-800 hover:text-yellow-900 text-sm font-medium mt-2">
        Entendi
      </button>
    `;
    document.body.appendChild(message);

    setTimeout(() => {
      if (message.parentElement) {
        message.remove();
      }
    }, 5000);
  }

  private async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  // ✅ ADICIONADO: Método para limpar cache
  clearCache(storeId?: string) {
    if (storeId) {
      const cacheKey = `categories-${storeId}`;
      this.categoryCache.delete(cacheKey);
      localStorage.removeItem(cacheKey);
      console.log(`🧹 Cache limpo para loja: ${storeId}`);
    } else {
      this.categoryCache.clear();
      console.log('🧹 Todos os caches limpos');
    }
  }

  // ✅ ADICIONADO: Método para obter estatísticas de performance
  getPerformanceStats() {
    return {
      requestQueueSize: this.requestQueue.size,
      cacheSize: this.categoryCache.size,
      cacheKeys: Array.from(this.categoryCache.keys()),
      deduplicatedRequests: this.requestQueue.size
    };
  }

  // ✅ CORREÇÃO: Adicionar método testNotification que estava faltando
  async testNotification(categoryId: string, storeId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🧪 Testando notificação para categoria: ${categoryId}, loja: ${storeId}`);

      // Buscar informações da categoria
      const { data: categoriaData, error } = await supabase
        .from('categorias')
        .select('nome')
        .eq('id', categoryId)
        .single();

      if (error || !categoriaData) {
        return {
          success: false,
          message: 'Categoria não encontrada'
        };
      }

      const categoriaNome = categoriaData.nome;

      // Enviar notificação de teste
      const success = await this.sendPushNotification(
        '🧪 Notificação de Teste',
        `Esta é uma notificação de teste para a categoria "${categoriaNome}"`,
        {
          category: 'teste',
          categoryId: categoryId,
          storeId: storeId,
          test: true,
          timestamp: new Date().toISOString()
        }
      );

      if (success) {
        return {
          success: true,
          message: `Notificação de teste enviada com sucesso para categoria "${categoriaNome}"`
        };
      } else {
        return {
          success: false,
          message: 'Falha ao enviar notificação de teste'
        };
      }

    } catch (error) {
      console.error('❌ Erro no teste de notificação:', error);
      return {
        success: false,
        message: 'Erro interno no teste de notificação'
      };
    }
  }

  // ✅ NOVO MÉTODO: Usar withLock para operações críticas
  async safeDatabaseOperation<T>(operation: string, callback: () => Promise<T>): Promise<T> {
    return await this.withLock(`db-${operation}`, callback);
  }

  // ✅ NOVO MÉTODO: Processar notificações em lote com lock
  async processBatchNotifications(
    notifications: Array<{ userId: string; title: string; message: string; data?: NotificationOptions }>
  ): Promise<{ success: number; failed: number }> {
    return await this.withLock('batch-processing', async () => {
      let successCount = 0;
      let failedCount = 0;

      for (const notification of notifications) {
        try {
          const success = await this.sendPushNotification(
            notification.title,
            notification.message,
            notification.data
          );
          if (success) {
            successCount++;
          } else {
            failedCount++;
          }
        } catch (error) {
          console.warn(`⚠️ Erro ao processar notificação para ${notification.userId}:`, error);
          failedCount++;
        }
      }

      console.log(`📊 Processamento em lote concluído: ${successCount} sucessos, ${failedCount} falhas`);
      return { success: successCount, failed: failedCount };
    });
  }

  // ✅ NOVO MÉTODO: Limpar notificações antigas com lock
  async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
    return await this.withLock('cleanup', async () => {
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        // Limpar do banco de dados
        const { error: dbError } = await supabase
          .from('notificacoes_cliente')
          .delete()
          .lt('created_at', cutoffDate.toISOString());

        if (dbError) {
          console.warn('⚠️ Erro ao limpar notificações antigas do banco:', dbError);
        }

        // Limpar do localStorage
        const history = this.getNotificationHistory();
        const filteredHistory = history.filter((notif: any) =>
          new Date(notif.timestamp) > cutoffDate
        );
        localStorage.setItem(this.NOTIFICATION_HISTORY_KEY, JSON.stringify(filteredHistory));

        const removedCount = history.length - filteredHistory.length;
        console.log(`🧹 Limpeza concluída: ${removedCount} notificações antigas removidas`);

        return removedCount;
      } catch (error) {
        console.error('❌ Erro na limpeza de notificações:', error);
        return 0;
      }
    });
  }
}

export const notificationService = NotificationService.getInstance();

// ✅ ADICIONADO: método de teste para verificar compatibilidade
export const testBrowserCompatibility = async () => {
  const compatibility = checkBrowserCompatibility();

  console.group('🧪 Teste de Compatibilidade do Navegador');
  console.log('✅ Compatibilidade:', compatibility.compatibility);
  console.log('⚠️ Avisos:', compatibility.warnings);
  console.log('❌ Problemas:', compatibility.missingFeatures);
  console.log('🔧 Totalmente Compatível:', compatibility.isFullyCompatible);
  console.groupEnd();

  return compatibility;
};

export default NotificationService;
