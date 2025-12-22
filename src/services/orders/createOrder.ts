// src/services/orders/createOrder.ts - VERSÃO CORRIGIDA
import { supabase } from '../supabase';
import { sendEmail } from '../email/sendEmail';
import { orderCreatedEmail } from '../email/templates/orderCreated';

// ✅ INTERFACES TIPADAS PARA RESOLVER ERROS
interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  endereco?: string;
  created_at?: string;
  updated_at?: string;
}

interface Pedido {
  id: string;
  cliente_id: string;
  loja_id: string;
  produtos: Array<{
    produto_id: string;
    quantidade: number;
    preco_unitario: number;
    tamanho?: string;
  }>;
  status: 'pendente' | 'processando' | 'enviado' | 'entregue' | 'cancelado';
  total: number;
  metodo_pagamento: string;
  endereco_entrega?: any;
  observacoes?: string;
  created_at: string;
}

interface CreateOrderData {
  cliente_id: string;
  loja_id: string;
  produtos: Array<{
    produto_id: string;
    quantidade: number;
    preco_unitario: number;
    tamanho?: string;
  }>;
  metodo_pagamento: string;
  endereco_entrega?: any;
  observacoes?: string;
}

// ✅ FUNÇÃO AUXILIAR: Atualizar estoque com tratamento de erro correto
async function decrementarEstoqueSeguro(produtoId: string, quantidade: number): Promise<void> {
  try {
    // Primeiro, tentar RPC se a função existir
    const { error: rpcError } = await supabase
      .rpc('decrementar_estoque', {
        produto_id: produtoId,
        quantidade: quantidade
      });

    if (rpcError) {
      console.warn('⚠️ RPC decrementar_estoque falhou, usando fallback:', rpcError);

      // Fallback: Atualizar manualmente o estoque
      const { data: produto, error: fetchError } = await supabase
        .from('produtos')
        .select('estoque')
        .eq('id', produtoId)
        .single();

      if (fetchError || !produto) {
        console.error('❌ Erro ao buscar produto para atualização de estoque:', fetchError);
        return;
      }

      const novoEstoque = Math.max(0, produto.estoque - quantidade);

      const { error: updateError } = await supabase
        .from('produtos')
        .update({
          estoque: novoEstoque,
          updated_at: new Date().toISOString()
        })
        .eq('id', produtoId);

      if (updateError) {
        console.error('❌ Erro ao atualizar estoque manualmente:', updateError);
      } else {
        console.log(`✅ Estoque atualizado manualmente: ${produtoId} -> ${novoEstoque}`);
      }
    } else {
      console.log(`✅ Estoque decrementado via RPC: ${produtoId} - ${quantidade} unidades`);
    }
  } catch (error) {
    console.error('❌ Erro crítico ao atualizar estoque:', error);
    // Não lançar erro para não interromper o processo do pedido
  }
}

