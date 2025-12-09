// src/utils/userAuthNotifications.ts
// ===============================================================
// UTILIDADES SIMPLES PARA AUTENTICAÇÃO + NOTIFICAÇÕES
// ===============================================================

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    console.error("❌ Service Worker não suportado");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    console.log("✅ Service Worker registrado");
    return registration;
  } catch (error) {
    console.error("❌ Erro ao registrar Service Worker:", error);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (error) {
    console.error("❌ Erro ao solicitar permissão:", error);
    return false;
  }
}

// ===============================================================
// 🔥 Inscrição básica via login/cadastro
// ===============================================================
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const clean = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");

  const raw = window.atob(clean);
  const buffer = new ArrayBuffer(raw.length);
  const array = new Uint8Array(buffer);

  for (let i = 0; i < raw.length; i++) array[i] = raw.charCodeAt(i);

  return buffer;
}

export async function subscribeToPushNotifications(
  registration: ServiceWorkerRegistration,
  vapidPublicKeyBase64: string
): Promise<PushSubscription | null> {
  try {
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const key = base64ToArrayBuffer(vapidPublicKeyBase64);

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key, // 🔥 CORRIGIDO
      });

      console.log("✅ Nova subscription criada");
    } else {
      console.log("ℹ️ Subscription existente encontrada");
    }

    return subscription;
  } catch (error) {
    console.error("❌ Erro ao criar subscription:", error);
    return null;
  }
}
