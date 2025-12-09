// src/services/reservationService.ts - VERSÃO CORRIGIDA
import { CreateReservationData } from '../types/Reservation';
import { notificationService } from './notificationService';
import { supabase } from './supabase';

export interface Reserva {
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
  ativo: boolean;
  renovacoes?: number;
  ultima_notificacao?: string;
  ultima_renovacao?: string;
  updated_at?: string;
  produto?: {
    nome: string;
    preco?: number;
    foto_url?: string;
    categoria?: string;
    estoque?: number;
  }[];
  cliente?: {
    id?: string;
    nome: string;
    email?: string;
    telefone?: string;
  }[];
  funcionario?: {
    nome?: string;
    whatsapp?: string;
  }[];
}

export interface CreateReservaData {
  produto_id: string;
  cliente_id: string;
  funcionario_id?: string;
  quantidade: number;
  loja_id: string;
  tamanho?: string;
}

class ReservationService {
  private readonly STATUS_VALIDOS = {
    ATIVA: 'ativa',
    PENDENTE: 'pendente',
    CONFIRMADA: 'confirmada',
    CONCLUIDA: 'concluida',
    CANCELADA: 'cancelada',
    EXPIRADA: 'expirada'
  };

  private reservationInterval: NodeJS.Timeout | null = null;

  // ✅ MÉTODO AUXILIAR: Extrair dados dos relacionamentos (ARRAYS)
  private extractRelatedData(data: any) {
    return {
      ...data,
      produto: data.produto?.[0] || null,
      cliente: data.cliente?.[0] || null,
      funcionario: data.funcionario?.[0] || null
    };
  }

  // ✅ CRIAR RESERVA (Unificação das duas versões)
  async createReservation(reservaData: CreateReservationData | CreateReservaData): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('reservas')
        .insert({
          ...reservaData,
          status: this.STATUS_VALIDOS.ATIVA,
          fim_reserva: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 horas
          created_at: new Date().toISOString(),
          ativo: true,
          renovacoes: 0
        })
        .select(`
          *,
          produto:produtos(nome, preco, foto_url, categoria, estoque),
          cliente:clientes(nome, email, telefone, id),
          funcionario:funcionarios(nome, whatsapp)
        `)
        .single();

      if (error) throw error;

      // ✅ CORREÇÃO: Extrair dados dos relacionamentos (arrays)
      const extractedData = this.extractRelatedData(data);

      // ✅ ENVIAR NOTIFICAÇÃO DE CONFIRMAÇÃO PARA O CLIENTE
      if (extractedData.cliente?.id && extractedData.produto?.nome) {
        try {
          await notificationService.sendPushNotification(
            '✅ Reserva Confirmada!',
            `Sua reserva de ${extractedData.produto.nome} foi confirmada! Expira em 4 horas.`,
            {
              category: 'reserva',
              url: `/cliente/reservas`,
              reservationId: extractedData.id,
              productName: extractedData.produto.nome,
              clientId: extractedData.cliente.id
            }
          );
        } catch (notifError) {
          console.warn('⚠️ Erro ao enviar notificação:', notifError);
          // Não falha a reserva se a notificação der erro
        }
      }

