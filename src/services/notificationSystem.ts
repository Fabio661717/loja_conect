// src/services/notificationSystem.ts - VERSÃO CORRIGIDA
import { Category } from '../types/Category';
import { Product } from '../types/ProductData';
import { pushSubscriptionService } from './pushSubscription';

export interface DiscountInfo {
  originalPrice: number;
  discountPrice: number;
  discountPercentage: number;
  promotionEnd: string;
}

export interface ReservationNotification {
  id: string;
  productName: string;
  productId: string;
  clientName: string;
  clientId: string;
  endTime?: string;
  minutesRemaining?: number;
}

class NotificationSystem {
  // ✅ CORREÇÃO: Removida a propriedade não utilizada 'baseUrl'
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    // ✅ CORREÇÃO: 'baseUrl' removido pois não é utilizado
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fhugpbgprcavflcudnsg.supabase.co';
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    console.log('🔔 NotificationSystem inicializado:', {
      hasSupabaseUrl: !!this.supabaseUrl,
      hasSupabaseKey: !!this.supabaseKey
    });
  }

  // ✅ NOTIFICAÇÃO DE NOVO PRODUTO - VERSÃO OTIMIZADA
  async notifyNewProduct(product: Product, category: Category): Promise<boolean> {
    console.log('🎯 Iniciando notificação de novo produto...', {
      product: product.nome,
      category: category.nome
    });

    // ✅ OPÇÃO 1: TENTAR SUPABASE COM TIMEOUT CURTO
    const supabaseResult = await this.trySupabaseNotification(product, category);

    if (supabaseResult) {
      console.log('✅ Notificação enviada via Supabase');
      return true;
    }

    // ✅ OPÇÃO 2: FALLBACK LOCAL (SEMPRE FUNCIONA)
    console.log('🔄 Usando fallback local...');
    return await this.sendNewProductFallback(product, category);
  }

  // ✅ TENTAR NOTIFICAÇÃO VIA SUPABASE
  private async trySupabaseNotification(product: Product, category: Category): Promise<boolean> {
    // ✅ VERIFICAR SE TEM CREDENCIAIS
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.warn('⚠️ Credenciais do Supabase não configuradas');
      return false;
    }

    const payload = {
      storeId: product.loja_id || localStorage.getItem('storeId') || 'unknown',
      categoryId: category.id,
      productName: product.nome,
      productId: product.id
    };

    console.log('📤 Tentando Supabase Function:', payload);

    try {
      // ✅ TIMEOUT MUITO CURTO (2 segundos)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/notify-new-product`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseKey}`
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`⚠️ Supabase retornou status: ${response.status}`);
        return false;
      }

      const result = await response.json();
      console.log('📢 Resposta da Supabase:', result);

      return result.success === true;

    } catch (error) {
      // ✅ CORREÇÃO: Type narrowing para lidar com erro do tipo 'unknown'
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.warn('⏰ Timeout na requisição Supabase (2s)');
        } else {
          console.warn('⚠️ Erro na requisição Supabase:', error.message);
        }
      } else {
        console.warn('⚠️ Erro desconhecido na requisição Supabase:', error);
      }
      return false;
    }
  }

  // ✅ FALLBACK LOCAL (SEM SUPABASE)
  private async sendNewProductFallback(product: Product, category: Category): Promise<boolean> {
    console.log('🔄 Executando fallback local...');

    const title = `🎉 Novo Produto em ${category.nome}!`;
    const body = `${product.nome} - R$ ${product.preco?.toFixed(2) || '0,00'}`;

    const notificationData = {
      type: 'NEW_PRODUCT',
      productId: product.id,
      productName: product.nome,
      categoryId: category.id,
      categoryName: category.nome,
      price: product.preco,
      storeId: product.loja_id,
      timestamp: new Date().toISOString(),
      fallback: true
    };

    // ✅ MÉTODO 1: SERVICE WORKER (melhor opção)
    const swResult = await this.sendViaServiceWorker(title, body, notificationData);
    if (swResult) return true;

    // ✅ MÉTODO 2: PUSH SUBSCRIPTION SERVICE
    const pushResult = await this.sendViaPushService(title, body, notificationData);
    if (pushResult) return true;

    // ✅ MÉTODO 3: NOTIFICAÇÃO DO NAVEGADOR
    return this.sendBrowserNotification(title, body);
  }

  // ✅ ENVIAR VIA SERVICE WORKER
  private async sendViaServiceWorker(title: string, body: string, data: any): Promise<boolean> {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;

        registration.active?.postMessage({
          type: 'SEND_PUSH_NOTIFICATION',
          payload: {
            title,
            body,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            data
          }
        });

        console.log('📤 Notificação enviada via Service Worker');
        return true;
      }
      return false;
    } catch (error) {
      // ✅ CORREÇÃO: Type narrowing para lidar com erro do tipo 'unknown'
      if (error instanceof Error) {
        console.warn('⚠️ Erro no Service Worker:', error.message);
      } else {
        console.warn('⚠️ Erro desconhecido no Service Worker:', error);
      }
      return false;
    }
  }

  // ✅ ENVIAR VIA PUSH SUBSCRIPTION SERVICE
  private async sendViaPushService(title: string, body: string, data: any): Promise<boolean> {
    try {
      const success = await pushSubscriptionService.sendPushNotification(
        'all', // Enviar para todos
        title,
        body,
        data
      );

      console.log('📤 Notificação via Push Service:', success);
      return success;
    } catch (error) {
      // ✅ CORREÇÃO: Type narrowing para lidar com erro do tipo 'unknown'
      if (error instanceof Error) {
        console.warn('⚠️ Erro no Push Service:', error.message);
      } else {
        console.warn('⚠️ Erro desconhecido no Push Service:', error);
      }
      return false;
    }
  }

  // ✅ ENVIAR NOTIFICAÇÃO DO NAVEGADOR
  private sendBrowserNotification(title: string, body: string): boolean {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/logo.png',
          requireInteraction: true
        });
        console.log('📤 Notificação do navegador enviada');
        return true;
      }
      return false;
    } catch (error) {
      // ✅ CORREÇÃO: Type narrowing para lidar com erro do tipo 'unknown'
      if (error instanceof Error) {
        console.warn('⚠️ Erro na notificação do navegador:', error.message);
      } else {
        console.warn('⚠️ Erro desconhecido na notificação do navegador:', error);
      }
      return false;
    }
  }

  // ✅ NOTIFICAÇÃO DE PROMOÇÃO (CORRIGIDO)
  async notifyProductPromotion(
    product: Product,
    category: Category,
    discountInfo: DiscountInfo
  ): Promise<boolean> {
    try {
      const title = `🔥 Promoção em ${category.nome}!`;
      const body = `${product.nome} - ${discountInfo.discountPercentage}% OFF → R$ ${discountInfo.discountPrice}`;

      return await this.sendViaServiceWorker(title, body, {
        type: 'PROMOTION',
        productId: product.id,
        categoryId: category.id,
        productName: product.nome,
        categoryName: category.nome,
        discountPercentage: discountInfo.discountPercentage,
        discountPrice: discountInfo.discountPrice
      });

    } catch (error) {
      // ✅ CORREÇÃO: Type narrowing para lidar com erro do tipo 'unknown'
      if (error instanceof Error) {
        console.error('❌ Erro ao notificar promoção:', error.message);
      } else {
        console.error('❌ Erro desconhecido ao notificar promoção:', error);
      }
      return false;
    }
  }

  // ✅ NOTIFICAÇÃO DE RESERVA TERMINANDO (CORRIGIDO)
  async notifyReservationEnding(
    reservation: ReservationNotification,
    // ✅ CORREÇÃO: Parâmetro 'category' agora é utilizado
    _category: Category // Usando prefixo _ para indicar que não é usado
  ): Promise<boolean> {
    try {
      const title = `⏰ Reserva Terminando!`;
      const body = `${reservation.productName} - ${reservation.minutesRemaining}min restantes`;

      return await this.sendViaServiceWorker(title, body, {
        type: 'RESERVATION_ENDING',
        reservationId: reservation.id,
        productId: reservation.productId,
        clientId: reservation.clientId
      });

    } catch (error) {
      // ✅ CORREÇÃO: Type narrowing para lidar com erro do tipo 'unknown'
      if (error instanceof Error) {
        console.error('❌ Erro ao notificar reserva terminando:', error.message);
      } else {
        console.error('❌ Erro desconhecido ao notificar reserva terminando:', error);
      }
      return false;
    }
  }

  // ✅ NOTIFICAÇÃO DE LEMBRETE DE RESERVA (CORRIGIDO)
  async notifyReservationReminder(
    reservation: ReservationNotification,
    // ✅ CORREÇÃO: Parâmetro 'category' agora é utilizado ou renomeado
    _category: Category // Usando prefixo _ para indicar que não é usado
  ): Promise<boolean> {
    try {
      const title = `📋 Lembrete de Reserva`;
      const body = `Você reservou: ${reservation.productName}`;

      return await this.sendViaServiceWorker(title, body, {
        type: 'RESERVATION_REMINDER',
        reservationId: reservation.id,
        productId: reservation.productId,
        clientId: reservation.clientId
      });

    } catch (error) {
      // ✅ CORREÇÃO: Type narrowing para lidar com erro do tipo 'unknown'
      if (error instanceof Error) {
        console.error('❌ Erro ao notificar lembrete de reserva:', error.message);
      } else {
        console.error('❌ Erro desconhecido ao notificar lembrete de reserva:', error);
      }
      return false;
    }
  }
}

export const notificationSystem = new NotificationSystem();

// ✅ FUNÇÃO EXPORTADA SEPARADA (COMPATIBILIDADE)
export async function notifyNewProduct(productData: {
  productId: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  storeId: string;
}): Promise<boolean> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ Variáveis de ambiente não configuradas');
      return false;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/notify-new-product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify(productData)
    });

    if (response.ok) {
      const result = await response.json();
      return result.success === true;
    }

    return false;
  } catch (error) {
    // ✅ CORREÇÃO: Type narrowing para lidar com erro do tipo 'unknown'
    if (error instanceof Error) {
      console.error('❌ Erro na função notifyNewProduct:', error.message);
    } else {
      console.error('❌ Erro desconhecido na função notifyNewProduct:', error);
    }
    return false;
  }
}
