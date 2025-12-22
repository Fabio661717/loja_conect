// src/hooks/UserMenu.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

const UserMenu: React.FC = () => {
  const { unreadCount } = useNotifications();

  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
        <div className="indicator">
          {/* Ícone de sino para notificações */}
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-5 5v-5zM10.24 8.56a5.97 5.97 0 01-4.66-7.4 1 1 0 00-1.2-1.2 7.97 7.97 0 00-5.25 11.67 1 1 0 001.2 1.2 5.97 5.97 0 014.66-7.4zm9.52 0a5.97 5.97 0 014.66 7.4 1 1 0 001.2-1.2 7.97 7.97 0 00-5.25-11.67 1 1 0 00-1.2 1.2 5.97 5.97 0 014.66 7.4z"
            />
          </svg>

          {/* Badge com contagem de não lidas */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 badge badge-xs badge-primary indicator-item">
              {unreadCount}
            </span>
          )}
        </div>
      </label>

      {/* Dropdown Menu */}
      <ul
        tabIndex={0}
        className="mt-3 p-2 shadow menu menu-compact dropdown-content bg-base-100 rounded-box w-52"
      >
        {/* Item de Notificações */}
        <li>
          <Link
            to="/configuracoes/notificacoes"
            className="flex items-center justify-between py-2 px-3 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🔔</span>
              <div>
                <div className="font-medium">Notificações</div>
                <div className="text-xs text-gray-500">Preferências e alertas</div>
              </div>
            </div>

            {/* Badge no menu */}
            {unreadCount > 0 && (
              <span className="badge badge-primary badge-sm min-w-[20px] flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>
        </li>

        {/* Separador */}
        <div className="divider my-1"></div>

        {/* Outros itens do menu */}
        <li>
          <Link
            to="/cliente/perfil"
            className="flex items-center gap-3 py-2 px-3 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-lg">👤</span>
            <span>Meu Perfil</span>
          </Link>
        </li>

        <li>
          <Link
            to="/cliente/reservas"
            className="flex items-center gap-3 py-2 px-3 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-lg">📋</span>
            <span>Minhas Reservas</span>
          </Link>
        </li>

        <li>
          <Link
            to="/cliente/favoritos"
            className="flex items-center gap-3 py-2 px-3 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-lg">❤️</span>
            <span>Favoritos</span>
          </Link>
        </li>

        {/* Separador */}
        <div className="divider my-1"></div>

        <li>
          <Link
            to="/configuracoes"
            className="flex items-center gap-3 py-2 px-3 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-lg">⚙️</span>
            <span>Configurações</span>
          </Link>
        </li>

        <li>
          <button
            onClick={() => {
              // Aqui você adicionaria a lógica de logout
              console.log('Logout clicked');
            }}
            className="flex items-center gap-3 py-2 px-3 hover:bg-gray-100 rounded-lg transition-colors text-red-600"
          >
            <span className="text-lg">🚪</span>
            <span>Sair</span>
          </button>
        </li>
      </ul>
    </div>
  );
};

export default UserMenu;
