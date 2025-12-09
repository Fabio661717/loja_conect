// src/components/NotificationProvider.tsx
import React, { createContext, useContext, useEffect } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useAuth } from './AuthContext';

interface NotificationContextType {
    isSupported: boolean;
    isInitialized: boolean;
    currentCategory: string | null;
    loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const {
        isSupported,
        isInitialized,
        currentCategory,
        loading,
        checkExistingSubscription
    } = usePushNotifications();

    useEffect(() => {
        if (user?.id) {
            checkExistingSubscription(user.id);
        }
    }, [user?.id]);

    return (
        <NotificationContext.Provider
            value={{
                isSupported,
                isInitialized,
                currentCategory,
                loading
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotificationContext = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotificationContext deve ser usado dentro de NotificationProvider');
    }
    return context;
};
