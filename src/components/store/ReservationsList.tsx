// src/components/store/ReservationsList.tsx - VERSÃO COMPLETA CORRIGIDA
import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "../../hooks/useSupabase";
import { supabase } from "../../services/supabase";
import { generateWhatsAppLink } from "../../services/whatsapp";
import Timer from "./Timer";

interface Reserva {
  id: string;
  produto_id: string;
  usuario_id: string;
  funcionario_id?: string;
  quantidade: number;
  tamanho?: string;
  status: string;
  fim_reserva: string;
  created_at: string;
  loja_id: string;
  produto?: {
    id: string;
    nome: string;
    preco: number;
    foto_url?: string;
    categoria?: string;
    estoque?: number;
  };
  cliente?: {
    id: string;
    nome: string;
    email: string;
    telefone?: string;
  };
  funcionario?: {
    id: string;
    nome: string;
    whatsapp: string;
  };
}

interface Funcionario {
  id: string;
  nome: string;
  whatsapp: string;
}

interface Props {
  lojaId: string;
}

// ✅ SERVICE PARA RESERVAS ATUALIZADO COM NOVAS FUNÇÕES
const reservationService = {
  async updateReservationStatus(reservaId: string, status: string) {
    const { data, error } = await supabase
      .from("reservas")
      .update({ status })
      .eq("id", reservaId)
      .select();

    if (error) throw error;

    // ✅ CORREÇÃO: Usando a variável data
    console.log('📝 Status da reserva atualizado:', data);
    return { success: true, message: `Status atualizado para ${status}`, data };
  },

  // ✅ FUNÇÃO: RESTAURAR ESTOQUE AO CANCELAR RESERVA
  async restoreStock(reservaId: string, quantidade: number) {
    try {
      console.log(`🔄 Restaurando estoque para reserva ${reservaId}, quantidade: ${quantidade}`);

      // Primeiro, buscar informações da reserva para obter o produto_id
      const { data: reservaData, error: reservaError } = await supabase
        .from("reservas")
        .select("produto_id, quantidade")
        .eq("id", reservaId)
        .single();

      if (reservaError) {
        console.error('❌ Erro ao buscar dados da reserva:', reservaError);
        throw new Error('Não foi possível encontrar os dados da reserva');
      }

      if (!reservaData) {
        throw new Error('Reserva não encontrada');
      }

      const { produto_id } = reservaData;

      // Buscar estoque atual do produto
      const { data: produtoData, error: produtoError } = await supabase
        .from("produtos")
        .select("estoque, nome")
        .eq("id", produto_id)
        .single();

      if (produtoError) {
        console.error('❌ Erro ao buscar dados do produto:', produtoError);
        throw new Error('Não foi possível encontrar o produto');
      }

      if (!produtoData) {
        throw new Error('Produto não encontrado');
      }

      const estoqueAtual = produtoData.estoque || 0;
      const novoEstoque = estoqueAtual + quantidade;

      console.log(`📦 Produto: ${produtoData.nome}, Estoque atual: ${estoqueAtual}, Novo estoque: ${novoEstoque}`);

      // Atualizar o estoque do produto
      const { data: updateData, error: updateError } = await supabase
        .from("produtos")
        .update({ estoque: novoEstoque })
        .eq("id", produto_id)
        .select();

      if (updateError) {
        console.error('❌ Erro ao atualizar estoque:', updateError);
        throw new Error('Erro ao restaurar estoque do produto');
      }

      // ✅ CORREÇÃO: Usando a variável updateData
      console.log('✅ Estoque atualizado com sucesso:', updateData);

      console.log('✅ Estoque restaurado com sucesso!');
      return {
        success: true,
        message: `Estoque restaurado: +${quantidade} unidades`,
        produtoNome: produtoData.nome,
        estoqueAnterior: estoqueAtual,
        novoEstoque: novoEstoque,
        updateData

      };

    } catch (error: any) {
      console.error('❌ Erro no restoreStock:', error);
      throw error;
    }
  },

  // ✅ NOVAS FUNÇÕES PARA LIMPEZA EM MASSA
  async limparReservasConcluidas(lojaId: string) {
    const { data, error } = await supabase
      .from("reservas")
      .delete()
      .eq("loja_id", lojaId)
      .eq("status", "concluida");

    if (error) throw error;

    // ✅ CORREÇÃO: Usando a variável data
    console.log('🗑️ Reservas concluídas removidas:', data);
    return { success: true, message: "Reservas concluídas removidas com sucesso", data };
  },

  async limparReservasExpiradas(lojaId: string) {
    // Primeiro, buscar reservas expiradas para restaurar estoque
    const { data: reservasExpiradas, error: fetchError } = await supabase
      .from("reservas")
      .select("id, produto_id, quantidade")
      .eq("loja_id", lojaId)
      .eq("status", "expirada");

    if (fetchError) throw fetchError;

    // Restaurar estoque para cada reserva expirada
    for (const reserva of reservasExpiradas || []) {
      try {
        await reservationService.restoreStock(reserva.id, reserva.quantidade);
      } catch (error) {
        console.warn(`⚠️ Erro ao restaurar estoque da reserva ${reserva.id}:`, error);
      }
    }

    // Agora deletar as reservas expiradas
    const { data, error } = await supabase
      .from("reservas")
      .delete()
      .eq("loja_id", lojaId)
      .eq("status", "expirada");

    if (error) throw error;

    // ✅ CORREÇÃO: Usando a variável data
    console.log('🗑️ Reservas expiradas removidas:', data);
    return {
      success: true,
      message: `Reservas expiradas removidas e estoque restaurado (${reservasExpiradas?.length || 0} itens)`,
      data
    };
  },

  async limparReservasCanceladas(lojaId: string) {
    const { data, error } = await supabase
      .from("reservas")
      .delete()
      .eq("loja_id", lojaId)
      .eq("status", "cancelada");

    if (error) throw error;

    // ✅ CORREÇÃO: Usando a variável data
    console.log('🗑️ Reservas canceladas removidas:', data);
    return { success: true, message: "Reservas canceladas removidas com sucesso", data };
  },

  async limparTodasReservas(lojaId: string) {
    // Primeiro, buscar todas as reservas ativas/pendentes para restaurar estoque
    const { data: reservasAtivas, error: fetchError } = await supabase
      .from("reservas")
      .select("id, produto_id, quantidade, status")
      .eq("loja_id", lojaId)
      .in("status", ["ativa", "pendente", "confirmada"]);

    if (fetchError) throw fetchError;

    // Restaurar estoque para reservas ativas
    let estoqueRestaurado = 0;
    for (const reserva of reservasAtivas || []) {
      try {
        await reservationService.restoreStock(reserva.id, reserva.quantidade);
        estoqueRestaurado += reserva.quantidade;
      } catch (error) {
        console.warn(`⚠️ Erro ao restaurar estoque da reserva ${reserva.id}:`, error);
      }
    }

    // Agora deletar TODAS as reservas
    const { data, error } = await supabase
      .from("reservas")
      .delete()
      .eq("loja_id", lojaId);

    if (error) throw error;

    // ✅ CORREÇÃO: Usando a variável data
    console.log('🗑️ Todas as reservas removidas:', data);
    return {
      success: true,
      message: `Todas as reservas removidas (estoque restaurado: +${estoqueRestaurado} unidades)`,
      data
    };
  }
};

