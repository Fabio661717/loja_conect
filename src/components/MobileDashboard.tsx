// MobileDashboard.tsx - VERSÃO CORRIGIDA PARA TYPESCRIPT
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../hooks/useAuth';
import QRCodeScanner from './QRScanner/QRScanner';

const MobileDashboard = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { theme } = useSettings(); // ✅ Mantido e agora usado
  const [currentView, setCurrentView] = useState<string>('dashboard');

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  const handleQRScanner = () => {
    setCurrentView('scanner');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // ✅ Exibe o scanner se o usuário selecionar
  if (currentView === 'scanner') {
    return <QRCodeScanner />;
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold">Ilizada.netlify.app</h1>
          <div className="flex items-center space-x-3">
            <span className="text-sm">Olá, {user?.nome || 'Fábio'}</span>
            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1 rounded-full border border-white/30 transition-all"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => handleNavigation('/cliente/dashboard')}
          className="flex-1 text-center py-3 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-medium"
        >
          Início
        </button>
        <button
          onClick={() => handleNavigation('/cliente/produtos')}
          className="flex-1 text-center py-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Produtos
        </button>
        <button
          onClick={() => handleNavigation('/cliente/funcionarios')}
          className="flex-1 text-center py-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Atendentes
        </button>
      </nav>

      {/* Main Content */}
      <main className="p-4 space-y-6">
        {/* Welcome Section */}
        <section>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Bem-vindo ao App Cliente
          </h1>

          {/* Notification Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg">
            <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-3">
              Notificações ativas
            </h3>
            <div className="space-y-2 text-gray-600 dark:text-gray-300">
              <p className="text-sm">QR Codes, reserve produtos</p>
              <p className="text-sm">Notificações personalizadas</p>
            </div>
          </div>
        </section>

        {/* QR Code Section */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Ler QR Code
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
            Use o QR Code da loja para produtos e fazer reservas
          </p>

          <button
            onClick={handleQRScanner}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 px-6 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <span>📷</span>
            <span>Ler QR Code →</span>
          </button>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleNavigation('/cliente/produtos')}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg text-center hover:shadow-xl transition-all"
          >
            <div className="text-2xl mb-2">🛍️</div>
            <p className="font-medium text-sm">Ver Produtos</p>
          </button>

          <button
            onClick={() => handleNavigation('/cliente/reservas')}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg text-center hover:shadow-xl transition-all"
          >
            <div className="text-2xl mb-2">📋</div>
            <p className="font-medium text-sm">Minhas Reservas</p>
          </button>
        </section>
      </main>
    </div>
  );
};

export default MobileDashboard;
