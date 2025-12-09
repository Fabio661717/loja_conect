// src/utils/browserCompatibility.ts - VERSÃO CORRIGIDA
export const checkBrowserCompatibility = () => {
  const compatibility = {
    notifications: 'Notification' in window,
    serviceWorker: 'serviceWorker' in navigator,
    pushManager: 'PushManager' in window,
    audioContext: 'AudioContext' in window || 'webkitAudioContext' in window,
    localStorage: 'localStorage' in window,
    indexedDB: 'indexedDB' in window,
    lockManager: 'locks' in navigator,
    permissions: 'permissions' in navigator
  };

  const warnings = [];
  const missingFeatures = [];

  if (!compatibility.notifications) missingFeatures.push('notifications');
  if (!compatibility.serviceWorker) warnings.push('serviceWorker');
  if (!compatibility.pushManager) warnings.push('pushManager');
  if (!compatibility.audioContext) warnings.push('audioContext');
  if (!compatibility.lockManager) warnings.push('lockManager');
  if (!compatibility.permissions) warnings.push('permissions');

  return {
    compatibility,
    warnings,
    missingFeatures,
    isCompatible: compatibility.notifications && compatibility.localStorage,
    isFullyCompatible: compatibility.notifications && compatibility.serviceWorker && compatibility.pushManager
  };
};

export const setupSupabaseCompatibility = () => {
  const compatibility = checkBrowserCompatibility();

  return {
    ...compatibility,
    isCompatible: compatibility.isCompatible,
    recommendations: compatibility.warnings.length > 0
      ? ['Use um navegador moderno como Chrome, Firefox ou Safari']
      : []
  };
};

export const createCompatibleLockManager = () => {
  const isSupported = 'locks' in navigator;

  if (isSupported) {
    return {
      request: async (name: string, options?: any, callback?: (lock: any) => Promise<any>) => {
        // ✅ CORREÇÃO ERRO 1: Usar options e callback corretamente
        const lockOptions = {
          mode: options?.mode || 'exclusive',
          ifAvailable: options?.ifAvailable || false,
          steal: options?.steal || false,
          signal: options?.signal
        };

        // ✅ LOG DE DEBUG SE SOLICITADO
        if (options?.debug) {
          console.log('🔒 Solicitando lock:', {
            name,
            options: lockOptions,
            timestamp: new Date().toISOString()
          });
        }

        return await navigator.locks.request(
          name,
          lockOptions,
          async (lock) => {
            if (options?.debug && lock) {
              console.log(`🔒 Lock "${name}" adquirido com sucesso`);
            }

            // ✅ Executar callback se fornecido
            if (callback) {
              return await callback(lock);
            }

            // ✅ Retornar função para liberar o lock
            return () => {
              if (options?.debug) {
                console.log(`🔒 Lock "${name}" liberado`);
              }
            };
          }
        );
      }
    };
  } else {
    // Fallback para navegadores sem suporte a LockManager
    const locks = new Map();

    return {
      request: async (name: string, options?: any, callback?: (lock: any) => Promise<any>) => {
        // ✅ AGORA USANDO O PARÂMETRO options NO FALLBACK

        // ✅ LOG DE DEBUG SE SOLICITADO
        if (options?.debug) {
          console.log('🔒 [FALLBACK] Solicitando lock:', {
            name,
            options,
            timestamp: new Date().toISOString(),
            usingFallback: true
          });
        }

        // ✅ USAR TIMEOUT DAS OPÇÕES SE DISPONÍVEL
        const timeout = options?.timeout || 100;

        // ✅ SIMULAR COMPORTAMENTO DE LOCK COM OPÇÕES
        if (locks.has(name)) {
          // ✅ VERIFICAR MODO "ifAvailable"
          if (options?.ifAvailable) {
            const releaseFn = () => {
              if (options?.debug) {
                console.log('🔒 [FALLBACK] Lock não disponível (ifAvailable):', name);
              }
            };

            // ✅ Executar callback se fornecido
            if (callback) {
              await callback(null);
            }

            return releaseFn;
          }

          // ✅ USAR TIMEOUT PERSONALIZADO
          await new Promise(resolve => setTimeout(resolve, timeout));

          // ✅ VERIFICAR MODO "steal" (roubar lock)
          if (options?.steal && locks.has(name)) {
            if (options?.debug) {
              console.log('🔒 [FALLBACK] Roubando lock:', name);
            }
            locks.delete(name);
          } else {
            // ✅ RE-TENTAR APÓS TIMEOUT
            if (locks.has(name)) {
              if (options?.debug) {
                console.log('🔒 [FALLBACK] Lock ainda ocupado após timeout:', name);
              }
              throw new Error(`Lock "${name}" está ocupado`);
            }
          }
        }

        // ✅ CORREÇÃO ERRO 2: Usar Map corretamente
        locks.set(name, true);

        if (options?.debug) {
          console.log('🔒 [FALLBACK] Lock adquirido:', {
            name,
            activeLocks: Array.from(locks.keys()),
            timestamp: new Date().toISOString()
          });
        }

        // ✅ Executar callback se fornecido
        if (callback) {
          await callback({ name, acquiredAt: new Date().toISOString() });
        }

        const releaseFn = () => {
          // ✅ CORREÇÃO ERRO 2: Usar delete do Map
          locks.delete(name);

          if (options?.debug) {
            console.log('🔒 [FALLBACK] Lock liberado:', {
              name,
              remainingLocks: Array.from(locks.keys()),
              timestamp: new Date().toISOString()
            });
          }
        };

        return releaseFn;
      }
    };
  }
};

