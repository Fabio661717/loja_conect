// src/components/client/NotificationModal.tsx
import React, { useEffect, useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../hooks/useAuth';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: {
    title: string;
    message: string;
    type: string;
    data?: any;
  };
  onAction?: (action: string, data?: any) => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notification,
  onAction
}) => {
  const { theme } = useSettings();
  useAuth(); // ✅ Mantém o hook ativo (ex. controle global), mas sem desestruturar user

  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Mostrar ações após um breve delay
      const timer = setTimeout(() => setShowActions(true), 500);
      return () => clearTimeout(timer);
    } else {
      setShowActions(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ✅ Configurações visuais baseadas no tipo da notificação
  const getNotificationConfig = () => {
    switch (notification.type) {
      case 'novo_produto':
        return {
          icon: '🆕',
          color: 'bg-blue-500',
          textColor: 'text-blue-600',
          borderColor: 'border-blue-200',
          actionText: 'Ver Produtos'
        };
      case 'promocao':
        return {
          icon: '🔥',
          color: 'bg-red-500',
          textColor: 'text-red-600',
          borderColor: 'border-red-200',
          actionText: 'Ver Promoções'
        };
      case 'reserva':
        return {
          icon: '⏰',
          color: 'bg-green-500',
          textColor: 'text-green-600',
          borderColor: 'border-green-200',
          actionText: 'Minhas Reservas'
        };
      case 'estoque':
        return {
          icon: '📦',
          color: 'bg-purple-500',
          textColor: 'text-purple-600',
          borderColor: 'border-purple-200',
          actionText: 'Ver Produto'
        };
      case 'lembrete':
        return {
          icon: '🔔',
          color: 'bg-yellow-500',
          textColor: 'text-yellow-600',
          borderColor: 'border-yellow-200',
          actionText: 'Visualizar'
        };
      default:
        return {
          icon: '🔔',
          color: 'bg-gray-500',
          textColor: 'text-gray-600',
          borderColor: 'border-gray-200',
          actionText: 'Ver Detalhes'
        };
    }
  };

  const config = getNotificationConfig();

  // ✅ Lida com ação principal (ex: abrir página)
  const handlePrimaryAction = () => {
    if (onAction) {
      onAction('primary', notification.data);
    }
    onClose();
  };

  // ✅ Lida com fechamento da notificação
  const handleClose = () => {
    if (onAction) {
      onAction('dismiss');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-0">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md transform rounded-2xl p-6 shadow-2xl transition-all
          ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}
          ${showActions ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
      >
        {/* Header com Ícone */}
        <div className="flex items-center space-x-4 mb-4">
          <div
            className={`flex-shrink-0 w-12 h-12 ${config.color} rounded-full flex items-center justify-center text-white text-xl`}
          >
            {config.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold">{notification.title}</h3>
            <p
              className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              } mt-1`}
            >
              {new Date().toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* Mensagem */}
        <div className="mb-6">
          <p className="text-base leading-relaxed">{notification.message}</p>
        </div>

        {/* Dados adicionais */}
        {notification.data && (
          <div
            className={`mb-6 p-3 rounded-lg border ${config.borderColor} ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
            }`}
          >
            {notification.data.product_name && (
              <p className="text-sm font-medium">
                🛍️ {notification.data.product_name}
              </p>
            )}
            {notification.data.original_price && notification.data.promotion_price && (
              <div className="flex justify-between text-sm mt-2">
                <span className="line-through text-gray-500">
                  R$ {notification.data.original_price}
                </span>
                <span className="font-bold text-green-600">
                  R$ {notification.data.promotion_price}
                </span>
              </div>
            )}
            {notification.data.expiration && (
              <p className="text-xs text-orange-600 mt-2">
                ⏰ Válido até:{' '}
                {new Date(notification.data.expiration).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex space-x-3">
          <button
            onClick={handleClose}
            className={`
              flex-1 py-3 px-4 rounded-lg font-medium transition-all
              ${theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}
            `}
          >
            Fechar
          </button>

          <button
            onClick={handlePrimaryAction}
            className={`
              flex-1 py-3 px-4 rounded-lg font-medium text-white transition-all
              ${config.color} hover:opacity-90
            `}
          >
            {config.actionText}
          </button>
        </div>

        {/* Rodapé informativo */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            🔔 Notificações em tempo real • 📱 Clique para ação
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
