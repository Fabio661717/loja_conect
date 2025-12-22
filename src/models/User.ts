import { supabase } from '../services/supabase';

export interface User {
  id: string;
  email: string;
  preferred_categories?: string[];
  lojaId?: string;
  created_at: string;
}

export const userModel = {
  // Buscar usuário por ID
  async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }
    return data;
  },

  // Atualizar categorias preferidas do usuário
  async updatePreferredCategories(userId: string, categories: string[]): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .update({
        preferred_categories: categories,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Erro ao atualizar categorias preferidas:', error);
      return false;
    }
    return true;
  },

  // Buscar categorias preferidas do usuário
  async getPreferredCategories(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('users')
      .select('preferred_categories')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('Erro ao buscar categorias preferidas:', error);
      return [];
    }
    return data.preferred_categories || [];
  }
};
