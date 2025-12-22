// src/components/layout/StoreLayout.tsx
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login-loja');
  };

  const menuItems = [
    { path: '/loja/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/loja/produtos', label: 'Produtos', icon: '📦' },
    { path: '/loja/reservas', label: 'Reservas', icon: '🛒' },
    { path: '/loja/funcionarios', label: 'Funcionários', icon: '👥' },
    { path: '/loja/timer', label: 'Tempo de Espera', icon: '⏰' },
    { path: '/loja/qrcode', label: 'QR Code', icon: '🔲' },
    // ✅ NOVA FUNCIONALIDADE ADICIONADA:
    { path: '/loja/promocoes', label: 'Promoções', icon: '🔥' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b">
          <h1 className={`font-bold ${sidebarOpen ? 'text-xl' : 'text-sm'} text-gray-800`}>
            {sidebarOpen ? 'Painel da Loja' : 'PL'}
          </h1>
        </div>

        <nav className="flex-1 p-4">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center p-3 mb-2 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {sidebarOpen && <span className="ml-3 font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <span>{sidebarOpen ? '◀️' : '▶️'}</span>
            {sidebarOpen && <span className="ml-3">Recolher</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex justify-between items-center px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </h1>
              <p className="text-sm text-gray-600">Bem-vindo, {user?.email}</p>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
