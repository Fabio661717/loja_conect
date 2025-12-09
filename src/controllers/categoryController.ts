// src/controllers/categoryController.ts
import { supabase } from '../services/supabase';

export const categoryController = {
  // ✅ CORRIGIDO: Buscar categorias disponíveis para o usuário
  async getAvailableCategories(userId: string) {
    try {
      console.log('🔄 Buscando categorias disponíveis para usuário:', userId);

      // ✅ BUSCAR LOJA ATUAL DO LOCALSTORAGE (se o usuário escaneou um QR Code)
      const currentStoreId = localStorage.getItem('storeId');

      if (currentStoreId) {
        console.log('🔄 Buscando categorias da loja:', currentStoreId);

        // ✅ BUSCAR CATEGORIAS DIRETAMENTE DA TABELA categorias
        const { data, error } = await supabase
          .from('categorias')
          .select('*')
          .eq('loja_id', currentStoreId)
          .eq('is_active', true)
          .order('nome');

        if (!error && data && data.length > 0) {
          console.log('✅ Categorias da loja encontradas:', data.length);
          return data.map(cat => ({
            id: cat.id,
            name: cat.nome,
            description: cat.descricao || `Categoria ${cat.nome}`,
            source: 'store',
            store_id: cat.loja_id
          }));
        } else {
          console.warn('⚠️ Nenhuma categoria encontrada para a loja:', currentStoreId);
        }
      }

      // ✅ FALLBACK: Buscar categorias de notificação globais
      console.log('🔄 Buscando categorias de notificação globais');
      const { data: notificationCategories, error: notificationError } = await supabase
        .from('notification_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (!notificationError && notificationCategories && notificationCategories.length > 0) {
        console.log('✅ Categorias de notificação encontradas:', notificationCategories.length);
        return notificationCategories.map(cat => ({
          id: cat.id,
          name: cat.name,
          description: cat.description || `Categoria ${cat.name}`,
          source: 'notification',
          store_id: cat.loja_id
        }));
      }

      // ✅ FALLBACK FINAL: Categorias mock
      console.log('🔄 Usando categorias mock (fallback)');
      return [
        { id: 'blusa-feminina', name: 'Blusa Feminina', description: 'Blusas e camisas femininas' },
        { id: 'camisa-masculina', name: 'Camisa Masculina', description: 'Camisas masculinas' },
        { id: 'calcados', name: 'Calçados', description: 'Sapatos, tênis e sandálias' },
        { id: 'acessorios', name: 'Acessórios', description: 'Bolsas, cintos e acessórios' },
      ];
    } catch (error) {
      console.error('❌ Erro no controller de categorias:', error);
      // ✅ FALLBACK FINAL: Categorias mock
      return [
        { id: 'blusa-feminina', name: 'Blusa Feminina', description: 'Blusas e camisas femininas' },
        { id: 'camisa-masculina', name: 'Camisa Masculina', description: 'Camisas masculinas' },
        { id: 'calcados', name: 'Calçados', description: 'Sapatos, tênis e sandálias' },
        { id: 'acessorios', name: 'Acessórios', description: 'Bolsas, cintos e acessórios' },
      ];
    }
  },

  // ✅ ATUALIZAR CATEGORIAS PREFERIDAS DO USUÁRIO
  async updateUserPreferences(userId: string, categoryIds: string[]) {
    try {
      console.log('🔄 Atualizando preferências do usuário:', userId, categoryIds);

      let updateSuccess = false;

      // ✅ CORREÇÃO: Tentar tabela users primeiro
      try {
        const { error } = await supabase
          .from('users')
          .upsert({
            id: userId,
            preferred_categories: categoryIds,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (!error) {
          updateSuccess = true;
          console.log('✅ Preferências atualizadas na tabela users');
        }
      } catch (error) {
        console.warn('⚠️ Erro ao atualizar tabela users, tentando clientes...');
      }

      // ✅ Fallback para tabela clientes
      if (!updateSuccess) {
        try {
          const { error } = await supabase
            .from('clientes')
            .upsert({
              id: userId,
              preferred_categories: categoryIds,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            });

          if (!error) {
            updateSuccess = true;
            console.log('✅ Preferências atualizadas na tabela clientes');
          }
        } catch (error) {
          console.warn('⚠️ Erro ao atualizar tabela clientes também');
        }
      }

      // ✅ SEMPRE SALVAR NO LOCALSTORAGE
      localStorage.setItem('user_category_preferences', JSON.stringify(categoryIds));

      if (!updateSuccess) {
        throw new Error('Não foi possível atualizar preferências em nenhuma tabela');
      }

      return {
        success: true,
        message: 'Preferências atualizadas com sucesso',
        categories: categoryIds,

      };
    } catch (error) {
      console.error('❌ Erro ao atualizar preferências:', error);
      throw error;
    }
  },

  // ✅ BUSCAR PREFERÊNCIAS DO USUÁRIO
  async getUserPreferences(userId: string) {
    try {
      const availableCategories = await this.getAvailableCategories(userId);

      // ✅ Buscar categorias preferidas do usuário
      let preferredCategories: string[] = [];

      // Tentar tabela users primeiro
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('preferred_categories')
          .eq('id', userId)
          .single();

        if (userData?.preferred_categories) {
          preferredCategories = userData.preferred_categories;
        }
      } catch (error) {
        // Fallback para clientes
        try {
          const { data: clientData } = await supabase
            .from('clientes')
            .select('preferred_categories')
            .eq('id', userId)
            .single();

          if (clientData?.preferred_categories) {
            preferredCategories = clientData.preferred_categories;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao buscar preferências das tabelas');
        }
      }

      // Fallback para localStorage
      if (preferredCategories.length === 0) {
        const localPrefs = localStorage.getItem('user_category_preferences');
        preferredCategories = localPrefs ? JSON.parse(localPrefs) : [];
      }

      return {
        preferredCategories,
        availableCategories,
        hasStoreContext: !!availableCategories.find(cat => 'store_id' in cat && cat.store_id)
      };
    } catch (error) {
      console.error('❌ Erro ao buscar preferências:', error);
      throw error;
    }
  }
};