// ✅ NOVA FUNÇÃO: createEnhancedLockManager com mais opções
export const createEnhancedLockManager = (config?: {
  debug?: boolean;
  defaultTimeout?: number;
  maxRetries?: number;
}) => {
  const defaultConfig = {
    debug: config?.debug || false,
    defaultTimeout: config?.defaultTimeout || 100,
    maxRetries: config?.maxRetries || 3
  };

  const isSupported = 'locks' in navigator;

  if (isSupported) {
    return {
      request: async (name: string, options?: any, callback?: (lock: any) => Promise<any>) => {
        const mergedOptions = {
          ...options,
          debug: options?.debug !== undefined ? options.debug : defaultConfig.debug
        };

        if (mergedOptions.debug) {
          console.log('🔒 [ENHANCED] Solicitando lock nativo:', {
            name,
            options: mergedOptions,
            config: defaultConfig,
            supported: true
          });
        }

        return await navigator.locks.request(
          name,
          mergedOptions,
          async (lock) => {
            if (mergedOptions.debug && lock) {
              console.log(`🔒 [ENHANCED] Lock "${name}" adquirido`);
            }

            if (callback) {
              return await callback(lock);
            }

            return () => {
              if (mergedOptions.debug) {
                console.log(`🔒 [ENHANCED] Lock "${name}" liberado`);
              }
            };
          }
        );
      },
      getConfig: () => ({ ...defaultConfig, supported: true })
    };
  } else {
    const locks = new Map<string, boolean>();
    const lockStats = new Map<string, { acquired: number; released: number; waitTime: number }>();

    return {
      request: async (name: string, options?: any, callback?: (lock: any) => Promise<any>) => {
        const mergedOptions = {
          ...options,
          debug: options?.debug !== undefined ? options.debug : defaultConfig.debug,
          timeout: options?.timeout || defaultConfig.defaultTimeout
        };

        if (mergedOptions.debug) {
          console.log('🔒 [ENHANCED] Solicitando lock (fallback):', {
            name,
            options: mergedOptions,
            config: defaultConfig,
            supported: false,
            activeLocks: Array.from(locks.keys())
          });
        }

        // ✅ IMPLEMENTAÇÃO AVANÇADA COM RETRY
        let retries = 0;
        const maxRetries = mergedOptions.maxRetries || defaultConfig.maxRetries;

        while (retries < maxRetries) {
          if (!locks.has(name)) {
            // ✅ CORREÇÃO ERRO 2: Usar Map corretamente
            locks.set(name, true);

            // ✅ ESTATÍSTICAS DE USO
            const stats = lockStats.get(name) || { acquired: 0, released: 0, waitTime: 0 };
            stats.acquired++;
            lockStats.set(name, stats);

            if (mergedOptions.debug) {
              console.log('🔒 [ENHANCED] Lock adquirido:', {
                name,
                retry: retries,
                timestamp: new Date().toISOString(),
                stats: lockStats.get(name)
              });
            }

            // ✅ Executar callback se fornecido
            const mockLock = {
              name,
              acquiredAt: new Date().toISOString(),
              mode: mergedOptions.mode || 'exclusive'
            };

            if (callback) {
              await callback(mockLock);
            }

            const releaseFn = () => {
              // ✅ CORREÇÃO ERRO 2: Usar delete do Map
              locks.delete(name);
              const stats = lockStats.get(name);
              if (stats) {
                stats.released++;
                lockStats.set(name, stats);
              }

              if (mergedOptions.debug) {
                console.log('🔒 [ENHANCED] Lock liberado:', {
                  name,
                  timestamp: new Date().toISOString(),
                  stats: lockStats.get(name)
                });
              }
            };

            return releaseFn;
          }

          retries++;
          if (mergedOptions.debug) {
            console.log(`🔒 [ENHANCED] Tentativa ${retries}/${maxRetries} para lock "${name}"`);
          }

          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, mergedOptions.timeout));
          }
        }

        throw new Error(`Não foi possível adquirir lock "${name}" após ${maxRetries} tentativas`);
      },
      getStats: () => {
        const stats: Record<string, { acquired: number; released: number; waitTime: number }> = {};
        lockStats.forEach((value, key) => {
          stats[key] = { ...value };
        });
        return stats;
      },
      getConfig: () => ({ ...defaultConfig, supported: false, activeLocks: Array.from(locks.keys()) }),
      clearLocks: () => {
        const count = locks.size;
        locks.clear();
        if (defaultConfig.debug) {
          console.log(`🔒 [ENHANCED] ${count} locks limpos`);
        }
        return count;
      }
    };
  }
};

