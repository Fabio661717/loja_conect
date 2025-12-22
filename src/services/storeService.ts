import { UUIDValidator } from '../utils/uuidValidator';
import { supabase } from './supabase';

export const storeService = {
  async getStoreById(storeId: string) {
    try {
      const normalizedStoreId = UUIDValidator.normalizeStoreId(storeId);

      if (!normalizedStoreId) {
        throw new Error('ID da loja inválido');
      }

      const { data, error } = await supabase
        .from('lojas')
        .select('*')
        .eq('id', normalizedStoreId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar loja:', error);
      throw error;
    }
  },

  async validateStoreAccess(storeId: string, userId: string) {
    try {
      const normalizedStoreId = UUIDValidator.normalizeStoreId(storeId);

      if (!normalizedStoreId) {
        return { isValid: false, error: 'ID da loja inválido' };
      }

      const { data, error } = await supabase
        .from('lojas')
        .select('owner_id')
        .eq('id', normalizedStoreId)
        .single();

      if (error) {
        return { isValid: false, error: 'Loja não encontrada' };
      }

      if (data.owner_id !== userId) {
        return { isValid: false, error: 'Acesso não autorizado' };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Erro na validação' };
    }
  },

  async createDefaultStore(userId: string) {
    try {
      const { data, error } = await supabase
        .from('lojas')
        .insert([
          {
            owner_id: userId,
            nome: 'Minha Loja',
            email: '',
            wait_time: 6,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar loja padrão:', error);
      throw error;
    }
  }
};
