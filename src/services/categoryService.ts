// src/services/categoryService.ts - VERSÃO ATUALIZADA E LIMPA
import { NotificationCategory, ProductCategory, UserNotificationPreference } from '../types/notification';
import { supabase } from './supabase';

export class CategoryService {

  // ✅ BUSCAR CATEGORIAS DA LOJA ESPECÍFICA
  async getStoreCategories(lojaId: string): Promise<ProductCategory[]> {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('loja_id', lojaId)
        .eq('is_active', true)
        .order('nome');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar categorias da loja:', error);
      throw error;
    }
  }

  // ✅ CRIAR CATEGORIA PARA A LOJA
  async createStoreCategory(lojaId: string, categoryData: { nome: string; descricao?: string }): Promise<ProductCategory> {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .insert({
          ...categoryData,
          loja_id: lojaId,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Erro ao criar categoria:', error);
      throw error;
    }
  }

  // ✅ BUSCAR CATEGORIAS DE NOTIFICAÇÃO DISPONÍVEIS
  async getActiveCategories(): Promise<NotificationCategory[]> {
    try {
      const { data, error } = await supabase
        .from('notification_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.warn('⚠️ Tabela notification_categories não encontrada, usando categorias padrão:', error.message);
        return this.getDefaultCategories();
      }

      if (!data || data.length === 0) {
        return this.getDefaultCategories();
      }

      // ✅ Converte null → undefined para evitar erro TS
      return data.map(cat => ({
        ...cat,
        loja_id: cat.loja_id ?? undefined,
        created_by: cat.created_by ?? undefined,
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar categorias:', error);
      return this.getDefaultCategories();
    }
  }

  // ✅ CATEGORIAS PADRÃO (FALLBACK)
  private getDefaultCategories(): NotificationCategory[] {
    const defaultCategories: NotificationCategory[] = [
      {
        id: 'promocoes',
        name: 'promocoes',
        description: 'Receba notificações sobre promoções e ofertas especiais',
        is_active: true,
        created_by: undefined,
        created_at: new Date().toISOString(),
        loja_id: undefined
      },
      {
        id: 'novos_produtos',
        name: 'novos_produtos',
        description: 'Seja notificado sobre novos produtos disponíveis',
        is_active: true,
        created_by: undefined,
        created_at: new Date().toISOString(),
        loja_id: undefined
      },
      {
        id: 'reservas',
        name: 'reservas',
        description: 'Notificações sobre suas reservas e prazos',
        is_active: true,
        created_by: undefined,
        created_at: new Date().toISOString(),
        loja_id: undefined
      },
      {
        id: 'estoque',
        name: 'estoque',
        description: 'Alertas sobre produtos em estoque que você pode gostar',
        is_active: true,
        created_by: undefined,
        created_at: new Date().toISOString(),
        loja_id: undefined
      }
    ];

    return defaultCategories;
  }

  // ✅ BUSCAR PREFERÊNCIAS DO USUÁRIO
  async getUserPreferences(userId: string): Promise<UserNotificationPreference[]> {
    try {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select(`
          *,
          category:notification_categories(*)
        `)
        .eq('user_id', userId);

      if (error) {
        console.warn('⚠️ Tabela user_notification_preferences não encontrada:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar preferências:', error);
      return [];
    }
  }

  // ✅ ATUALIZAR PREFERÊNCIA DO USUÁRIO
  async updateUserPreference(
    userId: string,
    categoryId: string,
    enabled: boolean
  ): Promise<UserNotificationPreference | null> {
    try {
      const { data: existing } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('category_id', categoryId)
        .single();

      if (existing) {
        const { data, error } = await supabase
          .from('user_notification_preferences')
          .update({ is_enabled: enabled })
          .eq('id', existing.id)
          .select(`
            *,
            category:notification_categories(*)
          `)
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('user_notification_preferences')
          .insert({
            user_id: userId,
            category_id: categoryId,
            is_enabled: enabled,
          })
          .select(`
            *,
            category:notification_categories(*)
          `)
          .single();

        if (error) {
          console.warn('⚠️ Não foi possível criar preferência, usando fallback:', error.message);
          return this.createFallbackPreference(userId, categoryId, enabled);
        }
        return data;
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar preferência:', error);
      return this.createFallbackPreference(userId, categoryId, enabled);
    }
  }

  // ✅ PREFERÊNCIA DE FALLBACK
  private createFallbackPreference(
    userId: string,
    categoryId: string,
    enabled: boolean
  ): UserNotificationPreference {
    const category = this.getDefaultCategories().find(cat => cat.id === categoryId) ||
      this.getDefaultCategories()[0];

    return {
      id: `fallback-${categoryId}-${userId}`,
      user_id: userId,
      category_id: categoryId,
      is_enabled: enabled,
      created_at: new Date().toISOString(),
      category: category
    };
  }

  // ✅ INICIALIZAR PREFERÊNCIAS PADRÃO PARA USUÁRIO
  async initializeUserPreferences(userId: string): Promise<UserNotificationPreference[]> {
    try {
      const categories = await this.getActiveCategories();
      const preferences: UserNotificationPreference[] = [];

      for (const category of categories) {
        try {
          const preference = await this.updateUserPreference(userId, category.id, true);
          if (preference) {
            preferences.push(preference);
          }
        } catch (error) {
          console.warn(`⚠️ Não foi possível inicializar preferência para ${category.name}:`, error);
          preferences.push(this.createFallbackPreference(userId, category.id, true));
        }
      }

      return preferences;
    } catch (error) {
      console.error('❌ Erro ao inicializar preferências:', error);
      return this.getDefaultCategories().map(category =>
        this.createFallbackPreference(userId, category.id, true)
      );
    }
  }

  // ✅ SINCRONIZAR CATEGORIAS DA LOJA COM NOTIFICAÇÕES (ATUALIZADO)
  async syncStoreCategoriesWithNotifications(lojaId: string): Promise<void> {
    try {
      console.log('🔄 Sincronizando categorias da loja com notificações:', lojaId);

      // ✅ BUSCAR CATEGORIAS DA LOJA DA TABELA CORRETA
      const { data: storeCategories, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('loja_id', lojaId)
        .eq('is_active', true);

      if (error) {
        console.error('❌ Erro ao buscar categorias da loja:', error);
        return;
      }

      if (!storeCategories || storeCategories.length === 0) {
        console.log('⚠️ Nenhuma categoria encontrada para sincronizar');
        return;
      }

      console.log(`✅ Encontradas ${storeCategories.length} categorias para sincronizar`);

      // ✅ SINCRONIZAR CADA CATEGORIA
      for (const storeCategory of storeCategories) {
        await this.createNotificationCategoryFromStoreCategory(storeCategory);
      }

      console.log('✅ Categorias sincronizadas com notificações');
    } catch (error) {
      console.error('❌ Erro ao sincronizar categorias:', error);
    }
  }

  // ✅ CRIAR CATEGORIA DE NOTIFICAÇÃO A PARTIR DE CATEGORIA DA LOJA (ATUALIZADO)
  private async createNotificationCategoryFromStoreCategory(storeCategory: any): Promise<void> {
    try {
      // ✅ VERIFICAR SE JÁ EXISTE NA TABELA notification_categories
      const { data: existing } = await supabase
        .from('notification_categories')
        .select('id')
        .eq('loja_id', storeCategory.loja_id)
        .eq('name', storeCategory.nome.toLowerCase())
        .single();

      if (!existing) {
        const { error } = await supabase
          .from('notification_categories')
          .insert({
            name: storeCategory.nome.toLowerCase(),
            description: storeCategory.descricao || `Notificações sobre produtos da categoria ${storeCategory.nome}`,
            is_active: true,
            loja_id: storeCategory.loja_id,
            created_by: storeCategory.loja_id
          });

        if (error) {
          console.warn('⚠️ Não foi possível criar categoria de notificação:', error.message);
        } else {
          console.log(`✅ Categoria de notificação criada: ${storeCategory.nome}`);
        }
      } else {
        console.log(`✅ Categoria de notificação já existe: ${storeCategory.nome}`);
      }
    } catch (error) {
      console.error('❌ Erro ao criar categoria de notificação:', error);
    }
  }

  // ✅ BUSCAR CATEGORIAS POR TIPO DE USUÁRIO
  async getCategoriesForUser(userType: 'cliente' | 'loja', lojaId?: string | null): Promise<NotificationCategory[]> {
    if (userType === 'loja' && lojaId) {
      try {
        const { data, error } = await supabase
          .from('notification_categories')
          .select('*')
          .eq('is_active', true)
          .eq('loja_id', lojaId)
          .order('name');

        if (error || !data || data.length === 0) {
          return this.getDefaultCategories();
        }

        return data.map(cat => ({
          ...cat,
          loja_id: cat.loja_id ?? undefined,
          created_by: cat.created_by ?? undefined,
        }));
      } catch (error) {
        return this.getDefaultCategories();
      }
    } else {
      return this.getActiveCategories();
    }
  }

  // ✅ NOVO: BUSCAR CATEGORIAS PREFERIDAS DO USUÁRIO (PARA FILTRAR NOTIFICAÇÕES)
  async getUserPreferredCategories(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('preferred_categories')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('⚠️ Erro ao buscar categorias preferidas:', error.message);
        return [];
      }

      return data?.preferred_categories || [];
    } catch (error) {
      console.error('❌ Erro ao buscar categorias preferidas:', error);
      return [];
    }
  }

  // ✅ NOVO: ATUALIZAR CATEGORIAS PREFERIDAS DO USUÁRIO
  async updateUserPreferredCategories(userId: string, categoryIds: string[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          preferred_categories: categoryIds,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Erro ao atualizar categorias preferidas:', error);
        return false;
      }

      console.log(`✅ Categorias preferidas atualizadas para usuário ${userId}:`, categoryIds);
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar categorias preferidas:', error);
      return false;
    }
  }

  // ✅ NOVO: VERIFICAR SE DEVE ENVIAR NOTIFICAÇÃO BASEADO NAS PREFERÊNCIAS
  async shouldSendNotification(userId: string, category: string): Promise<boolean> {
    try {
      const preferredCategories = await this.getUserPreferredCategories(userId);

      // Se não tem preferências definidas, envia para todos (compatibilidade)
      if (!preferredCategories || preferredCategories.length === 0) {
        return true;
      }

      // Verificar se a categoria está nas preferências
      const shouldSend = preferredCategories.includes(category);

      if (!shouldSend) {
        console.log(`🔕 Notificação da categoria "${category}" filtrada - não está nas preferências do usuário ${userId}`);
      }

      return shouldSend;
    } catch (error) {
      console.warn('⚠️ Erro ao verificar preferências, enviando notificação:', error);
      return true; // Fallback: enviar em caso de erro
    }
  }
}

export const categoryService = new CategoryService();
