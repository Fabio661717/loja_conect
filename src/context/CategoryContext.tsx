// src/context/CategoryContext.tsx - CONTEXTO CORRIGIDO
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { categoryService } from "../services/categoryService";
import { NotificationCategory, ProductCategory } from "../types/notification";

interface CategoryContextType {
  // 📂 Categorias da Loja
  storeCategories: ProductCategory[];
  loadingStoreCategories: boolean;
  error: string | null;

  // 🔔 Categorias de Notificação
  notificationCategories: NotificationCategory[];
  loadingNotificationCategories: boolean;

  // 🛠️ Ações
  createStoreCategory: (nome: string, descricao?: string) => Promise<void>;
  updateStoreCategory: (id: string, updates: Partial<ProductCategory>) => Promise<void>;
  deleteStoreCategory: (id: string) => Promise<void>;
  refreshStoreCategories: () => Promise<void>;
  refreshNotificationCategories: () => Promise<void>;

  // 🔄 Sincronização
  syncCategories: () => Promise<void>;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export function CategoryProvider({ children }: { children: ReactNode }) {
  const { user, getCorrectLojaId } = useAuth();
  const [storeCategories, setStoreCategories] = useState<ProductCategory[]>([]);
  const [notificationCategories, setNotificationCategories] = useState<NotificationCategory[]>([]);
  const [loadingStoreCategories, setLoadingStoreCategories] = useState(true);
  const [loadingNotificationCategories, setLoadingNotificationCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔄 Buscar categorias da loja
  const refreshStoreCategories = async () => {
    if (!user || user.type !== 'loja') return;

    setLoadingStoreCategories(true);
    setError(null);

    try {
      const lojaId = getCorrectLojaId();
      if (!lojaId) {
        console.warn('⚠️ ID da loja não encontrado');
        setStoreCategories([]);
        return;
      }

      const categories = await categoryService.getStoreCategories(lojaId);
      setStoreCategories(categories);
    } catch (err) {
      console.error('❌ Erro ao carregar categorias da loja:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar categorias');
      setStoreCategories([]);
    } finally {
      setLoadingStoreCategories(false);
    }
  };

  // 🔄 Buscar categorias de notificação (CORRIGIDO)
  const refreshNotificationCategories = async () => {
    setLoadingNotificationCategories(true);

    try {
      // ✅ CORREÇÃO: Usar função específica para cada tipo de usuário
      let categories: NotificationCategory[] = [];

      if (user?.type === 'loja') {
        const lojaId = getCorrectLojaId();
        categories = await categoryService.getCategoriesForUser('loja', lojaId);
      } else {
        // Para clientes, buscar categorias globais + da loja atual se disponível
        const currentStoreId = localStorage.getItem('storeId');
        categories = await categoryService.getCategoriesForUser('cliente', currentStoreId);
      }

      setNotificationCategories(categories);
    } catch (err) {
      console.error('❌ Erro ao carregar categorias de notificação:', err);
      setNotificationCategories([]);
    } finally {
      setLoadingNotificationCategories(false);
    }
  };

  // ➕ Criar categoria na loja
  const createStoreCategory = async (nome: string, descricao?: string) => {
    if (!user || user.type !== 'loja') throw new Error('Apenas lojas podem criar categorias');

    setError(null);
    try {
      const lojaId = getCorrectLojaId();
      if (!lojaId) throw new Error('ID da loja não encontrado');

      await categoryService.createStoreCategory(lojaId, { nome, descricao });
      await refreshStoreCategories();
      await syncCategories(); // Sincronizar com notificações
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar categoria';
      setError(errorMessage);
      throw err;
    }
  };

  // ✏️ Atualizar categoria
  const updateStoreCategory = async (id: string, updates: Partial<ProductCategory>) => {
    // Implementação simplificada - você pode expandir conforme necessário
    console.log('Atualizar categoria:', id, updates);
    await refreshStoreCategories();
  };

  // 🗑️ Excluir categoria
  const deleteStoreCategory = async (id: string) => {
    // Implementação simplificada - você pode expandir conforme necessário
    console.log('Excluir categoria:', id);
    await refreshStoreCategories();
  };

  // 🔄 Sincronizar categorias da loja com sistema de notificações
  const syncCategories = async () => {
    if (user?.type === 'loja') {
      try {
        const lojaId = getCorrectLojaId();
        if (lojaId) {
          await categoryService.syncStoreCategoriesWithNotifications(lojaId);
          await refreshNotificationCategories();
        }
      } catch (error) {
        console.error('❌ Erro ao sincronizar categorias:', error);
      }
    }
  };

  // 📥 Efeitos iniciais
  useEffect(() => {
    if (user) {
      refreshStoreCategories();
      refreshNotificationCategories();
    }
  }, [user]);

  // 🔄 Sincronizar automaticamente quando categorias da loja mudam
  useEffect(() => {
    if (storeCategories.length > 0 && user?.type === 'loja') {
      syncCategories();
    }
  }, [storeCategories]);

  const value: CategoryContextType = {
    storeCategories,
    loadingStoreCategories,
    error,
    notificationCategories,
    loadingNotificationCategories,
    createStoreCategory,
    updateStoreCategory,
    deleteStoreCategory,
    refreshStoreCategories,
    refreshNotificationCategories,
    syncCategories
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategory() {
  const ctx = useContext(CategoryContext);
  if (!ctx) {
    throw new Error("useCategory deve ser usado dentro de CategoryProvider");
  }
  return ctx;
}
