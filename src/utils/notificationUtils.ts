// src/utils/notificationUtils.ts - VERSÃO CORRIGIDA
import { notificationService } from '../services/notificationService';

/**
 * ✅ UTILITÁRIOS PARA NOTIFICAÇÕES - VERSÃO CORRIGIDA
 * Funções auxiliares para gerenciar permissões e notificações
 */

/**
 * ✅ VERIFICAR E GERENCIAR PERMISSÃO DE NOTIFICAÇÃO
 */
export async function checkAndManageNotificationPermission(): Promise<boolean> {
  try {
    console.log('🔔 Verificando permissão de notificação...');

    // Verificar suporte do navegador
    if (!('Notification' in window)) {
      console.warn('❌ Notificações não suportadas pelo navegador');
      return false;
    }

    const currentPermission = Notification.permission;

    switch (currentPermission) {
      case 'granted':
        console.log('✅ Permissão já concedida para notificações');

        // ✅ CORREÇÃO: Removida chamada ao método privado
        // ❌ ERRADO: notificationService.showReactivationInstructions();
        // ✅ CORRETO: Não chamar métodos privados externamente

        return true;

      case 'denied':
        console.warn('🔕 Permissão de notificação negada pelo usuário');

        // ✅ CORREÇÃO: Usar método público disponível
        notificationService.showPermissionDeniedMessage();
        return false;

      case 'default':
        console.log('🔄 Permissão nunca solicitada - solicitando agora...');
        return await requestNotificationPermission();

      default:
        return false;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar permissão:', error);
    return false;
  }
}

/**
 * ✅ SOLICITAR PERMISSÃO DE NOTIFICAÇÃO
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (!('Notification' in window)) {
      console.warn('❌ Notificações não suportadas');
      return false;
    }

    console.log('🔄 Solicitando permissão de notificação...');

    const permission = await Notification.requestPermission();

    console.log(`📋 Resultado da permissão: ${permission}`);

    if (permission === 'granted') {
      console.log('✅ Permissão concedida!');

      // ✅ CORREÇÃO: Usar método público para notificação de boas-vindas
      notificationService.showWelcomeNotification();

      // Inicializar sistema de push
      await initializePushSystem();

      return true;
    } else {
      console.warn('❌ Permissão negada ou ignorada');

      // ✅ CORREÇÃO: Usar método público para mensagem de negação
      notificationService.showPermissionDeniedMessage();

      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao solicitar permissão:', error);
    return false;
  }
}

/**
 * ✅ INICIALIZAR SISTEMA DE PUSH
 */
async function initializePushSystem(): Promise<void> {
  try {
    console.log('🚀 Inicializando sistema de push...');

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      // Registrar Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registrado:', registration);

      // Verificar subscription existente
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        console.log('✅ Subscription push encontrada:', subscription);
        // ✅ CORREÇÃO: Usar método público para enviar subscription ao servidor
        await notificationService.sendSubscriptionToServer(subscription);
      } else {
        console.log('ℹ️ Nenhuma subscription push encontrada');
      }
    } else {
      console.warn('⚠️ Service Worker ou PushManager não suportados');
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar sistema push:', error);
  }
}

/**
 * ✅ VERIFICAR COMPATIBILIDADE DO NAVEGADOR
 */
export function checkBrowserNotificationSupport(): {
  supported: boolean;
  permission: NotificationPermission;
  pushSupported: boolean;
} {
  const supported = 'Notification' in window;
  const permission = supported ? Notification.permission : 'denied' as NotificationPermission;
  const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window;

  return {
    supported,
    permission,
    pushSupported
  };
}

/**
 * ✅ CRIAR NOTIFICAÇÃO LOCAL
 */
export function createLocalNotification(title: string, options?: NotificationOptions): void {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      console.warn('❌ Notificações não disponíveis ou permissão negada');
      return;
    }

    // ✅ CORREÇÃO: Removida variável 'notification' não utilizada
    // ❌ ERRADO: const notification = new Notification(title, options);
    // ✅ CORRETO: Criar notificação sem armazenar em variável não utilizada

    new Notification(title, options);
    console.log(`📢 Notificação local criada: ${title}`);

  } catch (error) {
    console.error('❌ Erro ao criar notificação local:', error);
  }
}

/**
 * ✅ VERIFICAR SE NOTIFICAÇÕES ESTÃO BLOQUEADAS
 */
export function areNotificationsBlocked(): boolean {
  if (!('Notification' in window)) return true;

  return Notification.permission === 'denied';
}

/**
 * ✅ OBTER STATUS DAS NOTIFICAÇÕES
 */
export function getNotificationStatus(): {
  supported: boolean;
  permission: NotificationPermission;
  blocked: boolean;
  pushSupported: boolean;
} {
  const supported = 'Notification' in window;
  const permission = supported ? Notification.permission : 'denied' as NotificationPermission;
  const blocked = permission === 'denied';
  const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window;

  return {
    supported,
    permission,
    blocked,
    pushSupported
  };
}

/**
 * ✅ MOSTRAR INSTRUÇÕES PARA REATIVAR NOTIFICAÇÕES (ALTERNATIVA PÚBLICA)
 */
export function showReactivationInstructionsPublic(): void {
  try {
    const instructions = document.createElement('div');
    instructions.className = 'fixed bottom-4 right-4 bg-orange-100 border border-orange-400 text-orange-800 p-4 rounded-lg shadow-lg z-50 max-w-sm';
    instructions.innerHTML = `
      <div class="font-bold mb-2">🔔 Notificações Bloqueadas</div>
      <div class="text-sm mb-3">
        Para receber notificações push, permita-as nas configurações do navegador.
      </div>
      <div class="flex justify-between items-center">
        <button onclick="this.parentElement.parentElement.remove()" class="text-orange-800 hover:text-orange-900 text-sm font-medium">
          Fechar
        </button>
        <button onclick="location.reload()" class="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600">
          Recarregar
        </button>
      </div>
    `;
    document.body.appendChild(instructions);

    setTimeout(() => {
      if (instructions.parentElement) {
        instructions.remove();
      }
    }, 15000);
  } catch (error) {
    console.error('❌ Erro ao mostrar instruções de reativação:', error);
  }
}

export default {
  checkAndManageNotificationPermission,
  requestNotificationPermission,
  checkBrowserNotificationSupport,
  createLocalNotification,
  areNotificationsBlocked,
  getNotificationStatus,
  showReactivationInstructionsPublic
};
