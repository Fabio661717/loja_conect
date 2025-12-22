// src/utils/pushNotifications.ts - VERSÃO CORRIGIDA
import { createClient } from '@supabase/supabase-js';

// Tipagem para import.meta.env do Vite
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // adicione outras variáveis VITE_... aqui se necessário
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// ✅ CORREÇÃO: Importar as variáveis de ambiente do Vite corretamente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Cliente sem tipagem para evitar erros
const supabaseSimple = createClient(supabaseUrl, supabaseAnonKey);

export class SimplePushNotificationService {
  constructor() {}

  // Todos os métodos usando supabaseSimple sem tipagem
  async saveSubscription(
    subscription: PushSubscription,
    userId: string,
    category?: string
  ): Promise<boolean> {
    try {
      const subscriptionJson = subscription.toJSON();

      const data = {
        user_id: userId,
        endpoint: subscriptionJson.endpoint,
        p256dh: subscriptionJson.keys?.p256dh,
        auth: subscriptionJson.keys?.auth,
        category: category || null,
        is_active: true,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabaseSimple
        .from('push_subscriptions')
        .upsert(data, { onConflict: 'endpoint' });

      return !error;
    } catch (error) {
      console.error('Erro:', error);
      return false;
    }
  }

  async updateUserCategory(userId: string, category: string): Promise<boolean> {
    try {
      const { error } = await supabaseSimple
        .from('push_subscriptions')
        .update({
          category,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_active', true);

      return !error;
    } catch (error) {
      console.error('Erro:', error);
      return false;
    }
  }

  async getUserCategory(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabaseSimple
        .from('push_subscriptions')
        .select('category')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) return null;
      return data?.category;
    } catch (error) {
      return null;
    }
  }

  // ✅ ADICIONAR MÉTODOS QUE ESTÃO SENDO USADOS NO usePushNotifications.ts
  async initialize(userId?: string, category?: string): Promise<boolean> {
    try {
      console.log('Inicializando push notifications');

      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications não suportados');
        return false;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Permissão para notificações negada');
        return false;
      }

      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription && userId) {
        await this.saveSubscription(existingSubscription, userId, category);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro na inicialização:', error);
      return false;
    }
  }

  async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseSimple
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error('Erro ao verificar subscription:', error);
      return false;
    }
  }

  async hasActiveSubscriptionForCurrentDevice(): Promise<boolean> {
    try {
      if (!('serviceWorker' in navigator)) return false;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      return subscription !== null;
    } catch (error) {
      console.error('Erro ao verificar subscription do dispositivo:', error);
      return false;
    }
  }

  async getSystemStatus() {
    try {
      return {
        pushManager: 'PushManager' in window,
        serviceWorker: 'serviceWorker' in navigator,
        vapidKey: { present: false, valid: false }
      };
    } catch (error) {
      return {
        pushManager: 'PushManager' in window,
        serviceWorker: 'serviceWorker' in navigator,
        vapidKey: { present: false, valid: false }
      };
    }
  }
}

export const simplePushService = new SimplePushNotificationService();

// ✅ EXPORTAR TAMBÉM COMO pushNotificationService para compatibilidade
export const pushNotificationService = simplePushService;