// ✅ FUNÇÃO PRINCIPAL CORRIGIDA
export async function createOrder(orderData: CreateOrderData): Promise<{
  success: boolean;
  order?: Pedido;
  message?: string;
  error?: any;
}> {
  try {
    console.log('🛒 Criando novo pedido para cliente:', orderData.cliente_id);

    // 1. Buscar informações do cliente
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', orderData.cliente_id)
      .single();

    if (clienteError || !cliente) {
      console.error('❌ Cliente não encontrado:', clienteError);
      return {
        success: false,
        message: 'Cliente não encontrado'
      };
    }

    // 2. Validar produtos e calcular total
    let total = 0;
    const produtosValidados = [];

    for (const item of orderData.produtos) {
      // Buscar informações do produto
      const { data: produto, error: produtoError } = await supabase
        .from('produtos')
        .select('preco, estoque, nome')
        .eq('id', item.produto_id)
        .single();

      if (produtoError || !produto) {
        console.error('❌ Produto não encontrado:', item.produto_id);
        return {
          success: false,
          message: `Produto ${item.produto_id} não encontrado`
        };
      }

      // Verificar estoque
      if (produto.estoque < item.quantidade) {
        console.error('❌ Estoque insuficiente:', produto.nome);
        return {
          success: false,
          message: `Estoque insuficiente para ${produto.nome}. Disponível: ${produto.estoque}`
        };
      }

      // Calcular subtotal
      const subtotal = item.preco_unitario * item.quantidade;
      total += subtotal;

      produtosValidados.push({
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        tamanho: item.tamanho || null,
        nome_produto: produto.nome,
        subtotal
      });
    }

    // 3. Criar pedido no banco de dados
    const pedidoData = {
      cliente_id: orderData.cliente_id,
      loja_id: orderData.loja_id,
      produtos: produtosValidados,
      status: 'pendente',
      total,
      metodo_pagamento: orderData.metodo_pagamento,
      endereco_entrega: orderData.endereco_entrega || null,
      observacoes: orderData.observacoes || null,
      created_at: new Date().toISOString()
    };

    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert([pedidoData])
      .select()
      .single();

    if (pedidoError) {
      console.error('❌ Erro ao criar pedido:', pedidoError);
      return {
        success: false,
        message: 'Erro ao criar pedido',
        error: pedidoError
      };
    }

    // 4. Atualizar estoque dos produtos (CORREÇÃO DO ERRO DO .catch())
    const atualizacoesEstoque = [];
    for (const item of orderData.produtos) {
      atualizacoesEstoque.push(
        decrementarEstoqueSeguro(item.produto_id, item.quantidade)
      );
    }

    // Executar todas as atualizações de estoque em paralelo
    await Promise.allSettled(atualizacoesEstoque);

    // 5. Enviar email de confirmação (se cliente tiver email)
    if (cliente.email) {
      try {
        await sendEmail({
          to: cliente.email,
          subject: "Seu pedido foi confirmado 🎉",
          html: orderCreatedEmail(cliente.nome, pedido.id)
        });
        console.log('✅ Email de confirmação enviado para:', cliente.email);
      } catch (emailError) {
        console.warn('⚠️ Erro ao enviar email:', emailError);
        // Não falhar o pedido se o email falhar
      }
    }

    // 6. Registrar notificação (opcional)
    try {
      await supabase
        .from('notificacoes')
        .insert([{
          cliente_id: orderData.cliente_id,
          tipo: 'pedido',
          titulo: 'Pedido Confirmado!',
          mensagem: `Seu pedido #${pedido.id.slice(-8)} foi recebido e está sendo processado.`,
          data: { pedido_id: pedido.id, total },
          lida: false,
          created_at: new Date().toISOString()
        }]);
    } catch (notifError: any) {
      console.warn('⚠️ Erro ao criar notificação:', notifError);
    }

    console.log(`✅ Pedido criado com sucesso: ${pedido.id} - Total: R$ ${total.toFixed(2)}`);

    return {
      success: true,
      order: pedido as Pedido,
      message: 'Pedido criado com sucesso!'
    };

  } catch (error) {
    console.error('❌ Erro ao criar pedido:', error);
    return {
      success: false,
      message: 'Erro interno ao processar pedido',
      error
    };
  }
}

// ✅ FUNÇÃO PARA BUSCAR PEDIDOS DO CLIENTE
export async function getClienteOrders(clienteId: string): Promise<Pedido[]> {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Pedido[] || [];
  } catch (error) {
    console.error('❌ Erro ao buscar pedidos do cliente:', error);
    return [];
  }
}

// ✅ FUNÇÃO PARA ATUALIZAR STATUS DO PEDIDO
export async function updateOrderStatus(
  pedidoId: string,
  status: Pedido['status']
): Promise<{ success: boolean; message?: string }> {
  try {
    const { error } = await supabase
      .from('pedidos')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', pedidoId);

    if (error) throw error;

    // Buscar informações para notificação
    const { data: pedido } = await supabase
      .from('pedidos')
      .select('cliente_id')
      .eq('id', pedidoId)
      .single();

    if (pedido) {
      // Criar notificação para o cliente
      try {
        await supabase
          .from('notificacoes')
          .insert([{
            cliente_id: pedido.cliente_id,
            tipo: 'pedido_status',
            titulo: `Status do Pedido Atualizado: ${status}`,
            mensagem: `Seu pedido #${pedidoId.slice(-8)} agora está ${status}.`,
            data: { pedido_id: pedidoId, status },
            lida: false,
            created_at: new Date().toISOString()
          }]);
      } catch (notifError: any) {
        console.warn('⚠️ Erro ao criar notificação de status:', notifError);
      }
    }

    return {
      success: true,
      message: `Status do pedido atualizado para: ${status}`
    };
  } catch (error) {
    console.error('❌ Erro ao atualizar status do pedido:', error);
    return {
      success: false,
      message: 'Erro ao atualizar status do pedido'
    };
  }
}

