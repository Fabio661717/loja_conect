import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { promotionService } from '../services/promotionService';
import { Promotion } from '../types/Promotion'; // ✅ Tipo único e correto

// 🔹 Tipagem do contexto
interface PromotionContextType {
  promotions: Promotion[];
  activePromotions: Promotion[];
  loading: boolean;
  error: string | null;
  createPromotion: (promotionData: any) => Promise<void>;
  updatePromotion: (promotionId: string, updates: any) => Promise<void>;
  deactivatePromotion: (promotionId: string) => Promise<void>;
  searchProducts: (searchTerm: string) => Promise<any[]>;
  refreshPromotions: () => Promise<void>;
}

// 🔹 Criação do contexto
const PromotionContext = createContext<PromotionContextType | undefined>(undefined);

export const PromotionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [activePromotions, setActivePromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🟩 Buscar promoções da loja
  const refreshPromotions = async () => {
    if (!user?.lojaId) return;

    setLoading(true);
    setError(null);

    try {
      const [allPromotions, activePromos] = await Promise.all([
        promotionService.getAllPromotions(user.lojaId),
        promotionService.getActivePromotions(user.lojaId),
      ]);

      setPromotions(allPromotions);
      setActivePromotions(activePromos);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao carregar promoções:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🟨 Criar nova promoção
  const createPromotion = async (promotionData: any) => {
    if (!user?.lojaId) throw new Error('Loja não identificada');

    setLoading(true);
    setError(null);

    try {
      await promotionService.createPromotion(user.lojaId, promotionData);
      await refreshPromotions();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🟦 Atualizar promoção existente
  const updatePromotion = async (promotionId: string, updates: any) => {
    setLoading(true);
    setError(null);

    try {
      await promotionService.updatePromotion(promotionId, updates);
      await refreshPromotions();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🟥 Desativar promoção
  const deactivatePromotion = async (promotionId: string) => {
    setLoading(true);
    setError(null);

    try {
      await promotionService.deactivatePromotion(promotionId);
      await refreshPromotions();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🟪 Buscar produtos disponíveis para promoção
  const searchProducts = async (searchTerm: string): Promise<any[]> => {
    if (!user?.lojaId) return [];

    try {
      return await promotionService.searchProductsForPromotion(user.lojaId, searchTerm);
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  };

  // 🟫 Atualiza promoções automaticamente quando o usuário da loja muda
  useEffect(() => {
    if (user?.lojaId) {
      refreshPromotions();
    }
  }, [user?.lojaId]);

  // 🔹 Valor do contexto
  const value: PromotionContextType = {
    promotions,
    activePromotions,
    loading,
    error,
    createPromotion,
    updatePromotion,
    deactivatePromotion,
    searchProducts,
    refreshPromotions,
  };

  return <PromotionContext.Provider value={value}>{children}</PromotionContext.Provider>;
};

// 🔹 Hook para acessar o contexto
export const usePromotion = () => {
  const context = useContext(PromotionContext);
  if (!context) {
    throw new Error('usePromotion deve ser usado dentro de um PromotionProvider');
  }
  return context;
};

