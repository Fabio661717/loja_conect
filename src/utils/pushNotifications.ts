// src/utils/pushNotifications.ts
import type {
  NotificationPayload,
  PushSubscription as PushSubscriptionType
} from '../lib/supabaseClient'; // ✅ Tipos importados
import { supabase } from '../lib/supabaseClient'; // ✅ Import correto

export interface PushSubscriptionData {
    user_id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    expiration_time?: string | null;
    user_agent: string;
    device_info?: any;
    platform: string;
    category?: string | null;
    is_active: boolean;
}

// Exportar tipo já definido
export type { PushSubscriptionType };

class PushNotificationService {
    private publicVapidKey: string;
    private isSupported: boolean;
    private subscription: PushSubscription | null = null;

    constructor() {
        // ✅ CORREÇÃO: Use import.meta.env para Vite
        this.publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
        this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;

        if (!this.publicVapidKey) {
            console.warn('VAPID_PUBLIC_KEY não configurada');
        }
    }

    // Verificar suporte
    checkSupport(): boolean {
        return this.isSupported;
    }

    // Registrar Service Worker
    async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
        if (!this.isSupported) {
            console.warn('Push notifications não suportados neste navegador');
            return null;
        }

        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js', {
                scope: '/'
            });

            console.log('Service Worker registrado com sucesso:', registration.scope);
            return registration;
        } catch (error) {
            console.error('Erro ao registrar Service Worker:', error);
            return null;
        }
    }

    // Solicitar permissão
    async requestPermission(): Promise<boolean> {
        if (!this.isSupported) return false;

        try {
            const permission = await Notification.requestPermission();
            const granted = permission === 'granted';

            console.log('Permissão para notificações:', permission);
            return granted;
        } catch (error) {
            console.error('Erro ao solicitar permissão:', error);
            return false;
        }
    }

    // Converter chave VAPID
    private urlBase64ToUint8Array(base64String: string): Uint8Array {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Subscrever para push notifications
    async subscribeToPush(registration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
        if (!this.isSupported || !this.publicVapidKey) {
            console.warn('Push não suportado ou VAPID key não configurada');
            return null;
        }

        try {
            // Verificar subscription existente
            let subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                console.log('Subscription já existe');
                this.subscription = subscription;
                return subscription;
            }

            // Criar nova subscription
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.publicVapidKey)
            });

            this.subscription = subscription;
            console.log('Nova subscription criada');
            return subscription;
        } catch (error) {
            console.error('Erro ao subscrever push notifications:', error);
            return null;
        }
    }

    // Detectar plataforma
    private detectPlatform(): string {
        const userAgent = navigator.userAgent.toLowerCase();

        if (/android/.test(userAgent)) return 'android';
        if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
        if (/mac/.test(userAgent)) return 'mac';
        if (/win/.test(userAgent)) return 'windows';
        if (/linux/.test(userAgent)) return 'linux';
        return 'web';
    }

    // Salvar subscription no Supabase
    async saveSubscriptionToDatabase(
        subscription: PushSubscription,
        userId: string,
        category?: string
    ): Promise<any> {
        try {
            // Converter subscription para formato JSON
            const subscriptionJson = subscription.toJSON();

            if (!subscriptionJson.keys) {
                throw new Error('Chaves de subscription inválidas');
            }

            const subscriptionData: PushSubscriptionData = {
                user_id: userId,
                endpoint: subscriptionJson.endpoint,
                p256dh: subscriptionJson.keys.p256dh,
                auth: subscriptionJson.keys.auth,
                user_agent: navigator.userAgent,
                platform: this.detectPlatform(),
                category: category || null,
                is_active: true,
                device_info: {
                    language: navigator.language,
                    platform: navigator.platform,
                    vendor: navigator.vendor,
                    userAgent: navigator.userAgent,
                    screen: {
                        width: window.screen.width,
                        height: window.screen.height
                    }
                },
                expiration_time: null
            };

            console.log('Salvando subscription no Supabase:', {
                userId,
                endpoint: subscriptionData.endpoint.substring(0, 50) + '...',
                platform: subscriptionData.platform
            });

            // ✅ CORREÇÃO: Usar insert com onConflict para upsert
            const { data, error } = await supabase
                .from('push_subscriptions')
                .upsert({
                    ...subscriptionData,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'endpoint'
                })
                .select();

            if (error) {
                console.error('Erro ao salvar no Supabase:', error);
                throw error;
            }

            console.log('Subscription salva com sucesso:', data);
            return data;
        } catch (error) {
            console.error('Erro ao salvar subscription:', error);
            throw error;
        }
    }

    // Inicialização completa
    async initialize(userId: string, category?: string): Promise<boolean> {
        console.log('Inicializando push notifications para usuário:', userId);

        if (!this.isSupported) {
            console.warn('Push notifications não suportado');
            return false;
        }

        if (!this.publicVapidKey) {
            console.error('VAPID_PUBLIC_KEY não configurada no ambiente');
            return false;
        }

        try {
            // 1. Registrar Service Worker
            const registration = await this.registerServiceWorker();
            if (!registration) {
                console.error('Falha ao registrar Service Worker');
                return false;
            }

            // 2. Solicitar permissão
            const hasPermission = await this.requestPermission();
            if (!hasPermission) {
                console.warn('Usuário negou permissão para notificações');
                return false;
            }

            // 3. Subscrever para push
            const subscription = await this.subscribeToPush(registration);
            if (!subscription) {
                console.error('Falha ao criar subscription');
                return false;
            }

            // 4. Salvar no banco de dados
            await this.saveSubscriptionToDatabase(subscription, userId, category);

            console.log('Push notifications inicializado com sucesso');
            return true;
        } catch (error) {
            console.error('Erro na inicialização do push:', error);
            return false;
        }
    }

    // Atualizar categoria do usuário
    async updateUserCategory(userId: string, category: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('push_subscriptions')
                .update({
                    category: category,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId)
                .eq('is_active', true);

            if (error) throw error;

            console.log('Categoria atualizada para usuário:', userId);
            return true;
        } catch (error) {
            console.error('Erro ao atualizar categoria:', error);
            return false;
        }
    }

    // Verificar se usuário já tem subscription ativa
    async hasActiveSubscription(userId: string): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from('push_subscriptions')
                .select('id')
                .eq('user_id', userId)
                .eq('is_active', true)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = nenhum resultado
                console.error('Erro ao verificar subscription:', error);
            }

            return !!data;
        } catch (error) {
            console.error('Erro ao verificar subscription:', error);
            return false;
        }
    }

    // Obter categoria atual do usuário
    async getUserCategory(userId: string): Promise<string | null> {
        try {
            const { data, error } = await supabase
                .from('push_subscriptions')
                .select('category')
                .eq('user_id', userId)
                .eq('is_active', true)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Erro ao obter categoria:', error);
            }

            return data?.category || null;
        } catch (error) {
            console.error('Erro ao obter categoria:', error);
            return null;
        }
    }

    // Helper para obter o usuário atual
    async getCurrentUserId(): Promise<string | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            return user?.id || null;
        } catch (error) {
            console.error('Erro ao obter usuário atual:', error);
            return null;
        }
    }

    // Verificar autenticação
    async checkAuth(): Promise<{ isAuthenticated: boolean; user: any }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            return {
                isAuthenticated: !!user,
                user
            };
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            return { isAuthenticated: false, user: null };
        }
    }

    // Cancelar subscription
    async unsubscribeUser(userId: string): Promise<boolean> {
        try {
            // 1. Cancelar subscription no navegador
            if (this.subscription) {
                await this.subscription.unsubscribe();
                this.subscription = null;
            }

            // 2. Marcar como inativa no banco
            const { error } = await supabase
                .from('push_subscriptions')
                .update({
                    is_active: false,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId)
                .eq('is_active', true);

            if (error) throw error;

            console.log('Usuário desinscrito com sucesso:', userId);
            return true;
        } catch (error) {
            console.error('Erro ao desinscrever usuário:', error);
            return false;
        }
    }

    // Enviar notificação de teste
    async sendTestNotification(userId: string, title: string = 'Teste', body: string = 'Esta é uma notificação de teste'): Promise<boolean> {
        try {
            // Buscar subscription do usuário
            const { data: subscriptions, error } = await supabase
                .from('push_subscriptions')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true);

            if (error) throw error;

            if (!subscriptions || subscriptions.length === 0) {
                console.warn('Usuário não tem subscription ativa');
                return false;
            }

            // Criar payload de notificação
            const notificationPayload: NotificationPayload = {
                title,
                body,
                icon: '/icon-192x192.png',
                data: {
                    test: true,
                    userId,
                    timestamp: new Date().toISOString()
                }
            };

            // Enviar notificação via Edge Function
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        payload: notificationPayload
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const result = await response.json();
            console.log('Notificação de teste enviada:', result);
            return result.success === true;
        } catch (error) {
            console.error('Erro ao enviar notificação de teste:', error);
            return false;
        }
    }

    // ✅ NOVO MÉTODO: Enviar notificação usando o tipo NotificationPayload
    async sendNotification(
        userId: string,
        payload: NotificationPayload
    ): Promise<boolean> {
        try {
            // Buscar subscription do usuário
            const { data: subscriptions, error } = await supabase
                .from('push_subscriptions')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true);

            if (error) throw error;

            if (!subscriptions || subscriptions.length === 0) {
                console.warn('Usuário não tem subscription ativa');
                return false;
            }

            // Enviar notificação via Edge Function
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        payload
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const result = await response.json();
            console.log('Notificação enviada:', result);
            return result.success === true;
        } catch (error) {
            console.error('Erro ao enviar notificação:', error);
            return false;
        }
    }

    // ✅ NOVO MÉTODO: Enviar notificação para categoria específica
    async sendNotificationToCategory(
        categoryId: string,
        payload: NotificationPayload
    ): Promise<boolean> {
        try {
            // Enviar notificação via Edge Function para uma categoria
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        categoryId,
                        payload
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const result = await response.json();
            console.log('Notificação enviada para categoria:', categoryId, result);
            return result.success === true;
        } catch (error) {
            console.error('Erro ao enviar notificação para categoria:', error);
            return false;
        }
    }
}

// Exportar instância singleton
export const pushNotificationService = new PushNotificationService();

// ✅ Exportar tipos auxiliares
export type { NotificationPayload };

// ✅ Exportar função utilitária para inicialização rápida
export async function initializePushNotificationsForUser(
    userId: string,
    category?: string
): Promise<boolean> {
    try {
        const service = new PushNotificationService();
        return await service.initialize(userId, category);
    } catch (error) {
        console.error('Erro na inicialização rápida:', error);
        return false;
    }
}
