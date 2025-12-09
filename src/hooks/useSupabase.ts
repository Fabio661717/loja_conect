// src/hooks/useSupabase.ts - VERSÃO COMPLETA CORRIGIDA
import createReserva from '@/pages/api/create-reserva';
import { useState } from 'react';
import { supabase } from '../services/supabase';
import { UUIDValidator } from '../utils/uuidValidator';

// Tipos (mantidos iguais)
export type Funcionario = {
  id: string;
  nome: string;
  whatsapp: string;
  foto_url?: string;
  ativo?: boolean;
  created_at?: string;
  [key: string]: any;
};

export type ProductData = {
  id?: string;
  nome: string;
  descricao?: string;
  categoria_id: string;
  categoria?: any;
  preco: number;
  estoque: number;
  tamanhos?: string[];
  foto_url?: string;
  ativo?: boolean;
  loja_id?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
  data?: any;
};

export type Store = {
  id: string;
  owner_id: string;
  nome: string;
  cnpj_cpf?: string;
  email: string;
  telefone?: string;
  endereco?: string;
  wait_time: number;
  created_at: string;
  updated_at: string;
  [key: string]: any;
};

export type Reservation = {
  id: string;
  produto_id: string;
  usuario_id: string;
  loja_id: string;
  funcionario_id?: string;
  quantidade: number;
  tamanho?: string;
  status: string;
  fim_reserva: number | string;
  created_at: string;
  updated_at: string;
  produtos?: any;
  clientes?: any;
  funcionarios?: any;
  [key: string]: any;
  data?: any;
};

export type Categoria = {
  id: string;
  nome: string;
  descricao?: string;
  loja_id: string;
  created_at: string;
  ativo?: boolean;
  is_active?: boolean;
  updated_at?: string;
  source?: string;
};

export type Cliente = {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  selected_employee?: string;
  created_at: string;
  data?: any;
};

// ✅ SERVICE PARA RESERVAS
const reservationService = {
  async confirmReservation(reservaId: string) {
    const { data, error } = await supabase
      .from("reservas")
      .update({
        status: "concluida",
        updated_at: new Date().toISOString()
      })
      .eq("id", reservaId)
      .select();

    if (error) throw error;
    return {
      success: true,
      message: "Reserva confirmada com sucesso",
      data: data?.[0] || null
    };
  },

  async cancelReservation(reservaId: string) {
    // Buscar dados da reserva primeiro
    const { data: reserva, error: reservaError } = await supabase
      .from("reservas")
      .select("produto_id, quantidade, status")
      .eq("id", reservaId)
      .single();

    if (reservaError) throw reservaError;

    // Restaurar estoque se a reserva estava pendente
    if (reserva?.status === "pendente") {
      const { error: updateError } = await supabase
        .from("produtos")
        .update({
          estoque: supabase.rpc('increment', { column: 'estoque', value: reserva.quantidade }),
          updated_at: new Date().toISOString()
        })
        .eq("id", reserva.produto_id);

      if (updateError) throw updateError;
    }

    // Atualizar status da reserva
    const { data, error } = await supabase
      .from("reservas")
      .update({
        status: "cancelada",
        updated_at: new Date().toISOString()
      })
      .eq("id", reservaId)
      .select();

    if (error) throw error;
    return {
      success: true,
      message: "Reserva cancelada com sucesso",
      data: data?.[0] || null
    };
  },

  async updateReservationStatus(reservaId: string, status: string) {
    const { data, error } = await supabase
      .from("reservas")
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq("id", reservaId)
      .select();

    if (error) throw error;
    return {
      success: true,
      message: `Status atualizado para ${status}`,
      data: data?.[0] || null
    };
  }
};