      return {
        success: true,
        data: extractedData,
        message: 'Reserva criada com sucesso!'
      };
    } catch (error: any) {
      console.error('❌ Erro ao criar reserva:', error);
      return {
        success: false,
        message: error.message || 'Erro ao criar reserva'
      };
    }
  }

  // ✅ ALIAS PARA criarReserva (compatibilidade)
  async criarReserva(reservaData: CreateReservaData): Promise<{ success: boolean; data?: Reserva; message?: string }> {
    const result = await this.createReservation(reservaData);
    return {
      success: result.success,
      data: result.data,
      message: result.message
    };
  }

  // ✅ ATUALIZAR STATUS DA RESERVA (Função principal corrigida)
  async updateReservationStatus(reservaId: string, novoStatus: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      // ✅ VERIFICAR SE O STATUS É VÁLIDO
      const statusValido = Object.values(this.STATUS_VALIDOS).includes(novoStatus as any);
      if (!statusValido) {
        throw new Error(`Status inválido: ${novoStatus}. Status válidos: ${Object.values(this.STATUS_VALIDOS).join(', ')}`);
      }

      const updateData: any = {
        status: novoStatus,
        updated_at: new Date().toISOString()
      };

      // ✅ SE FOR "CLIENTE PEGOU" (CONCLUIDA), PARAR O TEMPO
      if (novoStatus === this.STATUS_VALIDOS.CONCLUIDA) {
        updateData.fim_reserva = new Date().toISOString(); // Para o tempo imediatamente
        updateData.ativo = false;
      }

      // ✅ SE FOR CANCELADA OU EXPIRADA, DESATIVAR
      if (novoStatus === this.STATUS_VALIDOS.CANCELADA || novoStatus === this.STATUS_VALIDOS.EXPIRADA) {
        updateData.ativo = false;
      }

      const { data, error } = await supabase
        .from('reservas')
        .update(updateData)
        .eq('id', reservaId)
        .select(`
          *,
          produto:produtos(nome, preco, foto_url, categoria),
          cliente:clientes(nome, email, telefone, id),
          funcionario:funcionarios(nome, whatsapp)
        `)
        .single();

      if (error) throw error;

      // ✅ CORREÇÃO: Extrair dados dos relacionamentos (arrays)
      const extractedData = this.extractRelatedData(data);

      // ✅ NOTIFICAR CLIENTE SOBRE MUDANÇA DE STATUS
      if (extractedData.cliente?.id && extractedData.produto?.nome) {
        try {
          let notificationTitle = '';
          let notificationMessage = '';

          switch (novoStatus) {
            case this.STATUS_VALIDOS.CONCLUIDA:
              notificationTitle = '🎉 Reserva Concluída!';
              notificationMessage = `Obrigado por retirar ${extractedData.produto.nome}!`;
              break;
            case this.STATUS_VALIDOS.CANCELADA:
              notificationTitle = '❌ Reserva Cancelada';
              notificationMessage = `Sua reserva de ${extractedData.produto.nome} foi cancelada.`;
              break;
            case this.STATUS_VALIDOS.EXPIRADA:
              notificationTitle = '⏰ Reserva Expirada';
              notificationMessage = `Sua reserva de ${extractedData.produto.nome} expirou.`;
              break;
            case this.STATUS_VALIDOS.CONFIRMADA:
              notificationTitle = '✅ Reserva Confirmada!';
              notificationMessage = `Sua reserva de ${extractedData.produto.nome} foi confirmada pela loja.`;
              break;
          }

          if (notificationTitle) {
            await notificationService.sendPushNotification(
              notificationTitle,
              notificationMessage,
              {
                category: 'reserva',
                url: `/cliente/reservas`,
                reservationId: reservaId,
                productName: extractedData.produto.nome,
                clientId: extractedData.cliente.id
              }
            );
          }
        } catch (notifError) {
          console.warn('⚠️ Erro ao enviar notificação de status:', notifError);
        }
      }

      return {
        success: true,
        data: extractedData,
        message: `Reserva ${novoStatus} com sucesso!`
      };
    } catch (error: any) {
      console.error('❌ Erro ao atualizar status da reserva:', error);
      return {
        success: false,
        message: error.message || 'Erro ao atualizar reserva'
      };
    }
  }

  // ✅ CONFIRMAR RESERVA (CLIENTE PEGOU)
  async confirmReservation(reservaId: string): Promise<{ success: boolean; data?: any; message?: string }> {
    return await this.updateReservationStatus(reservaId, this.STATUS_VALIDOS.CONCLUIDA);
  }

  // ✅ CANCELAR RESERVA
  async cancelReservation(reservaId: string): Promise<{ success: boolean; data?: any; message?: string }> {
    return await this.updateReservationStatus(reservaId, this.STATUS_VALIDOS.CANCELADA);
  }

  // ✅ ALIAS PARA cancelarReserva (compatibilidade)
  async cancelarReserva(reservaId: string): Promise<{ success: boolean; message?: string }> {
    const result = await this.cancelReservation(reservaId);
    return {
      success: result.success,
      message: result.message
    };
  }

  // ✅ RENOVAR RESERVA
  async renovarReserva(reservaId: string, horas: number = 2): Promise<{ success: boolean; message?: string }> {
    try {
      const { data: reserva, error: fetchError } = await supabase
        .from('reservas')
        .select('renovacoes, produto:produtos(nome), cliente:clientes(id, nome)')
        .eq('id', reservaId)
        .single();

      if (fetchError) throw fetchError;

      // ✅ CORREÇÃO: Extrair dados dos relacionamentos (arrays)
      const extractedReserva = this.extractRelatedData(reserva);

      const { error } = await supabase
        .from('reservas')
        .update({
          fim_reserva: new Date(Date.now() + horas * 60 * 60 * 1000).toISOString(),
          renovacoes: (extractedReserva?.renovacoes || 0) + 1,
          ultima_renovacao: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', reservaId);

      if (error) throw error;

      // ✅ NOTIFICAR CLIENTE SOBRE RENOVAÇÃO
      if (extractedReserva?.cliente?.id && extractedReserva?.produto?.nome) {
        try {
          await notificationService.sendPushNotification(
            '🔄 Reserva Renovada!',
            `Sua reserva de ${extractedReserva.produto.nome} foi renovada por mais ${horas} horas.`,
            {
              category: 'reserva',
              url: `/cliente/reservas`,
              reservationId: reservaId,
              productName: extractedReserva.produto.nome,
              clientId: extractedReserva.cliente.id
            }
          );
        } catch (notifError) {
          console.warn('⚠️ Erro ao enviar notificação de renovação:', notifError);
        }
      }

      return {
        success: true,
        message: `Reserva renovada por mais ${horas} horas!`
      };
    } catch (error: any) {
      console.error('❌ Erro ao renovar reserva:', error);
      return {
        success: false,
        message: error.message || 'Erro ao renovar reserva'
      };
    }
  }

  // ✅ AGENDAR PARA DEPOIS
  async agendarParaDepois(reservaId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { error } = await supabase
        .from('reservas')
        .update({
          status: this.STATUS_VALIDOS.PENDENTE,
          ativo: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservaId);

      if (error) throw error;

      return {
        success: true,
        message: 'Reserva agendada para depois!'
      };
    } catch (error: any) {
      console.error('❌ Erro ao agendar reserva:', error);
      return {
        success: false,
        message: error.message || 'Erro ao agendar reserva'
      };
    }
  }

  // ✅ VERIFICAR E NOTIFICAR RESERVAS PRÓXIMAS DO VENCIMENTO
  async checkAndNotifyExpiringReservations(): Promise<void> {
    try {
      console.log('⏰ Verificando reservas próximas do vencimento...');

      // Buscar reservas ativas que expiram em breve
      const now = new Date();
      const oneHour = new Date(now.getTime() + 60 * 60 * 1000);

      const { data: reservasProximas, error } = await supabase
        .from('reservas')
        .select(`
          id,
          fim_reserva,
          produto:produtos(nome),
          cliente:clientes(id, nome),
          status,
          ultima_notificacao
        `)
        .eq('status', this.STATUS_VALIDOS.ATIVA)
        .eq('ativo', true)
        .lte('fim_reserva', oneHour.toISOString())
        .gte('fim_reserva', now.toISOString());

      if (error) {
        console.error('❌ Erro ao buscar reservas próximas:', error);
        return;
      }

      if (!reservasProximas || reservasProximas.length === 0) {
        console.log('✅ Nenhuma reserva próxima do vencimento');
        return;
      }

      console.log(`⏰ ${reservasProximas.length} reservas próximas do vencimento`);

      // Notificar cada reserva
      for (const reserva of reservasProximas) {
        // ✅ CORREÇÃO: Extrair dados dos relacionamentos (arrays)
        const extractedReserva = this.extractRelatedData(reserva);

        if (extractedReserva.cliente?.id && extractedReserva.produto?.nome) {
          const fimReserva = new Date(extractedReserva.fim_reserva);
          const minutesLeft = Math.round((fimReserva.getTime() - now.getTime()) / (60 * 1000));

          // Só notificar se faltar menos de 60 minutos e mais de 0
          if (minutesLeft <= 60 && minutesLeft > 0) {
            // Evitar notificação repetida muito rápida (últimos 15 minutos)
            const ultimaNotificacao = extractedReserva.ultima_notificacao ? new Date(extractedReserva.ultima_notificacao) : null;
            const quinzeMinutos = 15 * 60 * 1000;

            if (!ultimaNotificacao || (now.getTime() - ultimaNotificacao.getTime()) > quinzeMinutos) {
              await notificationService.notifyReservationExpiring(
                extractedReserva.id,
                extractedReserva.produto.nome,
                extractedReserva.cliente.id,
                minutesLeft
              );

              // Marcar como notificada para evitar spam
              await supabase
                .from('reservas')
                .update({ ultima_notificacao: new Date().toISOString() })
                .eq('id', extractedReserva.id);
            }
          }
        }
      }

      console.log(`✅ ${reservasProximas.length} reservas verificadas para notificação`);

    } catch (error) {
      console.error('❌ Erro no sistema de notificação de reservas:', error);
    }
  }

  // ✅ EXPIRAR RESERVAS AUTOMATICAMENTE
  async expirarReservasAutomaticamente(): Promise<void> {
    try {
      const { data: reservasExpiradas, error: fetchError } = await supabase
        .from('reservas')
        .select('id, produto:produtos(nome), cliente:clientes(id, nome)')
        .lt('fim_reserva', new Date().toISOString())
        .eq('status', this.STATUS_VALIDOS.ATIVA)
        .eq('ativo', true);

      if (fetchError) {
        console.error('❌ Erro ao buscar reservas expiradas:', fetchError);
        return;
      }

      // Notificar clientes antes de expirar
      for (const reserva of reservasExpiradas || []) {
        // ✅ CORREÇÃO: Extrair dados dos relacionamentos (arrays)
        const extractedReserva = this.extractRelatedData(reserva);

        if (extractedReserva.cliente?.id && extractedReserva.produto?.nome) {
          try {
            await notificationService.sendPushNotification(
              '⏰ Reserva Expirada',
              `Sua reserva de ${extractedReserva.produto.nome} expirou.`,
              {
                category: 'reserva',
                url: `/cliente/reservas`,
                reservationId: extractedReserva.id,
                productName: extractedReserva.produto.nome,
                clientId: extractedReserva.cliente.id
              }
            );
          } catch (notifError) {
            console.warn('⚠️ Erro ao enviar notificação de expiração:', notifError);
          }
        }
      }

      // Atualizar status para expirado
      const { error } = await supabase
        .from('reservas')
        .update({
          status: this.STATUS_VALIDOS.EXPIRADA,
          ativo: false,
          updated_at: new Date().toISOString()
        })
        .lt('fim_reserva', new Date().toISOString())
        .eq('status', this.STATUS_VALIDOS.ATIVA)
        .eq('ativo', true);

      if (error) {
        console.error('❌ Erro ao expirar reservas:', error);
      } else {
        console.log(`✅ ${reservasExpiradas?.length || 0} reservas expiradas automaticamente`);
      }
    } catch (error) {
      console.error('❌ Erro no processo de expiração:', error);
    }
  }

  // ✅ BUSCAR RESERVAS DA LOJA
  async getReservasByLoja(lojaId: string): Promise<Reserva[]> {
    try {
      const { data, error } = await supabase
        .from('reservas')
        .select(`
          *,
          produto:produtos(nome, preco, foto_url, categoria, estoque),
          cliente:clientes(nome, email, telefone, id),
          funcionario:funcionarios(nome, whatsapp)
        `)
        .eq('loja_id', lojaId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // ✅ CORREÇÃO: Processar todos os dados para extrair relacionamentos
      const processedData = (data || []).map(item => this.extractRelatedData(item));
      return processedData;
    } catch (error: any) {
      console.error('❌ Erro ao buscar reservas:', error);
      return [];
    }
  }

  // ✅ BUSCAR RESERVAS ATIVAS
  async getReservasAtivas(lojaId?: string, clienteId?: string): Promise<Reserva[]> {
    try {
      let query = supabase
        .from('reservas')
        .select(`
          *,
          produto:produtos(nome, preco, foto_url, categoria),
          cliente:clientes(nome, email, telefone, id)
        `)
        .eq('ativo', true)
        .order('created_at', { ascending: false });

      if (lojaId) {
        query = query.eq('loja_id', lojaId);
      }

      if (clienteId) {
        query = query.eq('usuario_id', clienteId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // ✅ CORREÇÃO: Processar todos os dados para extrair relacionamentos
      const processedData = (data || []).map(item => this.extractRelatedData(item));
      return processedData;
    } catch (error: any) {
      console.error('❌ Erro ao buscar reservas ativas:', error);
      return [];
    }
  }

  // ✅ INICIAR VERIFICAÇÃO PERIÓDICA DE RESERVAS
  startReservationChecker(): void {
    // Verificar a cada 5 minutos
    this.reservationInterval = setInterval(() => {
      this.checkAndNotifyExpiringReservations();
      this.expirarReservasAutomaticamente();
    }, 5 * 60 * 1000);

    // Verificar imediatamente ao iniciar
    this.checkAndNotifyExpiringReservations();
    this.expirarReservasAutomaticamente();

    console.log('✅ Sistema de verificação de reservas iniciado');
  }

  // ✅ PARAR VERIFICAÇÃO PERIÓDICA DE RESERVAS
  stopReservationChecker(): void {
    if (this.reservationInterval) {
      clearInterval(this.reservationInterval);
      this.reservationInterval = null;
      console.log('🛑 Sistema de verificação de reservas parado');
    }
  }

  // ✅ BUSCAR RESERVA POR ID
  async getReservaById(reservaId: string): Promise<Reserva | null> {
    try {
      const { data, error } = await supabase
        .from('reservas')
        .select(`
          *,
          produto:produtos(nome, preco, foto_url, categoria, estoque),
          cliente:clientes(nome, email, telefone, id),
          funcionario:funcionarios(nome, whatsapp)
        `)
        .eq('id', reservaId)
        .single();

      if (error) throw error;

      // ✅ CORREÇÃO: Extrair dados dos relacionamentos (arrays)
      const processedData = this.extractRelatedData(data);
      return processedData;
    } catch (error: any) {
      console.error('❌ Erro ao buscar reserva:', error);
      return null;
    }
  }
}

export const reservationService = new ReservationService();
