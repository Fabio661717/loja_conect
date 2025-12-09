import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSupabase } from '../hooks/useSupabase';

interface StoreContextType {
  currentStore: any | null;
  loading: boolean;
  error: string | null;
  setCurrentStore: (store: any) => void;
  refreshStore: () => Promise<void>;
  getValidStoreId: () => string | null;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [currentStore, setCurrentStore] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { getStoreByOwner } = useSupabase();

  const refreshStore = async () => {
    if (!user) {
      setCurrentStore(null);
      setLoading(false);
      setError('Usuário não autenticado');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Buscando loja do usuário...');
      const store = await getStoreByOwner();

      if (store) {
        setCurrentStore(store);
        // ✅ SALVAR NO LOCALSTORAGE PARA CONTEXTO
        localStorage.setItem('current-store-id', store.id);
        localStorage.setItem('currentStore', JSON.stringify(store));
        console.log('✅ Loja carregada e salva no contexto:', store.id);
      } else {
        setCurrentStore(null);
        setError('Nenhuma loja encontrada para este usuário');
        console.warn('⚠️ Nenhuma loja encontrada para o usuário');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar loja:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      setCurrentStore(null);
    } finally {
      setLoading(false);
    }
  };

  const getValidStoreId = (): string | null => {
    if (currentStore?.id) {
      return currentStore.id;
    }

    // Tentar obter do localStorage
    const storedId = localStorage.getItem('current-store-id');
    if (storedId) {
      return storedId;
    }

    return null;
  };

  useEffect(() => {
    refreshStore();
  }, [user]);

  // ✅ LIMPAR DADOS AO DESMONTAR
  useEffect(() => {
    return () => {
      // Manter dados no localStorage para contexto
    };
  }, []);

  return (
    <StoreContext.Provider
      value={{
        currentStore,
        loading,
        error,
        setCurrentStore,
        refreshStore,
        getValidStoreId,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore deve ser usado dentro de um StoreProvider');
  }
  return context;
}
