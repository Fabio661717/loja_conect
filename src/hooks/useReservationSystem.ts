// src/hooks/useReservationSystem.ts - VERSÃO REESCRITA
import { useCallback, useEffect, useState } from 'react';
import { notificationService } from '../services/notificationService';
import { checkBrowserCompatibility } from '../utils/browserCompatibility';

// ✅ INTERFACE PARA STATUS DO SISTEMA
interface SystemStatus {
  isSupported: boolean;
  permissionState: NotificationPermission;
  isInitialized: boolean;
  browserCompatible: boolean;
  compatibilityIssues: string[];
}

// ✅ TIPO PARA OPÇÕES DE NOTIFICAÇÃO
interface NotificationOptions {
  reservationId?: string;
  productName?: string;
  minutesLeft?: number;
  urgent?: boolean;
  reason?: string;
  data?: Record<string, any>;
  [key: string]: any;
}

export const useReservationSystem = () => {
  // ✅ FUNÇÕES AUXILIARES DENTRO DO HOOK
  const isSupported = (): boolean => {
    return 'Notification' in window;
  };

  const getPermissionState = (): NotificationPermission => {
    return Notification.permission;
  };

  // ✅ ESTADOS PARA CONTROLE DO SISTEMA
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    isSupported: false,
    permissionState: 'default' as NotificationPermission,
    isInitialized: false,
    browserCompatible: true,
    compatibilityIssues: []
  });

  const [initializationAttempts, setInitializationAttempts] = useState(0);
  const maxInitializationAttempts = 3;

  // ✅ VERIFICAR COMPATIBILIDADE DO NAVEGADOR
  const checkBrowserCompatibilityStatus = useCallback(() => {
    const compatibility = checkBrowserCompatibility();

    setSystemStatus(prev => ({
      ...prev,
      browserCompatible: compatibility.isCompatible,
      compatibilityIssues: [
        ...compatibility.missingFeatures,
        ...compatibility.warnings
      ]
    }));

    return compatibility;
  }, []);

  // ✅ INICIALIZAÇÃO ROBUSTA COM RETRY MECANISMO
  const initializeSystem = useCallback(async () => {
    if (initializationAttempts >= maxInitializationAttempts) {
      console.warn('🚨 Número máximo de tentativas de inicialização atingido');
      return;
    }

    try {
      console.log('🔄 Inicializando sistema de reservas...');
      setInitializationAttempts(prev => prev + 1);

      // ✅ VERIFICAR COMPATIBILIDADE PRIMEIRO
      const compatibility = checkBrowserCompatibilityStatus();

      if (!compatibility.isCompatible) {
        console.warn('⚠️ Navegador com problemas de compatibilidade:', compatibility.warnings);
      }

      // ✅ VERIFICAR SUPORTE BÁSICO
      const supported = isSupported();
      if (!supported) {
        console.warn('⚠️ Sistema de notificações não suportado');
        setSystemStatus(prev => ({
          ...prev,
          isSupported: false,
          isInitialized: false
        }));
        return;
      }

      // ✅ VERIFICAR PERMISSÃO
      const permissionState = getPermissionState();
      console.log('📱 Estado da permissão:', permissionState);

      setSystemStatus(prev => ({
        ...prev,
        isSupported: true,
        permissionState,
        isInitialized: true
      }));

      // ✅ SOLICITAR PERMISSÃO APÓS INTERAÇÃO DO USUÁRIO
      if (permissionState === 'default') {
        console.log('⏳ Permissão nunca solicitada - aguardando ação do usuário');

        const handleFirstInteraction = () => {
          console.log('🎯 Primeira interação do usuário - solicitando permissão');
          notificationService.requestNotificationPermission()
            .then(granted => {
              console.log(granted ? '✅ Permissão concedida' : '❌ Permissão negada');
              setSystemStatus(prev => ({
                ...prev,
                permissionState: granted ? 'granted' : 'denied'
              }));
            })
            .catch(error => {
              console.error('❌ Erro ao solicitar permissão:', error);
            });

          // Remover listeners após primeira interação
          document.removeEventListener('click', handleFirstInteraction);
          document.removeEventListener('touchstart', handleFirstInteraction);
        };

        // Adicionar listeners para primeira interação
        document.addEventListener('click', handleFirstInteraction);
        document.addEventListener('touchstart', handleFirstInteraction);

        // Limpar listeners após 30 segundos
        setTimeout(() => {
          document.removeEventListener('click', handleFirstInteraction);
          document.removeEventListener('touchstart', handleFirstInteraction);
        }, 30000);
      }

      // ✅ INICIALIZAR SERVIÇOS AVANÇADOS SE PERMITIDO
      if (permissionState === 'granted') {
        console.log('🚀 Inicializando serviços avançados...');

        try {
          await notificationService.initializeNotificationSystem();
          console.log('✅ Sistema de notificações inicializado');
        } catch (pushError) {
          console.warn('⚠️ Erro na inicialização do sistema de notificações:', pushError);
        }
      }

      console.log('✅ Sistema de reservas inicializado com sucesso');

    } catch (error) {
      console.error('❌ Erro na inicialização do sistema:', error);

      // ✅ TENTAR NOVAMENTE APÓS 5 SEGUNDOS
      if (initializationAttempts < maxInitializationAttempts) {
        console.log(`🔄 Tentativa ${initializationAttempts + 1}/${maxInitializationAttempts} em 5s...`);

        setTimeout(() => {
          initializeSystem();
        }, 5000);
      } else {
        setSystemStatus(prev => ({
          ...prev,
          isInitialized: false
        }));
      }
    }
  }, [isSupported, getPermissionState, initializationAttempts, checkBrowserCompatibilityStatus]);

  // ✅ EFEITO DE INICIALIZAÇÃO COM CLEANUP
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (!mounted) return;
      await initializeSystem();
    };

    // Inicializar após um breve delay para garantir que o DOM está pronto
    const initializationTimer = setTimeout(initialize, 1000);

    return () => {
      mounted = false;
      clearTimeout(initializationTimer);

      // Cleanup de event listeners
      document.removeEventListener('click', () => {});
      document.removeEventListener('touchstart', () => {});
    };
  }, [initializeSystem]);

  // ✅ FUNÇÃO PARA REINICIALIZAR O SISTEMA
  const reinitializeSystem = useCallback(() => {
    console.log('🔄 Reinicializando sistema...');
    setInitializationAttempts(0);
    setSystemStatus(prev => ({
      ...prev,
      isInitialized: false
    }));

    setTimeout(() => {
      initializeSystem();
    }, 1000);
  }, [initializeSystem]);

  // ✅ FUNÇÃO PARA VERIFICAR STATUS DETALHADO
  const getDetailedStatus = useCallback(() => {
    const compatibility = checkBrowserCompatibility();

    return {
      ...systemStatus,
      detailedCompatibility: compatibility,
      initializationAttempts,
      maxAttempts: maxInitializationAttempts,
      timestamp: new Date().toISOString()
    };
  }, [systemStatus, initializationAttempts]);

  return {
    // ✅ STATUS DO SISTEMA
    isSupported: systemStatus.isSupported,
    permissionState: systemStatus.permissionState,
    isInitialized: systemStatus.isInitialized,
    browserCompatible: systemStatus.browserCompatible,
    compatibilityIssues: systemStatus.compatibilityIssues,

    // ✅ FUNÇÕES
    reinitializeSystem,
    getDetailedStatus,

    // ✅ INFO DE INICIALIZAÇÃO
    initializationInfo: {
      attempts: initializationAttempts,
      maxAttempts: maxInitializationAttempts,
      canRetry: initializationAttempts < maxInitializationAttempts
    }
  };
};

