// Utilitários para validação e tratamento de UUID - VERSÃO CORRIGIDA
export const UUIDValidator = {
  isValidUUID(uuid: string): boolean {
    if (!uuid || typeof uuid !== 'string') return false;

    // ✅ CORREÇÃO: Permite "store-default" como valor especial para contexto inicial
    if (uuid === 'store-default' || uuid === 'loja-default') {
      console.warn('⚠️ UUID especial detectado (não é erro):', uuid);
      return true; // ✅ PERMITE VALORES ESPECIAIS
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  clearCorruptedData(): void {
    try {
      // Limpar dados corrompidos do localStorage
      const keysToRemove = [
        'store-id',
        'currentStore',
        'supabase.auth.token',
        'corrupted-store-data'
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      console.log('✅ Dados corrompidos limpos');
    } catch (error) {
      console.error('Erro ao limpar dados corrompidos:', error);
    }
  },

  normalizeStoreId(storeId: string): string | null {
    if (!storeId || storeId === 'store-default' || storeId === 'loja-default') {
      console.log('🔄 StoreId especial detectado, buscando do contexto...');
      return this.getStoreIdFromContext();
    }

    if (this.isValidUUID(storeId)) {
      return storeId;
    }

    // Tentar extrair UUID de string
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = storeId.match(uuidRegex);
    return match ? match[0] : null;
  },

  // ✅ NOVO: Obter storeId do contexto/autenticação
  getStoreIdFromContext(): string | null {
    try {
      // Tentar obter do localStorage
      const storedStoreId = localStorage.getItem('current-store-id');
      if (storedStoreId && this.isValidUUID(storedStoreId)) {
        return storedStoreId;
      }

      // Tentar obter do sessionStorage
      const sessionStoreId = sessionStorage.getItem('current-store-id');
      if (sessionStoreId && this.isValidUUID(sessionStoreId)) {
        return sessionStoreId;
      }

      // Tentar obter do estado da aplicação
      const appState = localStorage.getItem('app-state');
      if (appState) {
        const state = JSON.parse(appState);
        if (state.currentStore?.id && this.isValidUUID(state.currentStore.id)) {
          return state.currentStore.id;
        }
      }

      console.warn('⚠️ Nenhum storeId válido encontrado no contexto');
      return null;
    } catch (error) {
      console.error('❌ Erro ao obter storeId do contexto:', error);
      return null;
    }
  },

  // ✅ NOVO: Validar storeId sem lançar erro para valores especiais
  validateStoreIdSoft(storeId: string): { isValid: boolean; normalizedId: string | null; error?: string } {
    if (!storeId) {
      return { isValid: false, normalizedId: null, error: 'StoreId vazio' };
    }

    // ✅ CORREÇÃO: Permite valores especiais sem erro
    if (storeId === 'store-default' || storeId === 'loja-default') {
      const normalizedId = this.getStoreIdFromContext();
      if (normalizedId) {
        return { isValid: true, normalizedId };
      }
      return { isValid: false, normalizedId: null, error: 'StoreId especial sem contexto válido' };
    }

    if (this.isValidUUID(storeId)) {
      return { isValid: true, normalizedId: storeId };
    }

    return { isValid: false, normalizedId: null, error: 'StoreId em formato inválido' };
  }
};
