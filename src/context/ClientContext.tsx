// 📄 src/contexts/ClientContext.tsx - NOVO ARQUIVO
import React, { createContext, ReactNode, useContext } from 'react';
import { useAuth, User } from '../hooks/useAuth';
import { ClientData, clientService } from '../services/clientService';

interface ClientContextType {
  user: User | null;
  loading: boolean;
  clientData: any | null;
  updateClient: (updates: Partial<ClientData>) => Promise<any>;
  signOut: () => Promise<void>;
  getSelectedEmployee: () => Promise<string | null>;
  setSelectedEmployee: (employeeId: string | null) => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    user,
    loading,
    signOut: authSignOut,
    getSelectedEmployee: authGetSelectedEmployee,
    setSelectedEmployee: authSetSelectedEmployee
  } = useAuth();
  const [clientData, setClientData] = React.useState<any>(null);

  const updateClient = async (updates: Partial<ClientData>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const client = await clientService.updateClient(user.id, updates);
    setClientData(client);
    return client;
  };

  const signOut = async () => {
    setClientData(null);
    await authSignOut();
  };

  React.useEffect(() => {
    const loadClientData = async () => {
      if (user?.type === 'cliente') {
        try {
          const client = await clientService.getClient(user.id);
          setClientData(client);
        } catch (error) {
          console.error('Erro ao carregar dados do cliente:', error);
        }
      }
    };

    loadClientData();
  }, [user?.id, user?.type]);

  const value: ClientContextType = {
    user,
    loading,
    clientData,
    updateClient,
    signOut,
    getSelectedEmployee: authGetSelectedEmployee,
    setSelectedEmployee: authSetSelectedEmployee
  };

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClient = () => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
};
