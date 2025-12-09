// src/types/Category.ts
export interface Category {
  id: string;
  name: string;
  description?: string;
  store_id?: string;
  store_name?: string;
  source?: 'store' | 'global';
  loja_id?: string;
  nome: string;
  descricao?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  source_type?: 'store' | 'global';
  created_by?: string | null;
  updated_by?: string | null;
  source_loja_id?: string | null;
  source_store_name?: string | null;
  source_store_id?: string | null;
  source_category_id?: string | null;
  source_category_name?: string | null;

}

// Função auxiliar para garantir compatibilidade
export const getCategoryName = (category: Category): string => {
  return category.nome || category.name || '';
};

export const getCategoryDescription = (category: Category): string => {
  return category.descricao || category.description || '';
};
