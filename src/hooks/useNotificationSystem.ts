// src/hooks/useNotificationSystem.ts - VERSÃO CORRIGIDA
import { useCallback } from 'react';
import { notificationSystem } from '../services/notificationSystem';
import { Category } from '../types/Category';
import { Product } from '../types/ProductData';

export const useNotificationSystem = () => {
  // ✅ NOTIFICAR NOVO PRODUTO
  const notifyNewProduct = useCallback(async (product: Product, category: Category) => {
    return await notificationSystem.notifyNewProduct(product, category);
  }, []);

  // ✅ NOTIFICAR PROMOÇÃO - VERSÃO CORRIGIDA COM GARANTIA DE discountPrice
  const notifyPromotion = useCallback(async (
    product: Product,
    category: Category,
    discountPercentage: number,
    originalPrice: number
  ) => {
    // ✅ CORREÇÃO: Garantir que discountPrice nunca seja undefined
    // Se product.preco for undefined/null, usar originalPrice como fallback
    const discountPrice = product.preco ?? originalPrice;

    // ✅ CORREÇÃO ADICIONAL: Garantir que discountPrice seja um número válido
    const safeDiscountPrice = typeof discountPrice === 'number' && !isNaN(discountPrice)
      ? discountPrice
      : originalPrice;

    // ✅ VERIFICAÇÃO PARA DEBUG
    console.log('🔍 Verificação de preços na notificação de promoção:', {
      productPreco: product.preco,
      originalPrice: originalPrice,
      discountPercentage: discountPercentage,
      discountPriceUsed: safeDiscountPrice,
      typeProductPreco: typeof product.preco,
      isValidNumber: typeof product.preco === 'number' && !isNaN(product.preco)
    });

    const discountInfo = {
      originalPrice: originalPrice,
      // ✅ CORREÇÃO: Agora discountPrice é SEMPRE um número
      discountPrice: safeDiscountPrice,
      discountPercentage: discountPercentage,
      promotionEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    return await notificationSystem.notifyProductPromotion(
      product,
      category,
      discountInfo
    );
  }, []);

  // ✅ NOTIFICAR RESERVA TERMINANDO
  const notifyReservationEnding = useCallback(async (
    reservation: {
      id: string;
      productName: string;
      productId: string;
      clientName: string;
      clientId: string;
      endTime: string;
      minutesRemaining: number;
    },
    category: Category
  ) => {
    return await notificationSystem.notifyReservationEnding(
      reservation,
      category
    );
  }, []);

  // ✅ NOTIFICAR LEMBRETE DE RESERVA
  const notifyReservationReminder = useCallback(async (
    reservation: {
      id: string;
      productName: string;
      productId: string;
      clientName: string;
      clientId: string;
    },
    category: Category
  ) => {
    return await notificationSystem.notifyReservationReminder(
      reservation,
      category
    );
  }, []);

  // ✅ ENVIAR NOTIFICAÇÃO PUSH DIRETAMENTE
  const sendPushNotification = useCallback(async (subscription: any, payload: {
    title: string;
    body: string;
    data?: any;
  }) => {
    try {
      const response = await fetch('https://SEU-PROJETO.supabase.co/functions/v1/send-notification', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          subscription: subscription.subscription || subscription,
          payload: {
            title: payload.title,
            body: payload.body,
            data: payload.data,
            icon: '/icon-192x192.png'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('❌ Erro ao enviar push notification:', error);
      return false;
    }
  }, []);

  // ✅ NOVA FUNÇÃO: Versão alternativa para notificar promoção com validação extra
  const notifyPromotionWithValidation = useCallback(async (
    product: Product,
    category: Category,
    discountPercentage: number,
    originalPrice: number,
    discountPrice?: number
  ) => {
    // ✅ MÚLTIPLAS CAMADAS DE VALIDAÇÃO
    let finalDiscountPrice: number;

    // 1. Tentar usar discountPrice fornecido
    if (typeof discountPrice === 'number' && !isNaN(discountPrice)) {
      finalDiscountPrice = discountPrice;
    }
    // 2. Tentar usar product.preco
    else if (typeof product.preco === 'number' && !isNaN(product.preco)) {
      finalDiscountPrice = product.preco;
    }
    // 3. Calcular com base no desconto percentual
    else if (discountPercentage > 0 && discountPercentage <= 100) {
      finalDiscountPrice = originalPrice * (1 - discountPercentage / 100);
    }
    // 4. Fallback final: usar originalPrice
    else {
      finalDiscountPrice = originalPrice;
    }

    // ✅ GARANTIR QUE O PREÇO SEJA UM NÚMERO VÁLIDO
    if (typeof finalDiscountPrice !== 'number' || isNaN(finalDiscountPrice)) {
      console.warn('⚠️ Preço com desconto inválido, usando preço original');
      finalDiscountPrice = originalPrice;
    }

    // ✅ GARANTIR QUE O PREÇO NÃO SEJA NEGATIVO
    finalDiscountPrice = Math.max(0, finalDiscountPrice);

    const discountInfo = {
      originalPrice: originalPrice,
      discountPrice: finalDiscountPrice,
      discountPercentage: discountPercentage,
      promotionEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    return await notificationSystem.notifyProductPromotion(
      product,
      category,
      discountInfo
    );
  }, []);

  return {
    notifyNewProduct,
    notifyPromotion,
    notifyReservationEnding,
    notifyReservationReminder,
    sendPushNotification,
    // ✅ EXPORTANDO A VERSÃO COM VALIDAÇÃO EXTRA
    notifyPromotionWithValidation
  };
};
