// src/services/pushSubscription.ts
// ===============================================================
// SISTEMA COMPLETO DE PUSH NOTIFICATIONS (FRONTEND)
// ===============================================================

export class PushSubscriptionService {
  private apiBaseUrl: string;
  private vapidPublicKey: string;

  constructor(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
    this.vapidPublicKey = ""; // Carregada dinamicamente
  }

  // ===============================================================
  // 🔥 Conversão correta: Base64 → ArrayBuffer
  // ===============================================================
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const base64Clean = (base64 + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const raw = window.atob(base64Clean);
    const buffer = new ArrayBuffer(raw.length);
    const view = new Uint8Array(buffer);

    for (let i = 0; i < raw.length; i++) {
      view[i] = raw.charCodeAt(i);
    }

    return buffer;
  }

  // ===============================================================
  // 🔔 Envio de notificação (server → push)
  // ===============================================================
  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: any
  ): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

      const response = await fetch(
        `${this.apiBaseUrl}/send-notification`, // USAR VARIÁVEL DE AMBIENTE
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId, // ADICIONAR userId NO PAYLOAD
            subscription: await this.getCurrentSubscription(),
            payload: { title, body, data },
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      if (result.success) return true;

      throw new Error("Falha no servidor");
    } catch (error) {
      console.error("❌ Erro ao enviar push (server):", error);

      // Verificar se é timeout específico
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error("⏰ Timeout na requisição de push notification");
        }
      }

      // 🔥 FALLBACK LOCAL VIA SERVICE WORKER
      try {
        const registration = await navigator.serviceWorker.ready;

        registration.active?.postMessage({
          type: "SEND_PUSH_NOTIFICATION",
          payload: {
            title,
            body,
            icon: "/icon-192x192.png",
            data: { ...data, userId, fallback: true },
          },
        });

        return true;
      } catch (fallbackError) {
        console.error("❌ Fallback falhou:", fallbackError);
        return false;
      }
    }
  }

  // ===============================================================
  // 🔧 Inicialização completa
  // ===============================================================
  async initialize(userId?: string): Promise<boolean> {
    if (!this.isPushSupported()) return false;

    const permission = await this.requestNotificationPermission();
    if (permission !== "granted") return false;

    const registration = await this.registerServiceWorker();
    if (!registration) return false;

    const alreadySubscribed = await this.hasActiveSubscription();
    if (alreadySubscribed) return true;

    if (!userId) return false;

    return this.subscribeUser(userId);
  }

  // ===============================================================
  // 🔐 Subscription atual
  // ===============================================================
  async hasActiveSubscription(): Promise<boolean> {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      return (await reg?.pushManager.getSubscription()) !== null;
    } catch {
      return false;
    }
  }

  async hasActiveSubscriptionForCurrentDevice(): Promise<boolean> {
    try {
      const reg = await navigator.serviceWorker.ready;
      return (await reg.pushManager.getSubscription()) !== null;
    } catch (error) {
      console.error("❌ Erro ao verificar subscription:", error);
      return false;
    }
  }

  // ===============================================================
  // Registrando PUSH
  // ===============================================================
  async registerPush(): Promise<PushSubscription | null> {
    try {
      const registration = await navigator.serviceWorker.ready;

      if (!this.vapidPublicKey) {
        this.vapidPublicKey = await this.getVapidPublicKey();
      }

      return await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.base64ToArrayBuffer(this.vapidPublicKey),
      });
    } catch (err) {
      console.error("❌ Erro ao registrar push:", err);
      return null;
    }
  }

  // ===============================================================
  // 🔄 Cancelar subscription
  // ===============================================================
  async unregisterPush(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();

      if (existing) {
        await existing.unsubscribe();
        return true;
      }
      return false;
    } catch (err) {
      console.error("❌ Erro ao cancelar subscription:", err);
      return false;
    }
  }

  // ===============================================================
  // Inscrever usuário
  // ===============================================================
  async subscribeUser(userId: string): Promise<boolean> {
    try {
      const reg = await navigator.serviceWorker.ready;

      const vapidPublicKey = await this.getVapidPublicKey();
      const applicationServerKey = this.base64ToArrayBuffer(vapidPublicKey);

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      await fetch(`${this.apiBaseUrl}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, subscription }),
      });

      return true;
    } catch (error) {
      console.error("❌ Erro ao inscrever usuário:", error);
      return false;
    }
  }

  async unsubscribeUser(): Promise<boolean> {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      return sub ? await sub.unsubscribe() : false;
    } catch {
      return false;
    }
  }

  // ===============================================================
  // Utilidades do sistema
  // ===============================================================
  async getSystemStatus(): Promise<any> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/status`);
      return await res.json();
    } catch {
      return {
        pushManager: "PushManager" in window,
        serviceWorker: "serviceWorker" in navigator,
        vapidKey: { present: false, valid: false },
      };
    }
  }

  async getCurrentSubscription(): Promise<PushSubscription | null> {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      return reg ? await reg.pushManager.getSubscription() : null;
    } catch {
      return null;
    }
  }

  async isUserSubscribed(userId: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/subscriptions/${userId}`);
      const data = await res.json();
      return data?.active ?? false;
    } catch {
      return false;
    }
  }

  async getUserSubscriptions(userId: string): Promise<any[]> {
    try {
      const res = await fetch(
        `${this.apiBaseUrl}/subscriptions/${userId}/list`
      );
      return await res.json();
    } catch {
      return [];
    }
  }

  async saveSubscription(userId: string, subscription: PushSubscription): Promise<void> {
    try {
      await fetch(`${this.apiBaseUrl}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, subscription }),
      });
    } catch {
      console.error("❌ Erro ao salvar assinatura");
    }
  }

  async deleteSubscription(subscriptionId: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/subscriptions/${subscriptionId}`, {
        method: "DELETE",
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async sendTestNotification(userId: string, title: string, body: string): Promise<boolean> {
    return this.sendPushNotification(userId, title, body, { test: true });
  }

  // ===============================================================
  // Service Worker
  // ===============================================================
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    try {
      if (!("serviceWorker" in navigator)) return null;
      return await navigator.serviceWorker.register("/sw.js");
    } catch {
      return null;
    }
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    try {
      return await Notification.requestPermission();
    } catch {
      return "denied";
    }
  }

  isPushSupported(): boolean {
    return "serviceWorker" in navigator && "PushManager" in window;
  }

  // ===============================================================
  // Buscar chave VAPID
  // ===============================================================
  async getVapidPublicKey(): Promise<string> {
    try {
      if (this.vapidPublicKey) return this.vapidPublicKey;

      const res = await fetch(`${this.apiBaseUrl}/vapid-public-key`);
      const data = await res.json();
      this.vapidPublicKey = data.publicKey;
      return this.vapidPublicKey;
    } catch {
      return "BBbiTp85tUypp_rE1nrl8Nc9hMFDAtQ0qpUsxUyJQ1vtT73P6LjA-YhlaPEmC1ViI9s0HBiUwb6uL1puY5sjfwU";
    }
  }

  getPermissionState(): NotificationPermission {
    return Notification.permission;
  }
}

// Instância única
export const pushSubscriptionService = new PushSubscriptionService(
  import.meta.env.VITE_SUPABASE_URL + "/functions/v1"
);
