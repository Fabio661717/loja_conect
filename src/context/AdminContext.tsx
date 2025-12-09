// 📄 src/contexts/AdminContext.tsx - NOVO ARQUIVO
import React, { createContext, ReactNode, useContext } from 'react';
import { useAuth, User } from '../hooks/useAuth';
import { adminService, StoreData } from '../services/adminService';

interface AdminContextType {
  user: User | null;
  loading: boolean;
  currentStore: any | null;
  createStore: (storeData: Omit<StoreData, 'owner_id' | 'owner_email'>) => Promise<any>;
  updateStore: (updates: Partial<StoreData>) => Promise<any>;
  signOut: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading, signOut: authSignOut } = useAuth();
  const [currentStore, setCurrentStore] = React.useState<any>(null);

  const createStore = async (storeData: Omit<StoreData, 'owner_id' | 'owner_email'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const completeStoreData: StoreData = {
      ...storeData,
      owner_id: user.id,
      owner_email: user.email || ''
    };

    const store = await adminService.createStore(completeStoreData);
    setCurrentStore(store);
    return store;
  };

  const updateStore = async (updates: Partial<StoreData>) => {
    if (!user?.lojaId) throw new Error('Loja não encontrada');

    const store = await adminService.updateStore(user.lojaId, updates);
    setCurrentStore(store);
    return store;
  };

  const signOut = async () => {
    setCurrentStore(null);
    await authSignOut();
  };

  React.useEffect(() => {
    const loadStoreData = async () => {
      if (user?.lojaId) {
        try {
          const store = await adminService.getStore(user.lojaId);
          setCurrentStore(store);
        } catch (error) {
          console.error('Erro ao carregar dados da loja:', error);
        }
      }
    };

    loadStoreData();
  }, [user?.lojaId]);

  const value: AdminContextType = {
    user,
    loading,
    currentStore,
    createStore,
    updateStore,
    signOut
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
