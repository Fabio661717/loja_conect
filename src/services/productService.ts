// src/services/productService.ts - VERSÃO COMPLETA COM NOTIFICAÇÕES PARA CLIENTE
import { notificationService } from './notificationService';
import { supabase } from './supabase';

export interface Product {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  estoque: number;
  categoria_id: string;
  loja_id: string;
  foto_url?: string;
  tamanhos?: string[];
  created_at: string;
  // ✅ CAMPO CORRIGIDO
  parcelamento?: {
    habilitado: boolean;
    max_parcelas: number;
    juros: number;
  };
}

export interface CreateProductData {
  nome: string;
  descricao: string;
  preco: number;
  estoque: number;
  categoria_id: string;
  foto_url?: string;
  tamanhos?: string[];
  // ✅ CAMPO CORRIGIDO
  parcelamento?: {
    habilitado: boolean;
    max_parcelas: number;
    juros: number;
  };
}

class ProductService {
  // ✅ CRIAR PRODUTO E NOTIFICAR CLIENTES
  async createProduct(lojaId: string, productData: CreateProductData): Promise<Product> {
    try {
      console.log("🔄 Criando produto e notificando clientes...");

      // Preparar dados do produto incluindo parcelamento
      const productToInsert = {
        ...productData,
        loja_id: lojaId,
        // ✅ GARANTIR QUE PARCELAMENTO TENHA TODAS AS PROPRIEDADES
        parcelamento: productData.parcelamento || {
          habilitado: false,
          max_parcelas: 1,
          juros: 0
        }
      };

      // Inserir produto no banco
      const { data, error } = await supabase
        .from('produtos')
        .insert(productToInsert)
        .select()
        .single();

      if (error) throw error;

      console.log("✅ Produto criado:", data.nome);

      // ✅ NOTIFICAR CLIENTES INTERESSADOS
      await this.notifyClientsAboutNewProduct(data, lojaId);

      return data;
    } catch (error) {
      console.error('❌ Erro ao criar produto:', error);
      throw error;
    }
  }

  // ✅ NOTIFICAR CLIENTES SOBRE NOVO PRODUTO
  private async notifyClientsAboutNewProduct(product: Product, lojaId: string): Promise<void> {
    try {
      // Buscar informações da categoria
      const { data: categoria, error: categoriaError } = await supabase
        .from('categorias')
        .select('nome, id')
        .eq('id', product.categoria_id)
        .single();

      if (categoriaError || !categoria) {
        console.warn('⚠️ Categoria não encontrada para notificação');
        return;
      }

      console.log(`📢 Notificando clientes sobre novo produto: ${product.nome} - Categoria: ${categoria.nome}`);

      // ✅ USAR O SERVIÇO DE NOTIFICAÇÃO ATUALIZADO
      await notificationService.notifyNewProductToClients(
        product.id,
        product.nome,
        product.preco,
        categoria.nome,
        lojaId
      );

    } catch (error) {
      console.error('❌ Erro ao notificar clientes sobre novo produto:', error);
      // Não falha a criação do produto se a notificação falhar
    }
  }

  // ✅ ATUALIZAR PRODUTO (PARA PROMOÇÕES)
  async updateProduct(productId: string, updates: Partial<Product>): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .update(updates)
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;

