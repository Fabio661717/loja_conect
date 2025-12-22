// src/services/notificationSystem.ts - VERSÃO COMPLETA CORRIGIDA
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
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fhugpbgprcavflcudnsg.supabase.co';
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  }

  // ✅ ADICIONE ESTE MÉTODO QUE ESTAVA FALTANDO
  async sendProductCreatedNotification(
    product: Product,
    storeName: string
  ): Promise<boolean> {
    try {
      console.log('🎉 Enviando notificação de produto criado:', product.nome);

      const title = `🆕 Novo Produto em ${storeName}!`;
      const body = `${product.nome} - R$ ${product.preco?.toFixed(2) || '0,00'}`;

      const notificationData = {
        type: 'NEW_PRODUCT',
        productId: product.id,
        productName: product.nome,
        storeName: storeName,
        price: product.preco,
        timestamp: new Date().toISOString()
      };

      // Tentar enviar via Service Worker
      return await this.sendViaServiceWorker(title, body, notificationData);
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de produto criado:', error);
      return false;
    }
  }

  async notifyNewProduct(product: Product, category: Category): Promise<boolean> {
    console.log('🎯 Iniciando notificação de novo produto...', {
      product: product.nome,
      category: category.nome
    });

    // Tentar Supabase primeiro
    const supabaseResult = await this.trySupabaseNotification(product, category);
    if (supabaseResult) {
      return true;
    }

    // Fallback local
    return await this.sendNewProductFallback(product, category);
  }

  private async trySupabaseNotification(product: Product, category: Category): Promise<boolean> {
    if (!this.supabaseUrl || !this.supabaseKey) {
      return false;
    }

    const payload = {
      storeId: product.loja_id || localStorage.getItem('storeId') || 'unknown',
      categoryId: category.id,
      productName: product.nome,
      productId: product.id
    };

    try {
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
        return false;
      }

      const result = await response.json();
      return result.success === true;

    } catch (error) {
      return false;
    }
  }

  private async sendNewProductFallback(product: Product, category: Category): Promise<boolean> {
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

    // Tentar Service Worker
    const swResult = await this.sendViaServiceWorker(title, body, notificationData);
    if (swResult) return true;

    // Tentar Push Service
    const pushResult = await this.sendViaPushService(title, body, notificationData);
    if (pushResult) return true;

    // Notificação do navegador
    return this.sendBrowserNotification(title, body);
  }

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

        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  private async sendViaPushService(title: string, body: string, data: any): Promise<boolean> {
    try {
      const success = await pushSubscriptionService.sendPushNotification(
        'all',
        title,
        body,
        data
      );
      return success;
    } catch (error) {
      return false;
    }
  }

  private sendBrowserNotification(title: string, body: string): boolean {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/logo.png',
          requireInteraction: true
        });
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

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
      console.error('❌ Erro ao notificar promoção:', error);
      return false;
    }
  }

 async notifyReservationEnding(
    reservation: {
      id: string;
      productName: string;
      productId: string;
      clientName: string;
      clientId: string;
      endTime: string;
      minutesRemaining: number;
      // Dados opcionais para flexibilidade
      product?: any;
      originalData?: any;
      cliente?: any;
    },
    _category: any,
    // Parâmetros adicionais opcionais para futura expansão
    _options?: {
      notificationType?: string;
      priority?: 'low' | 'normal' | 'high';
      additionalData?: Record<string, any>;
    }
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
      console.error('❌ Erro ao notificar reserva terminando:', error);
      return false;
    }
  }

  async notifyReservationReminder(
    reservation: ReservationNotification,
    _category: Category
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
      console.error('❌ Erro ao notificar lembrete de reserva:', error);
      return false;
    }
  }
}

export const notificationSystem = new NotificationSystem();

// Função de compatibilidade
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
    console.error('❌ Erro na função notifyNewProduct:', error);
    return false;
  }
}
