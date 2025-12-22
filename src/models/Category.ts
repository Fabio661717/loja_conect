import { supabase } from '../services/supabase';

export interface StoreCategory {
  id: string;
  name: string;
  description?: string;
  store_id: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

export const categoryModel = {
  // Buscar categorias de uma loja específica
  async getStoreCategories(storeId: string): Promise<StoreCategory[]> {
    const { data, error } = await supabase
      .from('store_categories')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Erro ao buscar categorias da loja:', error);
      return [];
    }
    return data || [];
  },

  // Buscar todas as categorias disponíveis (incluindo globais)
  async getAllCategories(): Promise<StoreCategory[]> {
    const { data, error } = await supabase
      .from('store_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Erro ao buscar todas as categorias:', error);
      return [];
    }
    return data || [];
  },

  // Criar nova categoria
  async createCategory(category: Omit<StoreCategory, 'id' | 'created_at'>): Promise<StoreCategory | null> {
    const { data, error } = await supabase
      .from('store_categories')
      .insert([category])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar categoria:', error);
      return null;
    }
    return data;
  }
};
