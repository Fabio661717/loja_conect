// 📄 src/components/DebugAuth.tsx - NOVO COMPONENTE
import { useState } from 'react';

export const cleanAuth = {
  clearAll: () => {
    // Limpa todo o localStorage relacionado à auth
    localStorage.removeItem('user');
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('sb-localhost-auth-token');
    localStorage.removeItem('selectedEmployee');
    localStorage.removeItem('storeId');

    console.log('🧹 Auth limpa completamente');
    return {
      user: localStorage.getItem('user'),
      session: localStorage.getItem('supabase.auth.token'),
      selectedEmployee: localStorage.getItem('selectedEmployee'),
      storeId: localStorage.getItem('storeId')
    };
  },

  clearAndReload: () => {
    cleanAuth.clearAll();
    window.location.reload();
  }
};

export const authDebug = {
  logAuthFlow: (message: string, data?: any) => {
    console.log(`🔐 AUTH DEBUG: ${message}`, data || '');
  },

  checkLocalStorage: () => {
    const user = localStorage.getItem('user');
    const session = localStorage.getItem('supabase.auth.token');

    const debugInfo = {
      user: user ? JSON.parse(user) : null,
      hasSession: !!session,
      sessionKeys: Object.keys(localStorage).filter(key =>
        key.includes('auth') || key.includes('user') || key.includes('store')
      ),
      allKeys: Object.keys(localStorage)
    };

    console.log('🔐 DEBUG LocalStorage:', debugInfo);
    return debugInfo;
  }
};

export default function DebugAuth() {
  const [isOpen, setIsOpen] = useState(false);

  const handleCleanAndReload = () => {
    if (window.confirm('🧹 Tem certeza que deseja limpar TODOS os dados de autenticação? Isso fará logout de todos os usuários.')) {
      cleanAuth.clearAndReload();
    }
  };

  const handleDebug = () => {
    const debugInfo = authDebug.checkLocalStorage();
    alert('🔍 Verifique o console para informações de debug!');
    console.log('🔐 DEBUG COMPLETO:', debugInfo);
  };

  // Botão compacto que expande ao passar o mouse
  return (
    <div
      className="fixed top-2 right-2 z-50 transition-all duration-300"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className={`bg-red-500 text-white rounded-lg shadow-lg overflow-hidden ${
        isOpen ? 'w-48' : 'w-10'
      } transition-all duration-300`}>

        <div className="flex items-center">
          {/* Botão principal sempre visível */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-red-600 transition-colors flex-shrink-0"
            title="Debug de Autenticação"
          >
            🐛
          </button>

          {/* Botões expandidos */}
          {isOpen && (
            <div className="flex space-x-1 px-1">
              <button
                onClick={handleCleanAndReload}
                className="bg-white text-red-500 text-xs px-2 py-1 rounded hover:bg-gray-100 transition-colors flex items-center"
                title="Limpar Autenticação"
              >
                🧹 Limpar
              </button>
              <button
                onClick={handleDebug}
                className="bg-white text-red-500 text-xs px-2 py-1 rounded hover:bg-gray-100 transition-colors flex items-center"
                title="Ver Debug"
              >
                🔍 Debug
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
