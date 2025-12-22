// NotificationContextLtx.tsx
import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { UINotification, UserNotification } from '../types/notification';

interface NotificationContextType {
  notifications: UserNotification[];
  uiNotifications: UINotification[];
  addNotification: (notification: Omit<UserNotification, 'id' | 'created_at' | 'is_read'>) => void;
  addUINotification: (notification: Omit<UINotification, 'id'>) => void;
  removeNotification: (id: string) => void;
  removeUINotification: (id: number) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [uiNotifications, setUiNotifications] = useState<UINotification[]>([]);

  // Adicionar notificação do usuário
  const addNotification = useCallback((notification: Omit<UserNotification, 'id' | 'created_at' | 'is_read'>) => {
    const newNotification: UserNotification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      is_read: false
    };

    setNotifications(prev => [...prev, newNotification]);
  }, []);

  // Adicionar notificação UI (toast)
  const addUINotification = useCallback((notification: Omit<UINotification, 'id'>) => {
    const newUINotification: UINotification = {
      ...notification,
      id: Date.now()
    };

    setUiNotifications(prev => [...prev, newUINotification]);

    // Auto-remove após 5 segundos
    setTimeout(() => {
      setUiNotifications(prev => prev.filter(n => n.id !== newUINotification.id));
    }, 5000);
  }, []);

  // Remover notificação do usuário
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Remover notificação UI
  const removeUINotification = useCallback((id: number) => {
    setUiNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Marcar como lida
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, is_read: true } : notification
      )
    );
  }, []);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, is_read: true }))
    );
  }, []);

  // Contador de não lidas
  const unreadCount = notifications.filter(notification => !notification.is_read).length;

  const value: NotificationContextType = {
    notifications,
    uiNotifications,
    addNotification,
    addUINotification,
    removeNotification,
    removeUINotification,
    markAsRead,
    markAllAsRead,
    unreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