// ✅ HOOK PARA NOTIFICAÇÕES DE RESERVA
export const useReservationNotifications = () => {
  const [reservationAlerts, setReservationAlerts] = useState<any[]>([]);

  const isSupported = (): boolean => {
    return 'Notification' in window;
  };

  const getPermissionState = (): NotificationPermission => {
    return Notification.permission;
  };

  // ✅ SOLICITAR PERMISSÃO COM TRATAMENTO DE ERRO
  const requestPermission = async (): Promise<boolean> => {
    try {
      if (!isSupported()) return false;

      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('❌ Erro ao solicitar permissão:', error);
      return false;
    }
  };

  // ✅ ENVIAR NOTIFICAÇÃO DE RESERVA COM OPÇÕES
  const sendReservationNotification = async (
    title: string,
    message: string,
    options: NotificationOptions = {}
  ): Promise<boolean> => {
    try {
      // ✅ CORREÇÃO: Agora usamos a variável 'options'
      console.log('🔧 Opções da notificação:', options);

      // Se houver dados importantes nas opções, podemos processá-los
      if (options.reservationId) {
        console.log(`📋 Reserva ID: ${options.reservationId}`);
      }

      if (options.productName) {
        console.log(`📦 Produto: ${options.productName}`);
      }

      if (options.minutesLeft !== undefined) {
        console.log(`⏱️ Minutos restantes: ${options.minutesLeft}`);
        options.urgent = options.minutesLeft <= 30;
      }

      // Tentar notificação do navegador primeiro
      if (getPermissionState() === 'granted') {
        // ✅ Passar opções relevantes para o serviço de notificação
        const enhancedOptions = {
          ...options,
          tag: `reservation-${options.reservationId || Date.now()}`,
          timestamp: new Date().toISOString()
        };

        return await notificationService.sendNotification(title, message, enhancedOptions);
      }

      // Fallback para notificação in-app
      notificationService.showInAppNotification(title, message, options);
      return true;

    } catch (error) {
      console.error('❌ Erro ao enviar notificação de reserva:', error);

      // Fallback final - console log com opções
      console.log(`📢 [Reserva] ${title}: ${message}`, options);
      return false;
    }
  };

  // ✅ NOTIFICAÇÃO DE RESERVA EXPIRANDO
  const notifyReservationExpiring = async (
    reservationId: string,
    productName: string,
    minutesLeft: number
  ): Promise<boolean> => {
    const title = minutesLeft <= 30
      ? '⏰ URGENTE: Reserva Expirando!'
      : '⏰ Lembrete de Reserva';

    const message = minutesLeft <= 30
      ? `Sua reserva de ${productName} expira em ${minutesLeft} minutos!`
      : `Sua reserva de ${productName} expira em ${minutesLeft} minutos`;

    const options: NotificationOptions = {
      reservationId,
      productName,
      minutesLeft,
      urgent: minutesLeft <= 30,
      data: {
        type: 'reservation-expiring',
        priority: minutesLeft <= 30 ? 'high' : 'medium'
      }
    };

    return await sendReservationNotification(title, message, options);
  };

  // ✅ NOTIFICAÇÃO DE RESERVA CONFIRMADA
  const notifyReservationConfirmed = async (
    reservationId: string,
    productName: string
  ): Promise<boolean> => {
    const options: NotificationOptions = {
      reservationId,
      productName,
      data: {
        type: 'reservation-confirmed',
        priority: 'medium',
        action: 'view-reservation'
      }
    };

    return await sendReservationNotification(
      '✅ Reserva Confirmada!',
      `Sua reserva de ${productName} foi confirmada com sucesso.`,
      options
    );
  };

  // ✅ NOTIFICAÇÃO DE RESERVA CANCELADA
  const notifyReservationCancelled = async (
    reservationId: string,
    productName: string,
    reason?: string
  ): Promise<boolean> => {
    const message = reason
      ? `Sua reserva de ${productName} foi cancelada. Motivo: ${reason}`
      : `Sua reserva de ${productName} foi cancelada.`;

    const options: NotificationOptions = {
      reservationId,
      productName,
      reason,
      data: {
        type: 'reservation-cancelled',
        priority: 'medium',
        requiresAck: true
      }
    };

    return await sendReservationNotification('❌ Reserva Cancelada', message, options);
  };

  // ✅ NOVA FUNÇÃO: SALVAR OPÇÕES DA RESERVA
  const saveReservationOptions = (reservationId: string, options: NotificationOptions) => {
    try {
      // Simular salvamento das opções
      console.log(`💾 Salvando opções para reserva ${reservationId}:`, options);

      // Aqui você poderia salvar em localStorage, banco de dados, etc.
      const key = `reservation-options-${reservationId}`;
      localStorage.setItem(key, JSON.stringify(options));

      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar opções da reserva:', error);
      return false;
    }
  };

  // ✅ NOVA FUNÇÃO: CARREGAR OPÇÕES DA RESERVA
  const loadReservationOptions = (reservationId: string): NotificationOptions | null => {
    try {
      const key = `reservation-options-${reservationId}`;
      const saved = localStorage.getItem(key);

      if (saved) {
        return JSON.parse(saved);
      }

      return null;
    } catch (error) {
      console.error('❌ Erro ao carregar opções da reserva:', error);
      return null;
    }
  };

  return {
    // ✅ FUNÇÕES BÁSICAS
    isSupported,
    getPermissionState,
    requestPermission,

    // ✅ NOTIFICAÇÕES ESPECÍFICAS
    sendReservationNotification,
    notifyReservationExpiring,
    notifyReservationConfirmed,
    notifyReservationCancelled,

    // ✅ GERENCIAMENTO DE OPÇÕES
    saveReservationOptions,
    loadReservationOptions,

    // ✅ GERENCIAMENTO DE ALERTAS
    reservationAlerts,
    setReservationAlerts,

    // ✅ STATUS
    isReady: getPermissionState() === 'granted' && isSupported()
  };
};

export default useReservationSystem;