// ✅ FUNÇÃO PARA OBTER DETALHES DO PEDIDO
export async function getOrderDetails(pedidoId: string): Promise<{
  success: boolean;
  order?: Pedido & { cliente?: Cliente };
  message?: string;
}> {
  try {
    const { data: pedido, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        cliente:clientes(*)
      `)
      .eq('id', pedidoId)
      .single();

    if (error) throw error;

    return {
      success: true,
      order: pedido as Pedido & { cliente?: Cliente }
    };
  } catch (error) {
    console.error('❌ Erro ao buscar detalhes do pedido:', error);
    return {
      success: false,
      message: 'Pedido não encontrado'
    };
  }
}

// ✅ FUNÇÃO SIMPLIFICADA PARA TESTE
export async function createSimpleOrder(
  clienteId: string,
  lojaId: string,
  produtos: Array<{ produto_id: string; quantidade: number }>
): Promise<{ success: boolean; orderId?: string; message?: string }> {

  // Buscar preços dos produtos
  const produtosComPreco = [];

  for (const item of produtos) {
    const { data: produto } = await supabase
      .from('produtos')
      .select('preco')
      .eq('id', item.produto_id)
      .single();

    if (!produto) {
      return {
        success: false,
        message: `Produto ${item.produto_id} não encontrado`
      };
    }

    produtosComPreco.push({
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      preco_unitario: produto.preco
    });
  }

  const result = await createOrder({
    cliente_id: clienteId,
    loja_id: lojaId,
    produtos: produtosComPreco,
    metodo_pagamento: 'pix'
  });

  return {
    success: result.success,
    orderId: result.order?.id,
    message: result.message
  };
}

// ✅ FUNÇÃO PARA DELETAR PEDIDO (CANCELAMENTO)
export async function cancelOrder(pedidoId: string): Promise<{ success: boolean; message?: string }> {
  try {
    // Primeiro buscar os produtos do pedido para restaurar estoque
    const { data: pedido, error: fetchError } = await supabase
      .from('pedidos')
      .select('produtos, status')
      .eq('id', pedidoId)
      .single();

    if (fetchError || !pedido) {
      console.error('❌ Pedido não encontrado:', fetchError);
      return {
        success: false,
        message: 'Pedido não encontrado'
      };
    }

    if (pedido.status === 'cancelado') {
      return {
        success: false,
        message: 'Pedido já está cancelado'
      };
    }

    // Atualizar status para cancelado
    const { error: updateError } = await supabase
      .from('pedidos')
      .update({
        status: 'cancelado',
        updated_at: new Date().toISOString()
      })
      .eq('id', pedidoId);

    if (updateError) throw updateError;

    // Restaurar estoque dos produtos
    if (pedido.produtos && Array.isArray(pedido.produtos)) {
      const restauracaoEstoque = [];
      for (const item of pedido.produtos) {
        if (item.produto_id && item.quantidade) {
          // Usar a mesma função segura para incrementar estoque
          restauracaoEstoque.push(
            incrementarEstoqueSeguro(item.produto_id, item.quantidade)
          );
        }
      }
      await Promise.allSettled(restauracaoEstoque);
    }

    // Criar notificação de cancelamento
    try {
      const { data: pedidoComCliente } = await supabase
        .from('pedidos')
        .select('cliente_id')
        .eq('id', pedidoId)
        .single();

      if (pedidoComCliente) {
        await supabase
          .from('notificacoes')
          .insert([{
            cliente_id: pedidoComCliente.cliente_id,
            tipo: 'pedido_cancelado',
            titulo: 'Pedido Cancelado',
            mensagem: `Seu pedido #${pedidoId.slice(-8)} foi cancelado.`,
            data: { pedido_id: pedidoId },
            lida: false,
            created_at: new Date().toISOString()
          }]);
      }
    } catch (notifError: any) {
      console.warn('⚠️ Erro ao criar notificação de cancelamento:', notifError);
    }

    return {
      success: true,
      message: 'Pedido cancelado com sucesso'
    };
  } catch (error) {
    console.error('❌ Erro ao cancelar pedido:', error);
    return {
      success: false,
      message: 'Erro ao cancelar pedido'
    };
  }
}

// ✅ FUNÇÃO AUXILIAR: Incrementar estoque
async function incrementarEstoqueSeguro(produtoId: string, quantidade: number): Promise<void> {
  try {
    const { data: produto, error: fetchError } = await supabase
      .from('produtos')
      .select('estoque')
      .eq('id', produtoId)
      .single();

    if (fetchError || !produto) {
      console.error('❌ Erro ao buscar produto para restaurar estoque:', fetchError);
      return;
    }

    const novoEstoque = produto.estoque + quantidade;

    const { error: updateError } = await supabase
      .from('produtos')
      .update({
        estoque: novoEstoque,
        updated_at: new Date().toISOString()
      })
      .eq('id', produtoId);

    if (updateError) {
      console.error('❌ Erro ao restaurar estoque:', updateError);
    } else {
      console.log(`✅ Estoque restaurado: ${produtoId} -> ${novoEstoque}`);
    }
  } catch (error) {
    console.error('❌ Erro crítico ao restaurar estoque:', error);
  }
}
