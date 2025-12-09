// ✅ src/services/promotionService.ts - VERSÃO COMPLETA ATUALIZADA
import { CreatePromotionData, Promotion } from "../types/Promotion";
import { notificationService } from "./notificationService";
import { supabase } from "./supabase";

class PromotionService {
  // ✅ CRIAR PROMOÇÃO E NOTIFICAR - VERSÃO ATUALIZADA
  async createPromotion(lojaId: string, promotionData: CreatePromotionData): Promise<Promotion> {
    try {
      console.log("🔄 Criando promoção...", promotionData);

      // Validar dados
      if (!promotionData.product_id) {
        throw new Error("ID do produto é obrigatório");
      }

      // Calcular valor da parcela
      const valor_parcela = promotionData.parcelas > 1
        ? parseFloat((promotionData.preco_promocional / promotionData.parcelas).toFixed(2))
        : 0;

      // Preparar dados para inserção
      const insertData = {
        loja_id: lojaId,
        produto_id: promotionData.product_id,
        categoria_id: promotionData.categoria_id || null,
        preco_original: promotionData.preco_original,
        preco_promocional: promotionData.preco_promocional,
        parcelas: promotionData.parcelas,
        valor_parcela,
        data_inicio: promotionData.data_inicio,
        data_fim: promotionData.data_fim,
        descricao: promotionData.descricao || null,
        ativa: true,
      };

      // Inserir no banco
      const { data, error } = await supabase
        .from("promocoes")
        .insert(insertData)
        .select(`
          *,
          produto:produtos(id, nome, foto_url, descricao, categoria_id),
          categoria:categorias(id, nome)
        `)
        .single();

      if (error) {
        console.error("❌ Erro ao criar promoção:", error);
        throw error;
      }

      console.log("✅ Promoção criada com sucesso:", data);

      // ✅ ENVIAR NOTIFICAÇÃO SE SOLICITADO - VERSÃO ATUALIZADA
      if (promotionData.enviar_notificacao) {
        try {
          const desconto = Math.round(
            ((promotionData.preco_original - promotionData.preco_promocional) / promotionData.preco_original) * 100
          );

          await notificationService.notifyNewPromotion(
            data.produto?.nome || "Novo Produto",
            `${desconto}% OFF`
          );

          console.log("📢 Notificação de promoção enviada");
        } catch (notifyError) {
          console.warn("⚠️ Erro ao enviar notificação:", notifyError);
          // Não falha a criação da promoção se a notificação falhar
        }
      }

      return data as Promotion;

    } catch (error) {
      console.error("❌ Erro crítico ao criar promoção:", error);
      throw error;
    }
  }

