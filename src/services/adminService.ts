// 📄 src/services/adminService.ts - NOVO ARQUIVO
import { supabase } from './supabase';

export interface StoreData {
  nome: string;
  owner_id: string;
  owner_email: string;
  endereco?: string;
  telefone?: string;
}

export const adminService = {
  // ✅ APENAS para criar lojas - não cria usuários clientes
  createStore: async (storeData: StoreData) => {
    const { data, error } = await supabase
      .from('lojas')
      .insert([storeData])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  updateStore: async (storeId: string, updates: Partial<StoreData>) => {
    const { data, error } = await supabase
      .from('lojas')
      .update(updates)
      .eq('id', storeId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  getStore: async (storeId: string) => {
    const { data, error } = await supabase
      .from('lojas')
      .select('*')
      .eq('id', storeId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Gerenciamento de produtos
  createProduct: async (productData: any) => {
    const { data, error } = await supabase
      .from('produtos')
      .insert([productData])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  getStoreProducts: async (storeId: string) => {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('loja_id', storeId);

    if (error) throw new Error(error.message);
    return data || [];
  }
};