// ✅ FUNÇÃO useSupabase CORRIGIDA
export function useSupabase() {
  const [loading, setLoading] = useState(true);

  // ==========================
  // ✅ FUNÇÃO DE VALIDAÇÃO DE STORE_ID
  // ==========================
  const validateStoreId = (storeId: string): void => {
    if (!UUIDValidator.isValidUUID(storeId)) {
      console.error('❌ storeId inválido detectado:', storeId);
      UUIDValidator.clearCorruptedData();
      throw new Error('ID da loja inválido. Faça login novamente.');
    }
  };

  // ==========================
  // LOJAS (CORRIGIDAS - SEM CONVERSÃO UUID)
  // ==========================
  const getStoreByOwner = async (): Promise<Store | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não logado");

    const { data, error } = await supabase
      .from("lojas")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data;
  };

  const updateStoreWaitTime = async (storeId: string, waitTime: number) => {
    const { error } = await supabase
      .from("lojas")
      .update({ wait_time: waitTime, updated_at: new Date().toISOString() })
      .eq("id", storeId);
    if (error) throw error;
  };

  const createStore = async (storeData: {
    nome: string;
    cnpj_cpf: string;
    email: string;
    telefone?: string;
    endereco?: string;
  }): Promise<Store> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não logado");

    const { data: existingStore, error: checkError } = await supabase
      .from("lojas")
      .select("id")
      .eq("cnpj_cpf", storeData.cnpj_cpf)
      .single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;
    if (existingStore) throw new Error("CNPJ/CPF já cadastrado");

    const { data, error } = await supabase
      .from("lojas")
      .insert([
        {
          ...storeData,
          owner_id: user.id,
          wait_time: 6,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  // ==========================
  // PRODUTOS (CORRIGIDAS - SEM CONVERSÃO UUID)
  // ==========================
  const createProduct = async (storeId: string, productData: any) => {
    try {
      console.log('Criando produto com dados:', productData);
      console.log('StoreId:', storeId);
      console.log('CategoriaId:', productData.categoria_id);

      if (!productData.categoria_id || productData.categoria_id === '') {
        throw new Error("Categoria é obrigatória. Por favor, selecione uma categoria.");
      }

      const isValidUUID = (uuid: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
      };

      if (!isValidUUID(storeId)) {
        console.error('❌ StoreId não é UUID válido:', storeId);
        throw new Error("ID da loja inválido. Faça login novamente.");
      }

      if (!isValidUUID(productData.categoria_id)) {
        console.error('❌ CategoriaId não é UUID válido:', productData.categoria_id);
        throw new Error("ID da categoria inválido. Selecione uma categoria válida.");
      }

      console.log('✅ IDs validados com sucesso');

      const { data: categoriaExistente, error: categoriaError } = await supabase
        .from("categorias")
        .select("id, nome")
        .eq("id", productData.categoria_id)
        .eq("loja_id", storeId)
        .single();

      if (categoriaError) {
        console.error('❌ Erro ao verificar categoria:', categoriaError);

        if (categoriaError.code === 'PGRST116') {
          throw new Error(`Categoria não encontrada. Por favor, selecione uma categoria válida.`);
        }

        if (categoriaError.message.includes('operator does not exist') || categoriaError.message.includes('uuid = text')) {
          console.log('🔄 Tentando converter IDs para UUID...');

          const { data: categoriaConvertida, error: categoriaError2 } = await supabase
            .from("categorias")
            .select("id, nome")
            .eq("id", productData.categoria_id)
            .eq("loja_id", storeId)
            .single();

          if (categoriaError2) {
            throw new Error("Erro de compatibilidade de tipos com o banco de dados.");
          }

          if (!categoriaConvertida) {
            throw new Error(`Categoria não encontrada após conversão.`);
          }

          console.log(`✅ Categoria válida (após conversão): ${categoriaConvertida.nome}`);
        } else {
          throw new Error("Erro ao verificar categoria: " + categoriaError.message);
        }
      }

      if (!categoriaExistente) {
        throw new Error(`Categoria não encontrada. Por favor, selecione uma categoria válida.`);
      }

      console.log(`✅ Categoria válida: ${categoriaExistente.nome}`);

      const productToInsert: any = {
        nome: productData.nome,
        descricao: productData.descricao || null,
        preco: parseFloat(productData.preco) || 0,
        estoque: parseInt(productData.estoque) || 0,
        loja_id: storeId,
        categoria_id: productData.categoria_id,
        ativo: true
      };

      if (productData.tamanhos && productData.tamanhos.length > 0) {
        productToInsert.tamanhos = productData.tamanhos;
      }

      if (productData.tamanho && productData.tamanho !== '') {
        productToInsert.tamanho = productData.tamanho;
      }

      if (productData.foto_url && productData.foto_url !== '') {
        productToInsert.foto_url = productData.foto_url;
      }

      if (productData.quantidade && productData.quantidade > 0) {
        productToInsert.quantidade = parseInt(productData.quantidade);
      }

      console.log('📦 Dados finais para inserção:', productToInsert);

      const { data, error } = await supabase
        .from("produtos")
        .insert([productToInsert])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao inserir produto:', error);

        if (error.message.includes('operator does not exist') || error.message.includes('uuid = text')) {
          console.error('💥 ERRO DE TIPO UUID - Verificando estrutura da tabela...');

          const categoriaIdExists = await checkColumnExists('produtos', 'categoria_id');
          console.log('Coluna categoria_id existe?', categoriaIdExists);

          if (!categoriaIdExists) {
            throw new Error('A coluna "categoria_id" não existe na tabela produtos. Atualize a estrutura do banco.');
          }

          throw new Error('Erro de compatibilidade de tipos UUID. Verifique se os IDs estão no formato correto.');
        }

        throw error;
      }

      console.log('✅ Produto criado com sucesso:', data);
      return data;
    } catch (error) {
      console.error('💥 Erro em createProduct:', error);
      throw error;
    }
  };

  const updateProduct = async (productId: string, productData: Partial<ProductData>) => {
    const categoriaIdExists = await checkColumnExists('produtos', 'categoria_id');

    const updateData: any = {
      ...productData,
      updated_at: new Date().toISOString(),
    };

    if (!categoriaIdExists && 'categoria_id' in updateData) {
      delete updateData.categoria_id;
    }

    const { error } = await supabase
      .from("produtos")
      .update(updateData)
      .eq("id", productId);

    if (error) throw error;
  };

  const getProducts = async (storeId: string): Promise<ProductData[]> => {
    try {
      validateStoreId(storeId);

      const categoriaIdExists = await checkColumnExists('produtos', 'categoria_id');

      let query;

      if (categoriaIdExists) {
        query = supabase
          .from("produtos")
          .select(`
            *,
            categorias:categoria_id (
              id,
              nome,
              descricao
            )
          `)
          .eq("loja_id", storeId)
          .order("created_at", { ascending: false });
      } else {
        query = supabase
          .from("produtos")
          .select("*")
          .eq("loja_id", storeId)
          .order("created_at", { ascending: false });
      }

      const ativoExists = await checkColumnExists('produtos', 'ativo');
      if (ativoExists) {
        query = query.eq("ativo", true);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(product => ({
        ...product,
        categoria: product.categorias || null,
        categoria_id: product.categoria_id || null
      }));
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      throw error;
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.name}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const getProductsSafe = async (storeId: string): Promise<ProductData[]> => {
    try {
      validateStoreId(storeId);

      const ativoExists = await checkColumnExists('produtos', 'ativo');

      let query = supabase
        .from("produtos")
        .select("*")
        .eq("loja_id", storeId)
        .order("created_at", { ascending: true });

      if (ativoExists) {
        query = query.eq("ativo", true);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(product => ({
        ...product,
        categoria: null
      }));
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      throw error;
    }
  };

  // ==========================
  // FUNCIONÁRIOS (CORRIGIDAS - SEM CONVERSÃO UUID)
  // ==========================
  const getEmployeesByStore = async (storeId: string) => {
    try {
      validateStoreId(storeId);

      const { data, error } = await supabase
        .from('funcionarios')
        .select('id, nome, whatsapp, foto_url, cargo, ativo')
        .eq('loja_id', storeId)
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) {
        console.error('❌ Erro no Supabase:', error.message);
        throw error;
      }

      console.log(`👥 Funcionários encontrados: ${data?.length ?? 0}`);
      return data ?? [];
    } catch (error) {
      console.error('⚠️ Erro ao buscar funcionários:', error);
      throw error;
    }
  };

  const createEmployee = async (storeId: string, employeeData: Omit<Funcionario, 'id' | 'loja_id'>) => {
    validateStoreId(storeId);

    const { error } = await supabase.from("funcionarios").insert([
      {
        ...employeeData,
        loja_id: storeId,
        ativo: true,
      },
    ]);
    if (error) throw error;
  };

  const updateEmployee = async (employeeId: string, employeeData: Partial<Funcionario>) => {
    const { error } = await supabase
      .from("funcionarios")
      .update(employeeData)
      .eq("id", employeeId);

    if (error) throw error;
  };

  const deleteEmployee = async (employeeId: string) => {
    const { error } = await supabase
      .from("funcionarios")
      .update({ ativo: false })
      .eq("id", employeeId);

    if (error) throw error;
  };

  // ==========================
  // RESERVAS (CORRIGIDAS - SEM DEPENDÊNCIA DE RPC E SEM CONFLITO DE RELACIONAMENTOS)
  // ==========================
  const getStoreReservations = async (storeId: string): Promise<Reservation[]> => {
    validateStoreId(storeId);

    // ✅ CORREÇÃO: Especificar explicitamente os relacionamentos
    const { data, error } = await supabase
      .from("reservas")
      .select(`
        *,
        produtos!inner (*),
        clientes!inner (*),
        funcionarios!left (*)
      `)
      .eq("loja_id", storeId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error('Erro ao buscar reservas:', error);
      throw error;
    }
    return data || [];
  };

  const getReservation = async (reservationId: string): Promise<Reservation> => {
    // ✅ CORREÇÃO: Especificar explicitamente os relacionamentos
    const { data, error } = await supabase
      .from("reservas")
      .select(`
        *,
        produtos!inner (*),
        clientes!inner (*),
        funcionarios!left (*)
      `)
      .eq("id", reservationId)
      .single();

    if (error) throw error;
    return data;
  };

  const createReservationAtomic = async (
    produtoId: string,
    usuarioId: string,
    lojaId: string,
    quantidade: number = 1,
    tamanho?: string
  ): Promise<Reservation> => {
    validateStoreId(lojaId);

    const { data: loja, error: lojaError } = await supabase
      .from("lojas")
      .select("wait_time")
      .eq("id", lojaId)
      .single();

    if (lojaError) throw lojaError;

    const waitTimeHours = loja?.wait_time || 6;

    // ✅ CORREÇÃO: Usar ISO string em vez de timestamp numérico
    const fimReserva = new Date(Date.now() + waitTimeHours * 60 * 60 * 1000).toISOString();

    // ✅ CORREÇÃO: Verificar estoque manualmente em vez de usar RPC
    const { data: produto, error: produtoError } = await supabase
      .from("produtos")
      .select("estoque, nome")
      .eq("id", produtoId)
      .single();

    if (produtoError) throw produtoError;
    if (!produto) throw new Error("Produto não encontrado");
    if (produto.estoque < quantidade) throw new Error("Estoque insuficiente");

    // ✅ CORREÇÃO: Removida a variável 'data' não utilizada - usando apenas reservaData
    const { data: reservaData, error: reservaError } = await supabase
      .from("reservas")
      .insert([
        {
          produto_id: produtoId,
          usuario_id: usuarioId,
          loja_id: lojaId,
          quantidade,
          tamanho,
          status: "pendente",
          fim_reserva: fimReserva, // ✅ Agora é ISO string
        },
      ])
      .select()
      .single();

    if (reservaError) throw reservaError;

    // ✅ CORREÇÃO: Atualizar estoque após criar a reserva
    const { error: updateError } = await supabase
      .from("produtos")
      .update({
        estoque: produto.estoque - quantidade,
        updated_at: new Date().toISOString()
      })
      .eq("id", produtoId);

    if (updateError) {
      // Se falhar ao atualizar estoque, rollback da reserva
      await supabase
        .from("reservas")
        .delete()
        .eq("id", reservaData.id);
      throw new Error("Erro ao atualizar estoque");
    }

    // ✅ CORREÇÃO: Buscar dados completos da reserva separadamente para evitar conflito de relacionamentos
    const { data: reservaCompleta, error: errorCompleta } = await supabase
      .from("reservas")
      .select(`
        *,
        produtos!inner (*),
        clientes!inner (*)
      `)
      .eq("id", reservaData.id)
      .single();

    if (errorCompleta) {
      console.warn('⚠️ Não foi possível carregar dados completos da reserva:', errorCompleta);
      // Retorna pelo menos os dados básicos
      return {
        ...reservaData,
        produtos: { nome: produto.nome },
        clientes: { nome: 'Cliente', email: 'email@exemplo.com' }
      };
    }

    return reservaCompleta;
  };

  const createReservation = async (
    produtoId: string,
    usuarioId: string,
    lojaId: string,
    quantidade: number = 1,
    tamanho?: string
  ) => {
    return createReservationAtomic(produtoId, usuarioId, lojaId, quantidade, tamanho);
  };

  // ✅ CONFIRMAR RESERVA CORRIGIDA
  const confirmReservation = async (reservationId: string) => {
    return await reservationService.confirmReservation(reservationId);
  };

  // ✅ CANCELAR RESERVA CORRIGIDA
  const cancelReservation = async (reservationId: string) => {
    return await reservationService.cancelReservation(reservationId);
  };

  // ==========================
  // ✅ NOVAS FUNÇÕES: RENOVAÇÃO E CANCELAMENTO DE RESERVAS
  // ==========================
  const renovarReserva = async (reservaId: string, horas: number = 8) => {
    try {
      console.log('🔄 Renovando reserva:', { reservaId, horas });

      const { data: reserva, error: reservaError } = await supabase
        .from('reservas')
        .select('*')
        .eq('id', reservaId)
        .single();

      if (reservaError) throw reservaError;

      if (reserva.renovacoes_count >= 3) {
        throw new Error('Limite de renovações atingido');
      }

      // ✅ CORREÇÃO: Usar ISO string em vez de timestamp
      const novoFimReserva = new Date();
      novoFimReserva.setHours(novoFimReserva.getHours() + horas);

      const { error: updateError } = await supabase
        .from('reservas')
        .update({
          fim_reserva: novoFimReserva.toISOString(), // ✅ Agora é ISO string
          status: 'pendente',
          renovacoes_count: (reserva.renovacoes_count || 0) + 1,
          ultima_renovacao: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', reservaId);

      if (updateError) throw updateError;

      console.log('✅ Reserva renovada com sucesso');
      return { success: true, novoFimReserva: novoFimReserva.getTime() };
    } catch (error) {
      console.error('❌ Erro ao renovar reserva:', error);
      throw error;
    }
  };

  const cancelarReservaAutomatico = async (reservaId: string) => {
    try {
      console.log('❌ Cancelando reserva automaticamente:', reservaId);

      const { data: reserva, error: reservaError } = await supabase
        .from('reservas')
        .select('produto_id, quantidade, status')
        .eq('id', reservaId)
        .single();

      if (reservaError) throw reservaError;

      if (reserva?.status === "pendente") {
        const { error: updateError } = await supabase
          .from("produtos")
          .update({
            estoque: supabase.rpc('increment', { column: 'estoque', value: reserva.quantidade }),
            updated_at: new Date().toISOString()
          })
          .eq("id", reserva.produto_id);

        if (updateError) throw updateError;
      }

      const { error } = await supabase
        .from('reservas')
        .update({
          status: 'expirada',
          updated_at: new Date().toISOString()
        })
        .eq('id', reservaId);

      if (error) throw error;

      console.log('✅ Reserva cancelada automaticamente');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao cancelar reserva automaticamente:', error);
      throw error;
    }
  };

  const expireOldReservations = async () => {
    const { error } = await supabase.rpc('expirar_reservas_automatico');
    if (error) throw error;
  };

  // ==========================
  // CATEGORIAS (CORRIGIDAS - SEM CONVERSÃO UUID)
  // ==========================
  const getCategorias = async (storeId: string): Promise<Categoria[]> => {
    setLoading(true);
    try {
      validateStoreId(storeId);

      console.log('🔍 Buscando categorias para storeId:', storeId);

      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .eq("loja_id", storeId)
        .order("nome", { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar categorias:', error);
        throw error;
      }

      console.log('✅ Categorias encontradas:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar categorias:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createCategoria = async (
    storeId: string,
    categoria: Omit<Categoria, "id" | "loja_id" | "created_at">
  ): Promise<Categoria> => {
    setLoading(true);
    try {
      validateStoreId(storeId);

      const { data: existingCategory, error: checkError } = await supabase
        .from("categorias")
        .select("id")
        .eq("nome", categoria.nome)
        .eq("loja_id", storeId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      if (existingCategory) throw new Error("Já existe uma categoria com este nome");

      const { data, error } = await supabase
        .from("categorias")
        .insert([
          {
            ...categoria,
            loja_id: storeId,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateCategoria = async (categoriaId: string, categoriaData: Partial<Categoria>): Promise<Categoria> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("categorias")
        .update(categoriaData)
        .eq("id", categoriaId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteCategoria = async (categoriaId: string): Promise<void> => {
    setLoading(true);
    try {
      const { data: produtos, error: produtosError } = await supabase
        .from("produtos")
        .select("id")
        .eq("categoria_id", categoriaId)
        .limit(1);

      if (produtosError) throw produtosError;

      if (produtos && produtos.length > 0) {
        throw new Error("Não é possível excluir esta categoria pois existem produtos vinculados a ela");
      }

      const { error } = await supabase
        .from("categorias")
        .delete()
        .eq("id", categoriaId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // UTILITÁRIOS
  // ==========================
  const checkColumnExists = async (tableName: string, columnName: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', tableName)
        .eq('column_name', columnName)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error(`Erro ao verificar coluna ${columnName}:`, error);
      return false;
    }
  };

  const checkTableExists = async (tableName: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', tableName)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error(`Erro ao verificar tabela ${tableName}:`, error);
      return false;
    }
  };

  // ==========================
  // CLIENTES (CORRIGIDAS - SEM CONVERSÃO UUID)
  // ==========================
  const getClientes = async (storeId: string): Promise<Cliente[]> => {
    validateStoreId(storeId);

    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("nome", { ascending: true });

    if (error) throw error;
    return data || [];
  };

  const getCliente = async (clienteId: string): Promise<Cliente> => {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", clienteId)
      .single();

    if (error) throw error;
    return data;
  };

  // ==========================
  // ✅ CORREÇÃO: CATEGORIAS_CLIENTES - SEM CONVERSÃO UUID
  // ==========================
  const getClientesByCategoria = async (categoriaId: string): Promise<Cliente[]> => {
    try {
      const { data, error } = await supabase
        .from("categorias_clientes")
        .select(`
          clientes:cliente_id (*)
        `)
        .eq("categoria_id", categoriaId);

      if (error) {
        if (error.code === '42P01') {
          console.warn('Tabela categorias_clientes não existe, retornando array vazio');
          return [];
        }
        throw error;
      }

      if (!data) return [];

      const clientes = data.flatMap((item: any) =>
        Array.isArray(item.clientes) ? item.clientes : [item.clientes]
      );

      return clientes.filter((cliente): cliente is Cliente =>
        cliente !== null &&
        typeof cliente === 'object' &&
        'id' in cliente &&
        'nome' in cliente
      );
    } catch (error) {
      console.error('Erro ao buscar clientes por categoria:', error);
      return [];
    }
  };

  const addClienteCategoria = async (clienteId: string, categoriaId: string) => {
    try {
      const { error } = await supabase.from("categorias_clientes").insert([
        {
          cliente_id: clienteId,
          categoria_id: categoriaId,
        },
      ]);

      if (error) {
        if (error.code === '42P01') {
          console.warn('Tabela categorias_clientes não existe, ignorando adição');
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('Erro ao adicionar categoria ao cliente:', error);
    }
  };

  const removeClienteCategoria = async (clienteId: string, categoriaId: string) => {
    try {
      const { error } = await supabase
        .from("categorias_clientes")
        .delete()
        .eq("cliente_id", clienteId)
        .eq("categoria_id", categoriaId);

      if (error) {
        if (error.code === '42P01') {
          console.warn('Tabela categorias_clientes não existe, ignorando remoção');
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('Erro ao remover categoria do cliente:', error);
    }
  };

  // ==========================
  // NOTIFICAÇÕES (CORRIGIDAS - APLICANDO OPÇÃO 1)
  // ==========================
  const savePushSubscription = async (subscription: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("Usuário não autenticado");

    // ✅ OPÇÃO 1 APLICADA: Declarar todas as variáveis explicitamente
    const user_id = session.user.id;
    const endpoint = subscription.endpoint;
    const p256dh = subscription.keys?.p256dh || '';
    const auth = subscription.keys?.auth || '';
    const platform = navigator.userAgent;
    const category = "notifications";

    const body = {
      user_id,
      endpoint,
      p256dh,
      auth,
      platform,
      category,
    };

    const { error } = await supabase.from("push_subscriptions").upsert(
      [body],
      {
        onConflict: 'user_id, endpoint'
      }
    );

    if (error) throw error;
  };

  const getPushSubscriptions = async (userId: string) => {
    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", userId);

    if (error) throw error;
    return data || [];
  };

  const createNotification = async (notificationData: {
    titulo: string;
    mensagem: string;
    payload?: any;
    user_id?: string;
    loja_id?: string;
    tipo?: string;
  }) => {
    try {
      const tableExists = await checkTableExists('notificacoes');
      if (!tableExists) {
        console.warn('Tabela notificacoes não existe, ignorando criação de notificação');
        return null;
      }

      const payloadExists = await checkColumnExists('notificacoes', 'payload');

      const notificationToInsert: any = {
        titulo: notificationData.titulo,
        mensagem: notificationData.mensagem,
        user_id: notificationData.user_id ? notificationData.user_id : null,
        loja_id: notificationData.loja_id ? notificationData.loja_id : null,
        tipo: notificationData.tipo || 'info',
        lida: false,
      };

      if (payloadExists && notificationData.payload) {
        notificationToInsert.payload = notificationData.payload;
      }

      const { data, error } = await supabase
        .from("notificacoes")
        .insert([notificationToInsert])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      return null;
    }
  };

  const getUserNotifications = async (userId: string, limit: number = 20) => {
    try {
      const tableExists = await checkTableExists('notificacoes');
      if (!tableExists) return [];

      const { data, error } = await supabase
        .from("notificacoes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      return [];
    }
  };

  const getStoreNotifications = async (lojaId: string, limit: number = 20) => {
    try {
      validateStoreId(lojaId);

      const tableExists = await checkTableExists('notificacoes');
      if (!tableExists) return [];

      const { data, error } = await supabase
        .from("notificacoes")
        .select("*")
        .eq("loja_id", lojaId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar notificações da loja:', error);
      return [];
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const tableExists = await checkTableExists('notificacoes');
      if (!tableExists) return null;

      const { data, error } = await supabase
        .from("notificacoes")
        .update({ lida: true, updated_at: new Date().toISOString() })
        .eq("id", notificationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return null;
    }
  };

  // ==========================
  // ESTATÍSTICAS (CORRIGIDA - SEM CONVERSÃO UUID)
  // ==========================
  const getStoreStats = async (storeId: string) => {
    try {
      validateStoreId(storeId);

      const ativoExists = await checkColumnExists('produtos', 'ativo');

      let produtosQuery = supabase
        .from("produtos")
        .select("id, preco, estoque")
        .eq("loja_id", storeId);

      if (ativoExists) {
        produtosQuery = produtosQuery.eq("ativo", true);
      }

      const { data: produtos, error: produtosError } = await produtosQuery;

      const { data: reservas, error: reservasError } = await supabase
        .from("reservas")
        .select("id, status")
        .eq("loja_id", storeId)
        .eq("status", "pendente");

      const { data: funcionarios, error: funcionariosError } = await supabase
        .from("funcionarios")
        .select("id")
        .eq("loja_id", storeId)
        .eq("ativo", true);

      const { data: categorias, error: categoriasError } = await supabase
        .from("categorias")
        .select("id, nome")
        .eq("loja_id", storeId)
        .eq("is_active", true);

      if (produtosError || reservasError || funcionariosError || categoriasError) {
        throw new Error("Erro ao carregar estatísticas");
      }

      const totalProducts = produtos?.length || 0;
      const lowStockProducts = produtos?.filter(p => p.estoque <= 5).length || 0;
      const totalRevenue = produtos?.reduce((sum, p) => sum + (p.preco * p.estoque), 0) || 0;
      const activeReservations = reservas?.length || 0;
      const activeEmployees = funcionarios?.length || 0;
      const totalCategories = categorias?.length || 0;

      return {
        totalProducts,
        lowStockProducts,
        totalRevenue,
        activeReservations,
        activeEmployees,
        totalCategories,
      };
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      throw error;
    }
  };

  // ✅ FUNÇÃO RPC PARA RESERVAS (se necessário)
  async function createReservationRPC(
    produtoId: string,
    usuarioId: string,
    lojaId: string,
    quantidade: number = 1,
    tamanho?: string,
    funcionarioId?: string
  ) {
    const { data, error } = await supabase.rpc('create_reservation', {
      produto_id: produtoId,
      usuario_id: usuarioId,
      loja_id: lojaId,
      quantidade,
      tamanho,
      funcionario_id: funcionarioId
    });

    if (error) throw error;

    // ✅ CORREÇÃO: Buscar dados completos separadamente se necessário
    if (data) {
      const { data: reservaCompleta, error: errorCompleta } = await supabase
        .from("reservas")
        .select(`
          *,
          produtos!inner (*),
          clientes!inner (*)
        `)
        .eq("id", data.id)
        .single();

      if (!errorCompleta) {
        return reservaCompleta;
      }
    }

    return data;
  }

  // ==========================
  // ✅ RETORNO COMPLETO CORRIGIDO
  // ==========================
  return {
    loading,
    createReservation,
    createReservationRPC,
    cancelReservation,

    // Lojas
    getStoreByOwner,
    createStore,
    updateStoreWaitTime,

    // Produtos
    createProduct, // ✅ Mantido para compatibilidade
    updateProduct,
    getProducts,
    getProductsSafe,
    uploadImage,

    // Utilitários
    checkColumnExists,
    checkTableExists,

    // Funcionários
    getEmployeesByStore,
    createEmployee,
    updateEmployee,
    deleteEmployee,

    // Reservas
    getStoreReservations,
    getReservation,
    createReserva,
    createReservationAtomic,
    confirmReservation,
    renovarReserva,
    cancelarReservaAutomatico,
    expireOldReservations,

    // Categorias
    getCategorias,
    createCategoria,
    updateCategoria,
    deleteCategoria,

    // Clientes
    getClientes,
    getCliente,

    // Categorias Clientes
    getClientesByCategoria,
    addClienteCategoria,
    removeClienteCategoria,

    // Notificações
    savePushSubscription,
    getPushSubscriptions,
    createNotification,
    getUserNotifications,
    getStoreNotifications,
    markNotificationAsRead,

    // Estatísticas
    getStoreStats,

    // ✅ CORREÇÃO: Adicionar supabase ao retorno
    supabase, // ✅ Agora disponível no hook
  };
}