      // ✅ SE HOUVER MUDANÇA DE PREÇO (PROMOÇÃO), NOTIFICAR CLIENTES
      if (updates.preco) {
        const product = await this.getProductById(productId);
        if (product) {
          // Verificar se é uma promoção (preço reduzido)
          const originalPrice = await this.getOriginalPrice(productId);
          if (originalPrice && updates.preco < originalPrice) {
            await this.notifyClientsAboutPriceDrop(product, originalPrice, updates.preco);
          }
        }
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      throw error;
    }
  }

  // ✅ NOTIFICAR CLIENTES SOBRE QUEDA DE PREÇO
  private async notifyClientsAboutPriceDrop(product: Product, originalPrice: number, newPrice: number): Promise<void> {
    try {
      const { data: categoria } = await supabase
        .from('categorias')
        .select('nome')
        .eq('id', product.categoria_id)
        .single();

      if (!categoria) return;

      console.log(`🔥 Notificando clientes sobre promoção: ${product.nome}`);

      await notificationService.notifyPromotionToClients(
        product.id,
        product.nome,
        originalPrice,
        newPrice,
        categoria.nome,
        product.loja_id
      );

    } catch (error) {
      console.error('❌ Erro ao notificar sobre queda de preço:', error);
    }
  }

  // ✅ OBTER PREÇO ORIGINAL DO PRODUTO
  private async getOriginalPrice(productId: string): Promise<number | null> {
    try {
      const { data: historico } = await supabase
        .from('produto_historico_precos')
        .select('preco')
        .eq('produto_id', productId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return historico?.preco || null;
    } catch (error) {
      return null;
    }
  }

  // Buscar produtos da loja
  async getProductsByStore(lojaId: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('loja_id', lojaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      throw error;
    }
  }

  // Excluir produto
  async deleteProduct(productId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', productId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      throw error;
    }
  }

  // ✅ BUSCAR PRODUTO POR ID
  async getProductById(productId: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      return null;
    }
  }

  // Buscar produtos com promoções ativas
  async getProductsWithPromotions(lojaId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          *,
          promocoes!inner(*)
        `)
        .eq('loja_id', lojaId)
        .eq('promocoes.ativa', true)
        .gte('promocoes.data_fim', new Date().toISOString());

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar produtos com promoções:', error);
      throw error;
    }
  }

  // ✅ CALCULAR VALOR DAS PARCELAS - VERSÃO CORRIGIDA
  calcularParcelas(preco: number, parcelamento?: { habilitado: boolean; max_parcelas: number; juros: number }): Array<{ numero: number; valor: number; total: number }> {
    // ✅ VERIFICAR SE PARCELAMENTO ESTÁ HABILITADO E TEM PROPRIEDADES CORRETAS
    if (!parcelamento || !parcelamento.habilitado || parcelamento.max_parcelas <= 1) {
      return [{ numero: 1, valor: preco, total: preco }];
    }

    const parcelas = [];
    const { max_parcelas, juros } = parcelamento;

    for (let i = 1; i <= max_parcelas; i++) {
      if (i === 1) {
        // À vista sem juros
        parcelas.push({ numero: 1, valor: preco, total: preco });
      } else {
        // Parcelado com juros
        const taxaJuros = juros / 100;
        const totalComJuros = preco * Math.pow(1 + taxaJuros, i);
        const valorParcela = totalComJuros / i;

        parcelas.push({
          numero: i,
          valor: parseFloat(valorParcela.toFixed(2)),
          total: parseFloat(totalComJuros.toFixed(2))
        });
      }
    }

    return parcelas;
  }

  // ✅ MÉTODO ADICIONAL: BUSCAR PRODUTOS POR CATEGORIA
  async getProductsByCategory(lojaId: string, categoriaId: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('loja_id', lojaId)
        .eq('categoria_id', categoriaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar produtos por categoria:', error);
      throw error;
    }
  }

  // ✅ MÉTODO ADICIONAL: ATUALIZAR ESTOQUE
  async updateStock(productId: string, newStock: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('produtos')
        .update({ estoque: newStock })
        .eq('id', productId);

      if (error) throw error;

      // ✅ NOTIFICAR SE ESTOQUE ESTÁ BAIXO
      if (newStock <= 5) {
        await this.notifyLowStock(productId, newStock);
      }
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      throw error;
    }
  }

  // ✅ NOTIFICAR ESTOQUE BAIXO
  private async notifyLowStock(productId: string, currentStock: number): Promise<void> {
    try {
      const product = await this.getProductById(productId);
      if (!product) return;

      // Buscar informações da loja
      const { data: loja } = await supabase
        .from('lojas')
        .select('nome')
        .eq('id', product.loja_id)
        .single();

      if (!loja) return;

      // Enviar notificação para a loja sobre estoque baixo
      await notificationService.sendPushNotification(
        '⚠️ Estoque Baixo',
        `O produto ${product.nome} está com apenas ${currentStock} unidades em estoque`,
        {
          category: 'estoque',
          url: `/loja/produtos/${productId}`,
          productId: productId,
          lojaId: product.loja_id,
          currentStock: currentStock
        }
      );

      console.log(`📦 Notificação de estoque baixo enviada para ${loja.nome}`);
    } catch (error) {
      console.error('❌ Erro ao notificar estoque baixo:', error);
    }
  }
}

export const productService = new ProductService();