// ✅ FUNÇÃO PARA VERIFICAR COMPATIBILIDADE COM OPÇÕES
export const checkCompatibilityWithOptions = (options?: {
  verbose?: boolean;
  includeDetails?: boolean;
  checkPerformance?: boolean;
}) => {
  const result = checkBrowserCompatibility();

  if (options?.verbose) {
    console.group('🧪 Verificação de Compatibilidade do Navegador');
    console.log('✅ Compatibilidade:', result.compatibility);

    if (options?.includeDetails) {
      console.log('📊 Detalhes:', {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookiesEnabled: navigator.cookieEnabled,
        hardwareConcurrency: navigator.hardwareConcurrency
      });
    }

    if (options?.checkPerformance) {
      console.log('⚡ Performance:', {
        deviceMemory: (navigator as any).deviceMemory || 'desconhecido',
        connection: (navigator as any).connection || 'desconhecido'
      });
    }

    console.log('⚠️ Avisos:', result.warnings);
    console.log('❌ Problemas:', result.missingFeatures);
    console.log('🔧 Totalmente Compatível:', result.isFullyCompatible);
    console.groupEnd();
  }

  return {
    ...result,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    checkOptions: options || {}
  };
};

export default {
  checkBrowserCompatibility,
  setupSupabaseCompatibility,
  createCompatibleLockManager,
  createEnhancedLockManager,
  checkCompatibilityWithOptions
};