  // ✅ BUSCAR PROMOÇÕES ATIVAS
  async getActivePromotions(lojaId: string): Promise<Promotion[]> {
    try {
      const { data, error } = await supabase
        .from("promocoes")
        .select(`
          *,
          produto:produtos(id, nome, foto_url, descricao, categoria_id),
          categoria:categorias(id, nome)
        `)
        .eq("loja_id", lojaId)
        .eq("ativa", true)
        .gte("data_fim", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Promotion[];
    } catch (error) {
      console.error("❌ Erro ao buscar promoções:", error);
      return [];
    }
  }

  // ✅ BUSCAR TODAS AS PROMOÇÕES
  async getAllPromotions(lojaId: string): Promise<Promotion[]> {
    try {
      const { data, error } = await supabase
        .from("promocoes")
        .select(`
          *,
          produto:produtos(id, nome, foto_url, descricao, categoria_id),
          categoria:categorias(id, nome)
        `)
        .eq("loja_id", lojaId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Promotion[];
    } catch (error) {
      console.error("❌ Erro ao buscar promoções:", error);
      return [];
    }
  }

  // ✅ DESATIVAR PROMOÇÃO
  async deactivatePromotion(promotionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("promocoes")
        .update({ ativa: false })
        .eq("id", promotionId);

      if (error) throw error;
      console.log("✅ Promoção desativada:", promotionId);
    } catch (error) {
      console.error("❌ Erro ao desativar promoção:", error);
      throw error;
    }
  }

  // ✅ BUSCAR PRODUTOS PARA PROMOÇÃO
  async searchProductsForPromotion(lojaId: string, searchTerm: string = "") {
    try {
      let query = supabase
        .from("produtos")
        .select("*")
        .eq("loja_id", lojaId)
        .eq("ativo", true)
        .order("nome");

      if (searchTerm) {
        query = query.ilike("nome", `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("❌ Erro ao buscar produtos:", error);
      return [];
    }
  }

  // ✅ ATUALIZAR PROMOÇÃO (FUNCIONALIDADE EXISTENTE MANTIDA)
  async updatePromotion(promotionId: string, updates: Partial<Promotion>) {
    try {
      // Preparar dados para o banco
      const dbUpdates: any = { ...updates };

      if (updates.preco_promocional && updates.parcelas) {
        dbUpdates.valor_parcela = parseFloat(
          (updates.preco_promocional / updates.parcelas).toFixed(2)
        );
      }

      const { data, error } = await supabase
        .from("promocoes")
        .update(dbUpdates)
        .eq("id", promotionId)
        .select(`
          *,
          produto:produtos(id, nome, foto_url, descricao, categoria_id),
          categoria:categorias(id, nome)
        `)
        .single();

      if (error) throw error;

      return data as Promotion;
    } catch (error) {
      console.error("❌ Erro ao atualizar promoção:", error);
      throw error;
    }
  }

  // ✅ ATIVAR PROMOÇÃO (FUNCIONALIDADE EXISTENTE MANTIDA)
  async activatePromotion(promotionId: string) {
    try {
      const { error } = await supabase
        .from("promocoes")
        .update({ ativa: true })
        .eq("id", promotionId);

      if (error) throw error;
    } catch (error) {
      console.error("❌ Erro ao ativar promoção:", error);
      throw error;
    }
  }

  // ✅ BUSCAR PROMOÇÃO POR ID (FUNCIONALIDADE EXISTENTE MANTIDA)
  async getPromotionById(promotionId: string): Promise<Promotion | null> {
    try {
      const { data, error } = await supabase
        .from("promocoes")
        .select(`
          *,
          produto:produtos(id, nome, foto_url, descricao, categoria_id),
          categoria:categorias(id, nome)
        `)
        .eq("id", promotionId)
        .single();

      if (error) {
        console.error("Erro ao buscar promoção:", error);
        return null;
      }

      return data as Promotion;
    } catch (error) {
      console.error("❌ Erro ao buscar promoção por ID:", error);
      return null;
    }
  }

  // ✅ BUSCAR PROMOÇÕES POR CATEGORIA (FUNCIONALIDADE EXISTENTE MANTIDA)
  async getPromotionsByCategory(lojaId: string, categoriaId: string): Promise<Promotion[]> {
    try {
      const { data, error } = await supabase
        .from("promocoes")
        .select(`
          *,
          produto:produtos(id, nome, foto_url, descricao, categoria_id),
          categoria:categorias(id, nome)
        `)
        .eq("loja_id", lojaId)
        .eq("categoria_id", categoriaId)
        .eq("ativa", true)
        .gte("data_fim", new Date().toISOString())
        .order("preco_promocional", { ascending: true });

      if (error) throw error;

      return (data || []) as Promotion[];
    } catch (error) {
      console.error("❌ Erro ao buscar promoções por categoria:", error);
      return [];
    }
  }

  // ✅ BUSCAR PROMOÇÕES EXPIRADAS (FUNCIONALIDADE EXISTENTE MANTIDA)
  async getExpiredPromotions(lojaId: string): Promise<Promotion[]> {
    try {
      const { data, error } = await supabase
        .from("promocoes")
        .select(`
          *,
          produto:produtos(id, nome, foto_url, descricao, categoria_id),
          categoria:categorias(id, nome)
        `)
        .eq("loja_id", lojaId)
        .lt("data_fim", new Date().toISOString())
        .order("data_fim", { ascending: false });

      if (error) throw error;

      return (data || []) as Promotion[];
    } catch (error) {
      console.error("❌ Erro ao buscar promoções expiradas:", error);
      return [];
    }
  }

  // ✅ BUSCAR PROMOÇÕES FUTURAS (FUNCIONALIDADE EXISTENTE MANTIDA)
  async getUpcomingPromotions(lojaId: string): Promise<Promotion[]> {
    try {
      const { data, error } = await supabase
        .from("promocoes")
        .select(`
          *,
          produto:produtos(id, nome, foto_url, descricao, categoria_id),
          categoria:categorias(id, nome)
        `)
        .eq("loja_id", lojaId)
        .gt("data_inicio", new Date().toISOString())
        .order("data_inicio", { ascending: true });

      if (error) throw error;

      return (data || []) as Promotion[];
    } catch (error) {
      console.error("❌ Erro ao buscar promoções futuras:", error);
      return [];
    }
  }

  // ✅ NOTIFICAR CLIENTES SOBRE PROMOÇÃO (FUNCIONALIDADE EXISTENTE MANTIDA)
  private async notifyClientsAboutPromotion(promotion: Promotion) {
    try {
      const categoriaNome = promotion.categoria?.nome || "Promoções";

      // Buscar clientes interessados (com fallback)
      let clientes: any[] = [];
      try {
        const { data: clientesData, error } = await supabase
          .from("user_notification_preferences")
          .select(`
            user_id,
            notification_categories!inner(name)
          `)
          .eq("notification_categories.name", categoriaNome)
          .eq("is_enabled", true);

        if (!error && clientesData) {
          clientes = clientesData;
        }
      } catch (error) {
        console.warn("⚠️ Erro ao buscar preferências, usando fallback:", error);
        // FALLBACK: Simular alguns clientes para demonstração
        clientes = [
          { user_id: 'demo-user-1' },
          { user_id: 'demo-user-2' }
        ];
      }

      if (!clientes?.length) {
        console.log(`📭 Nenhum cliente interessado na categoria "${categoriaNome}"`);
        return;
      }

      const desconto = Math.round(
        ((promotion.preco_original - promotion.preco_promocional) / promotion.preco_original) * 100
      );

      const notificationTitle = "🔥 PROMOÇÃO IMPERDÍVEL!";
      const notificationMessage = `${promotion.produto?.nome} com ${desconto}% OFF! De R$${promotion.preco_original} por R$${promotion.preco_promocional}`;

      console.log(`📢 Enviando notificação para ${clientes.length} clientes:`, notificationMessage);

      // Enviar notificações
      for (const cliente of clientes) {
        try {
          await notificationService.sendCategorizedNotification(
            categoriaNome,
            notificationTitle,
            notificationMessage,
            cliente.user_id
          );
        } catch (error) {
          console.warn(`⚠️ Erro ao enviar notificação para ${cliente.user_id}:`, error);
          // Continua mesmo com erro
        }
      }

      console.log(`✅ ${clientes.length} notificações processadas com sucesso`);

    } catch (error) {
      console.error("❌ Erro crítico ao enviar notificações:", error);
      // Não lança erro - o sistema continua funcionando
    }
  }

  // ✅ PROMOÇÕES DE DEMONSTRAÇÃO (FUNCIONALIDADE EXISTENTE MANTIDA)
  async getDemoPromotions(): Promise<Promotion[]> {
    return [
      {
        id: 'demo-1',
        loja_id: 'demo-store',
        produto_id: 'demo-product-1',
        preco_original: 49.90,
        preco_promocional: 29.90,
        parcelas: 2,
        valor_parcela: 14.95,
        data_inicio: new Date().toISOString(),
        data_fim: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        ativa: true,
        created_at: new Date().toISOString(),
        categoria_id: 'roupas',
        produto: {
          id: 'demo-product-1',
          nome: 'Camiseta Básica',
          foto_url: '/placeholder-shirt.jpg',
          descricao: 'Camiseta básica de algodão',
          categoria_id: 'roupas'
        },
        categoria: {
          id: 'roupas',
          nome: 'Roupas'
        }
      }
    ];
  }
}

export const promotionService = new PromotionService();
