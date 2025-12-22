// src/components/DebugRouter.tsx
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function DebugRouter() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📍 Rota atual:', location.pathname);
      console.log('🔍 Search params:', location.search);
      console.log('🏠 State:', location.state);
      console.log('🔑 User no localStorage:', localStorage.getItem('user'));
    }
  }, [location]);

  // Em produção, não renderiza nada
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex flex-col gap-3 items-end">
        {/* Botão de navegação */}
        <button
          onClick={() => navigate(-1)}
          className="w-12 h-12 bg-gray-700 hover:bg-gray-800 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 border border-gray-600"
          title="Voltar para página anterior"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Botão de informações (opcional) */}
        <button
          onClick={() => {
            console.log('🔧 Debug Info:', {
              pathname: location.pathname,
              search: location.search,
              state: location.state,
              user: localStorage.getItem('user')
            });
          }}
          className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 text-xs font-medium"
          title="Informações de debug"
        >
          🔧
        </button>

        {/* Indicador visual da rota (discreto) */}
        <div className="bg-black/80 text-white text-xs px-3 py-2 rounded-lg max-w-xs truncate">
          📍 {location.pathname}
        </div>
      </div>
    </div>
  );
}
