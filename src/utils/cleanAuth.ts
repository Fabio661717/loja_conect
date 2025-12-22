// 📄 src/utils/cleanAuth.ts - UTILITÁRIO DE LIMPEZA
export const cleanAuth = {
  clearAll: (): { clearedItems: string[] } => {
    const itemsToClear = [
      'user',
      'supabase.auth.token',
      'sb-localhost-auth-token',
      'selectedEmployee',
      'storeId',
      'supabase-auth-token'
    ];

    const clearedItems: string[] = [];

    itemsToClear.forEach(item => {
      if (localStorage.getItem(item)) {
        localStorage.removeItem(item);
        clearedItems.push(item);
      }
    });

    console.log('🧹 Auth limpa - Itens removidos:', clearedItems);
    return { clearedItems };
  },

  clearAndReload: (): void => {
    cleanAuth.clearAll();
    console.log('🔄 Recarregando página...');
    window.location.reload();
  },

  checkAuthState: (): {
    user: any;
    hasSession: boolean;
    storageItems: string[];
  } => {
    const user = localStorage.getItem('user');
    const session = localStorage.getItem('supabase.auth.token');

    return {
      user: user ? JSON.parse(user) : null,
      hasSession: !!session,
      storageItems: Object.keys(localStorage).filter(key =>
        key.includes('auth') || key.includes('user') || key.includes('token') || key.includes('store')
      )
    };
  }
};

// Função global para acesso via console
declare global {
  interface Window {
    cleanAuth: typeof cleanAuth;
  }
}

if (typeof window !== 'undefined') {
  window.cleanAuth = cleanAuth;
  console.log('🔧 Debug tools disponíveis: window.cleanAuth');
}