export default function ReservationsList({ lojaId }: Props) {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [categorias, setCategorias] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(true);
  const [cancelingReservation, setCancelingReservation] = useState<string | null>(null);
  const [showCleanMenu, setShowCleanMenu] = useState(false);
  const [cleaning, setCleaning] = useState<string | null>(null);

  // ✅ CORREÇÃO: Usar apenas as funções necessárias do useSupabase
  const { confirmReservation, cancelReservation } = useSupabase();

  // ✅ Buscar funcionários
  const fetchFuncionarios = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("funcionarios")
        .select("*")
        .eq("loja_id", lojaId);

      if (error) {
        console.error('❌ Erro ao buscar funcionários:', error);
        return;
      }

      // ✅ CORREÇÃO: Usando a variável data
      console.log('👥 Funcionários carregados:', data?.length);
      setFuncionarios(data || []);
    } catch (error) {
      console.error('❌ Erro ao carregar funcionários:', error);
    }
  }, [lojaId]);

  // ✅ Buscar reservas
  const fetchReservas = useCallback(async () => {
    if (!isMounted) return;

    try {
      setLoading(true);
      console.log('🔍 Buscando reservas para loja:', lojaId);

      const { data: reservasData, error: reservasError } = await supabase
        .from("reservas")
        .select("*")
        .eq("loja_id", lojaId)
        .order("created_at", { ascending: false });

      if (reservasError) {
        console.error('❌ Erro ao buscar reservas:', reservasError);
        throw reservasError;
      }

      // ✅ CORREÇÃO: Usando a variável reservasData
      console.log('📦 Reservas básicas encontradas:', reservasData?.length || 0);

      if (!reservasData || reservasData.length === 0) {
        setReservas([]);
        setCategorias([]);
        return;
      }

      const reservasCompletas = await Promise.all(
        reservasData.map(async (reserva) => {
          await new Promise(resolve => setTimeout(resolve, 10));

          let produto = null;
          if (reserva.produto_id) {
            try {
              const { data: produtoData } = await supabase
                .from("produtos")
                .select("id, nome, preco, foto_url, categoria, estoque")
                .eq("id", reserva.produto_id)
                .single();
              produto = produtoData;
            } catch (error) {
              console.warn(`⚠️ Produto não encontrado: ${reserva.produto_id}`);
            }
          }

          let cliente = null;
          if (reserva.usuario_id) {
            try {
              const { data: clienteData } = await supabase
                .from("clientes")
                .select("id, nome, email, telefone")
                .eq("id", reserva.usuario_id)
                .single();
              cliente = clienteData;
            } catch (error) {
              console.warn(`⚠️ Cliente não encontrado: ${reserva.usuario_id}`);
            }
          }

          let funcionario = null;
          if (reserva.funcionario_id) {
            try {
              const { data: funcionarioData } = await supabase
                .from("funcionarios")
                .select("id, nome, whatsapp")
                .eq("id", reserva.funcionario_id)
                .single();
              funcionario = funcionarioData;
            } catch (error) {
              console.warn(`⚠️ Funcionário não encontrado: ${reserva.funcionario_id}`);
            }
          }

          return {
            ...reserva,
            produto,
            cliente,
            funcionario
          };
        })
      );

      if (isMounted) {
        console.log('✅ Reservas completas:', reservasCompletas.length);
        setReservas(reservasCompletas);

        const categoriasUnicas = Array.from(
          new Set(
            reservasCompletas
              .map(r => r.produto?.categoria)
              .filter(Boolean)
          )
        ) as string[];

        // ✅ CORREÇÃO: Usando a variável categoriasUnicas
        console.log('🏷️ Categorias encontradas:', categoriasUnicas);
        setCategorias(categoriasUnicas);
      }

    } catch (error) {
      console.error("❌ Erro ao carregar reservas:", error);
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }, [lojaId, isMounted]);

  // ✅ ATUALIZAR PRODUTO EM TEMPO REAL
  const updateProductStock = useCallback((productId: string, newStock: number) => {
    console.log(`🔄 Atualizando estoque em tempo real - Produto: ${productId}, Novo estoque: ${newStock}`);

    setReservas(prevReservas =>
      prevReservas.map(reserva =>
        reserva.produto?.id === productId
          ? {
              ...reserva,
              produto: {
                ...reserva.produto!,
                estoque: newStock
              }
            }
          : reserva
      )
    );
  }, []);

  // ✅ Setup realtime MELHORADO
  const setupRealtimeSubscription = useCallback(() => {
    if (!lojaId) return;

    console.log('🔔 Iniciando subscriptions em tempo real...');

    // Subscription para reservas
    const channelReservas = supabase
      .channel('reservas-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservas',
          filter: `loja_id=eq.${lojaId}`
        },
        (payload) => {
          console.log('🔄 Mudança detectada na reserva:', payload);
          setTimeout(fetchReservas, 500);
        }
      )
      .subscribe();

    // ✅ Subscription MELHORADA para produtos - atualiza em tempo real
    const channelProdutos = supabase
      .channel("produtos-stock-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "produtos"
        },
        (payload) => {
          console.log('📦 Atualização de produto em tempo real:', payload);

          const updatedProduct = payload.new as { id: string; estoque: number; nome: string };

          if (updatedProduct && updatedProduct.id) {
            console.log(`🔄 Produto atualizado: ${updatedProduct.nome}, Estoque: ${updatedProduct.estoque}`);

            // Atualizar o estoque em tempo real sem recarregar tudo
            updateProductStock(updatedProduct.id, updatedProduct.estoque);

            // Também recarregar as reservas para garantir consistência
            setTimeout(fetchReservas, 300);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "produtos",
          filter: `loja_id=eq.${lojaId}`
        },
        () => {
          console.log('🆕 Novo produto adicionado');
          setTimeout(fetchReservas, 500);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "produtos",
          filter: `loja_id=eq.${lojaId}`
        },
        () => {
          console.log('🗑️ Produto removido');
          setTimeout(fetchReservas, 500);
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Removendo subscriptions...');
      supabase.removeChannel(channelReservas);
      supabase.removeChannel(channelProdutos);
    };
  }, [lojaId, fetchReservas, updateProductStock]);

  useEffect(() => {
    setIsMounted(true);

    if (lojaId) {
      fetchReservas();
      fetchFuncionarios();
      const unsubscribe = setupRealtimeSubscription();

      return () => {
        setIsMounted(false);
        if (unsubscribe) unsubscribe();
      };
    }
  }, [lojaId, fetchReservas, fetchFuncionarios, setupRealtimeSubscription]);

  // ✅ CORREÇÃO: Função auxiliar para enviar notificações
  const sendBrowserNotification = useCallback((title: string, options: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, options);
    }
  }, []);

  // ✅ HANDLE TIMER EXPIRED CORRIGIDO
  const handleTimerExpired = useCallback(async (reservaId: string) => {
    console.log(`⏰ Timer expirado para reserva: ${reservaId}`);

    try {
      const result = await reservationService.updateReservationStatus(reservaId, 'expirada');

      if (result.success) {
        // ✅ CORREÇÃO: Usando a variável result.data
        console.log('📝 Dados da reserva expirada:', result.data);

        setReservas(prev => prev.map(reserva =>
          reserva.id === reservaId
            ? { ...reserva, status: 'expirada' }
            : reserva
        ));

        const reservaExpirada = reservas.find(r => r.id === reservaId);
        if (reservaExpirada) {
          // ✅ CORREÇÃO: Usar função auxiliar para notificação do navegador
          sendBrowserNotification(
            "⏰ Reserva expirada",
            {
              body: `A reserva do produto "${reservaExpirada.produto?.nome}" para o cliente "${reservaExpirada.cliente?.nome}" expirou!`,
              icon: "/icon-192x192.png"
            }
          );
        }
      }
    } catch (error) {
      console.error('❌ Erro ao expirar reserva:', error);
    }
  }, [reservas, sendBrowserNotification]);

  // ✅ HANDLE CONFIRMAR RESERVA CORRIGIDO - USANDO FUNÇÃO DO useSupabase
  const handleConfirm = async (reserva: Reserva) => {
    if (!window.confirm(`Confirmar que o cliente ${reserva.cliente?.nome} pegou o produto?`)) {
      return;
    }

    try {
      // ✅ CORREÇÃO: Usar função do useSupabase
      const result = await confirmReservation(reserva.id);

      if (!result.success) {
        throw new Error(result.message);
      }

      // ✅ CORREÇÃO: Usando a variável result.data
      console.log('✅ Dados da reserva confirmada:', result.data);

      console.log('✅ Reserva confirmada/concluída:', reserva.id);

      setReservas(prev => prev.map(r =>
        r.id === reserva.id ? {
          ...r,
          status: 'concluida',
          fim_reserva: new Date().toISOString()
        } : r
      ));

      // ✅ CORREÇÃO: Usar função auxiliar para notificação do navegador
      sendBrowserNotification("✅ Reserva concluída com sucesso!", {
        body: `O cliente ${reserva.cliente?.nome} retirou o produto ${reserva.produto?.nome}`,
        icon: "/icon-192x192.png"
      });

    } catch (error: any) {
      console.error('❌ Erro ao confirmar reserva:', error);
      alert(error.message || "Erro ao confirmar reserva");
    }
  };

  // ✅ HANDLE CANCELAR RESERVA ATUALIZADO - USANDO FUNÇÃO DO useSupabase E RESTAURANDO ESTOQUE
  const handleCancel = async (reserva: Reserva) => {
    if (!window.confirm(
      `Cancelar reserva do cliente ${reserva.cliente?.nome}?\n\n` +
      `✅ O estoque do produto "${reserva.produto?.nome}" será restaurado em ${reserva.quantidade} unidade(s).`
    )) {
      return;
    }

    setCancelingReservation(reserva.id);

    try {
      // ✅ CORREÇÃO: Usar função do useSupabase para cancelar
      const cancelResult = await cancelReservation(reserva.id);

      if (!cancelResult.success) {
        throw new Error(cancelResult.message);
      }

      // ✅ CORREÇÃO: Usando a variável cancelResult.data
      console.log('❌ Dados da reserva cancelada:', cancelResult.data);

      // ✅ Restaurar estoque após cancelamento
      const stockResult = await reservationService.restoreStock(reserva.id, reserva.quantidade);

      // ✅ CORREÇÃO: Usando a variável stockResult
      console.log('📦 Resultado da restauração de estoque:', stockResult);

      console.log('✅ Reserva cancelada e estoque restaurado:', reserva.id);

      // ✅ ATUALIZAR ESTOQUE EM TEMPO REAL
      if (reserva.produto?.id) {
        const novoEstoque = (reserva.produto.estoque || 0) + reserva.quantidade;
        updateProductStock(reserva.produto.id, novoEstoque);
      }

      // Atualizar a lista de reservas
      setReservas(prev => prev.map(r =>
        r.id === reserva.id ? { ...r, status: 'cancelada' } : r
      ));

      // ✅ CORREÇÃO: Usar função auxiliar para notificação do navegador
      sendBrowserNotification("✅ Reserva cancelada - Estoque restaurado", {
        body: `Reserva de ${reserva.produto?.nome} cancelada. +${reserva.quantidade} unidade(s) retornaram ao estoque.`,
        icon: "/icon-192x192.png"
      });

      alert(`✅ Reserva cancelada com sucesso!\n\nEstoque restaurado: +${reserva.quantidade} unidade(s) do produto "${reserva.produto?.nome}"`);

    } catch (error: any) {
      console.error('❌ Erro ao cancelar reserva:', error);

      let errorMessage = "Erro ao cancelar reserva";
      if (error.message?.includes('estoque')) {
        errorMessage = `Erro ao restaurar estoque: ${error.message}`;
      } else if (error.message?.includes('Reserva não encontrada')) {
        errorMessage = 'Reserva não encontrada no sistema';
      }

      alert(errorMessage || "Erro ao cancelar reserva");
    } finally {
      setCancelingReservation(null);
    }
  };

  // ✅ NOVAS FUNÇÕES PARA LIMPEZA EM MASSA
  const handleLimparConcluidas = async () => {
    const concluidasCount = reservas.filter(r => r.status === 'concluida').length;

    if (concluidasCount === 0) {
      alert("Não há reservas concluídas para limpar.");
      return;
    }

    if (!window.confirm(`Deseja remover todas as ${concluidasCount} reservas concluídas?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    setCleaning('concluidas');
    try {
      const result = await reservationService.limparReservasConcluidas(lojaId);

      // ✅ CORREÇÃO: Usando a variável result.data
      console.log('🗑️ Dados das reservas concluídas removidas:', result.data);

      alert(result.message);
      fetchReservas(); // Recarregar a lista
    } catch (error: any) {
      console.error('❌ Erro ao limpar reservas concluídas:', error);
      alert(error.message || "Erro ao limpar reservas concluídas");
    } finally {
      setCleaning(null);
      setShowCleanMenu(false);
    }
  };

  const handleLimparExpiradas = async () => {
    const expiradasCount = reservas.filter(r => r.status === 'expirada').length;

    if (expiradasCount === 0) {
      alert("Não há reservas expiradas para limpar.");
      return;
    }

    if (!window.confirm(
      `Deseja remover todas as ${expiradasCount} reservas expiradas?\n\n` +
      `✅ O estoque dos produtos será restaurado automaticamente.`
    )) {
      return;
    }

    setCleaning('expiradas');
    try {
      const result = await reservationService.limparReservasExpiradas(lojaId);

      // ✅ CORREÇÃO: Usando a variável result.data
      console.log('🗑️ Dados das reservas expiradas removidas:', result.data);

      alert(result.message);
      fetchReservas(); // Recarregar a lista
    } catch (error: any) {
      console.error('❌ Erro ao limpar reservas expiradas:', error);
      alert(error.message || "Erro ao limpar reservas expiradas");
    } finally {
      setCleaning(null);
      setShowCleanMenu(false);
    }
  };

  const handleLimparCanceladas = async () => {
    const canceladasCount = reservas.filter(r => r.status === 'cancelada').length;

    if (canceladasCount === 0) {
      alert("Não há reservas canceladas para limpar.");
      return;
    }

    if (!window.confirm(`Deseja remover todas as ${canceladasCount} reservas canceladas?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    setCleaning('canceladas');
    try {
      const result = await reservationService.limparReservasCanceladas(lojaId);

      // ✅ CORREÇÃO: Usando a variável result.data
      console.log('🗑️ Dados das reservas canceladas removidas:', result.data);

      alert(result.message);
      fetchReservas(); // Recarregar a lista
    } catch (error: any) {
      console.error('❌ Erro ao limpar reservas canceladas:', error);
      alert(error.message || "Erro ao limpar reservas canceladas");
    } finally {
      setCleaning(null);
      setShowCleanMenu(false);
    }
  };

  const handleLimparTodas = async () => {
    if (reservas.length === 0) {
      alert("Não há reservas para limpar.");
      return;
    }

    const ativasCount = reservas.filter(r =>
      ['ativa', 'pendente', 'confirmada'].includes(r.status)
    ).length;

    if (!window.confirm(
      `🚨 ATENÇÃO: Esta ação removerá TODAS as ${reservas.length} reservas!\n\n` +
      `📊 Status das reservas:\n` +
      `• Ativas/Pendentes: ${ativasCount} (estoque será restaurado)\n` +
      `• Concluídas/Expiradas/Canceladas: ${reservas.length - ativasCount}\n\n` +
      `Esta ação NÃO pode ser desfeita. Confirma?`
    )) {
      return;
    }

    setCleaning('todas');
    try {
      const result = await reservationService.limparTodasReservas(lojaId);

      // ✅ CORREÇÃO: Usando a variável result.data
      console.log('🗑️ Dados de todas as reservas removidas:', result.data);

      alert(result.message);
      fetchReservas(); // Recarregar a lista
    } catch (error: any) {
      console.error('❌ Erro ao limpar todas as reservas:', error);
      alert(error.message || "Erro ao limpar todas as reservas");
    } finally {
      setCleaning(null);
      setShowCleanMenu(false);
    }
  };

  // ✅ WhatsApp - CORRIGIDO: Criar objeto Product completo
  const handleWhatsApp = (reserva: Reserva, funcionario?: Funcionario) => {
    const funcionarioParaContato = funcionario || reserva.funcionario;

    if (!funcionarioParaContato?.whatsapp) {
      alert("Funcionário não tem WhatsApp cadastrado");
      return;
    }

    const pickupTime = new Date(reserva.fim_reserva).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    if (generateWhatsAppLink) {
      // ✅ CORREÇÃO: Criar objeto Product completo com todas as propriedades obrigatórias
      const productData = {
        id: reserva.produto?.id || '',
        nome: reserva.produto?.nome || 'Produto', // ✅ Obrigatório
        name: reserva.produto?.nome || 'Produto',
        estoque: reserva.produto?.estoque || 0, // ✅ Obrigatório
        preco: reserva.produto?.preco || 0,
        descricao: '',
        categoria: reserva.produto?.categoria || '',
        foto_url: reserva.produto?.foto_url || '',
        image: reserva.produto?.foto_url || '',
        loja_id: reserva.loja_id,
        created_at: reserva.created_at,
        updated_at: new Date().toISOString(),
        ativo: true,
        tamanhos: reserva.tamanho ? [reserva.tamanho] : []
      };

      const whatsappLink = generateWhatsAppLink(
        funcionarioParaContato.whatsapp,
        {
          clientName: reserva.cliente?.nome || 'Cliente',
          product: productData, // ✅ Agora com todas as propriedades obrigatórias
          size: reserva.tamanho || "Único",
          quantity: reserva.quantidade,
          pickupTime: pickupTime,
          reservationId: reserva.id,
          storeName: "Loja Connect",
          employeeName: funcionarioParaContato.nome
        }
      );
      window.open(whatsappLink, '_blank');
    } else {
      const horario = new Date(reserva.fim_reserva).toLocaleString("pt-BR");
      const mensagem = `Olá ${funcionarioParaContato.nome}, o cliente ${reserva.cliente?.nome} reservou ${reserva.quantidade}x ${reserva.produto?.nome} (tamanho ${reserva.tamanho || "único"}) para retirar às ${horario}. ID reserva: ${reserva.id}.`;
      const url = `https://wa.me/${funcionarioParaContato.whatsapp}?text=${encodeURIComponent(mensagem)}`;
      window.open(url, "_blank");
    }
  };

  // ✅ Filtros
  const filteredReservas = reservas.filter((reserva) => {
    const buscaLower = busca.toLowerCase();
    const nomeProduto = reserva.produto?.nome?.toLowerCase() || '';
    const nomeCliente = reserva.cliente?.nome?.toLowerCase() || '';

    const buscaMatch =
      nomeProduto.includes(buscaLower) ||
      nomeCliente.includes(buscaLower) ||
      reserva.id.toLowerCase().includes(buscaLower);

    const categoriaMatch = filtroCategoria ?
      reserva.produto?.categoria?.toLowerCase() === filtroCategoria.toLowerCase() : true;

    const statusMatch = filtroStatus ?
      reserva.status === filtroStatus : true;

    return buscaMatch && categoriaMatch && statusMatch;
  });

  // ✅ GET STATUS COLOR CORRIGIDO
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa':
      case 'pendente': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'confirmada': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'concluida': return 'bg-green-100 text-green-800 border border-green-200';
      case 'cancelada': return 'bg-red-100 text-red-800 border border-red-200';
      case 'expirada': return 'bg-gray-100 text-gray-800 border border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // ✅ GET STATUS TEXT CORRIGIDO
  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'ativa': 'Ativa',
      'pendente': 'Pendente',
      'confirmada': 'Confirmada',
      'concluida': 'Concluída',
      'cancelada': 'Cancelada',
      'expirada': 'Expirada'
    };
    return statusMap[status] || status;
  };

  // ✅ Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando reservas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Produtos Reservados</h1>
                <p className="text-gray-600">Gerencie as reservas dos seus clientes</p>
                <div className="text-sm text-green-600 mt-1">
                  🔄 <strong>Sistema em tempo real</strong> - Estoque atualiza automaticamente
                </div>
              </div>

              {/* ✅ BOTÃO DE LIMPEZA EM MASSA */}
              <div className="relative">
                <button
                  onClick={() => setShowCleanMenu(!showCleanMenu)}
                  disabled={reservas.length === 0 || cleaning !== null}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200 disabled:bg-orange-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {cleaning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Limpando...
                    </>
                  ) : (
                    <>
                      🧹 Limpar Reservas
                      {reservas.length > 0 && (
                        <span className="bg-orange-700 text-white text-xs px-2 py-1 rounded-full">
                          {reservas.length}
                        </span>
                      )}
                    </>
                  )}
                </button>

                {/* Menu de limpeza */}
                {showCleanMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-1">
                        Opções de limpeza:
                      </div>

                      <button
                        onClick={handleLimparConcluidas}
                        className="w-full text-left px-3 py-2 text-sm text-green-700 hover:bg-green-50 rounded-md flex items-center gap-2"
                      >
                        <span>✅</span>
                        Limpar Concluídas
                        <span className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          {reservas.filter(r => r.status === 'concluida').length}
                        </span>
                      </button>

                      <button
                        onClick={handleLimparExpiradas}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center gap-2"
                      >
                        <span>⏰</span>
                        Limpar Expiradas
                        <span className="ml-auto bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                          {reservas.filter(r => r.status === 'expirada').length}
                        </span>
                      </button>

                      <button
                        onClick={handleLimparCanceladas}
                        className="w-full text-left px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-md flex items-center gap-2"
                      >
                        <span>❌</span>
                        Limpar Canceladas
                        <span className="ml-auto bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                          {reservas.filter(r => r.status === 'cancelada').length}
                        </span>
                      </button>

                      <div className="border-t border-gray-200 my-1"></div>

                      <button
                        onClick={handleLimparTodas}
                        className="w-full text-left px-3 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md flex items-center gap-2 font-medium"
                      >
                        <span>🚨</span>
                        Limpar TODAS
                        <span className="ml-auto bg-red-800 text-white text-xs px-2 py-1 rounded">
                          {reservas.length}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="p-6 border-b border-gray-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Busca */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <input
                  type="text"
                  placeholder="Cliente, produto ou ID..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filtro por Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas as categorias</option>
                  {categorias.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </div>

              {/* ✅ FILTRO DE STATUS CORRIGIDO */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os status</option>
                  <option value="ativa">Ativa</option>
                  <option value="pendente">Pendente</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="concluida">Concluída</option>
                  <option value="cancelada">Cancelada</option>
                  <option value="expirada">Expirada</option>
                </select>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-gray-600">
                Total: {reservas.length} reservas
              </span>
              <span className="text-yellow-600 font-medium">
                Pendentes: {reservas.filter(r => r.status === 'pendente' || r.status === 'ativa').length}
              </span>
              <span className="text-green-600 font-medium">
                Concluídas: {reservas.filter(r => r.status === 'concluida').length}
              </span>
              <span className="text-blue-600 font-medium">
                Confirmadas: {reservas.filter(r => r.status === 'confirmada').length}
              </span>
              <span className="text-gray-600 font-medium">
                Expiradas: {reservas.filter(r => r.status === 'expirada').length}
              </span>
              <span className="text-red-600 font-medium">
                Canceladas: {reservas.filter(r => r.status === 'cancelada').length}
              </span>
            </div>
          </div>

          {/* Lista de Reservas */}
          <div className="p-6">
            {filteredReservas.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 text-gray-300">📦</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {reservas.length === 0 ? "Nenhuma reserva encontrada" : "Nenhuma reserva com esses filtros"}
                </h3>
                <p className="text-gray-600">
                  {reservas.length === 0
                    ? "Ainda não há reservas para sua loja."
                    : "Tente ajustar os filtros de busca."}
                </p>
                <button
                  onClick={fetchReservas}
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  🔄 Recarregar
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReservas.map((reserva) => (
                  <div
                    key={reserva.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Informações do Produto e Cliente */}
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          {reserva.produto?.foto_url ? (
                            <img
                              src={reserva.produto.foto_url}
                              alt={reserva.produto.nome}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 text-2xl">📦</span>
                            </div>
                          )}

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900 text-lg">
                                {reserva.produto?.nome || 'Produto não encontrado'}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(reserva.status)}`}>
                                {getStatusText(reserva.status)}
                              </span>
                            </div>

                            {/* Informações do Cliente */}
                            {reserva.cliente && (
                              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-800 font-medium">
                                  👤 {reserva.cliente.nome}
                                </p>
                                <p className="text-sm text-gray-600">
                                  📧 {reserva.cliente.email}
                                  {reserva.cliente.telefone && ` • 📞 ${reserva.cliente.telefone}`}
                                </p>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                              <span>
                                <strong>Quantidade:</strong> {reserva.quantidade}
                              </span>
                              {reserva.tamanho && (
                                <span>
                                  <strong>Tamanho:</strong> {reserva.tamanho}
                                </span>
                              )}
                              {reserva.produto?.categoria && (
                                <span>
                                  <strong>Categoria:</strong> {reserva.produto.categoria}
                                </span>
                              )}
                              {reserva.produto?.preco && (
                                <span>
                                  <strong>Preço:</strong> R$ {reserva.produto.preco.toFixed(2)}
                                </span>
                              )}
                              {reserva.produto?.estoque !== undefined && (
                                <span className={reserva.status === 'cancelada' ? 'text-green-600 font-semibold' : ''}>
                                  <strong>Estoque:</strong> {reserva.produto.estoque}
                                  {reserva.status === 'cancelada' && ' ↗️'}
                                </span>
                              )}
                              <span>
                                <strong>ID:</strong> {reserva.id.slice(0, 8)}...
                              </span>
                            </div>

                            {/* Timer para reservas pendentes/ativas */}
                            {(reserva.status === 'pendente' || reserva.status === 'ativa') && reserva.fim_reserva && (
                              <div className="mt-3">
                                <Timer
                                  fimReserva={new Date(reserva.fim_reserva).getTime()}
                                  onExpired={() => handleTimerExpired(reserva.id)}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ✅ BOTÕES DE AÇÃO CORRIGIDOS */}
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        {(reserva.status === 'ativa' || reserva.status === 'pendente') && (
                          <>
                            <button
                              onClick={() => handleConfirm(reserva)}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200"
                            >
                              ✅ Cliente Pegou
                            </button>
                            <button
                              onClick={() => handleCancel(reserva)}
                              disabled={cancelingReservation === reserva.id}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200 disabled:bg-red-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {cancelingReservation === reserva.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Cancelando...
                                </>
                              ) : (
                                '❌ Cancelar'
                              )}
                            </button>

                            {/* Botões WhatsApp para todos os funcionários */}
                            {funcionarios.map((funcionario) => (
                              <button
                                key={funcionario.id}
                                onClick={() => handleWhatsApp(reserva, funcionario)}
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200 flex items-center justify-center gap-2"
                              >
                                <span>📞</span>
                                Avisar {funcionario.nome}
                              </button>
                            ))}
                          </>
                        )}

                        {reserva.status === 'confirmada' && (
                          <button
                            onClick={() => handleConfirm(reserva)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200"
                          >
                            ✅ Marcar como Concluída
                          </button>
                        )}

                        <div className="text-xs text-gray-500 text-right mt-2">
                          Reservado em: {new Date(reserva.created_at).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
