// src/services/reservationMonitor.ts
import { notificationSystem } from './notificationSystem';
import { supabase } from './supabase';

class ReservationMonitor {
  private checkInterval: NodeJS.Timeout | null = null;

  /**
   * ✅ INICIAR MONITORAMENTO DE RESERVAS
   */
  startMonitoring() {
    console.log('🔍 Iniciando monitoramento de reservas...');

    // Verificar a cada minuto
    this.checkInterval = setInterval(() => {
      this.checkExpiringReservations();
    }, 60000); // 1 minuto

    // Verificar imediatamente ao iniciar
    this.checkExpiringReservations();
  }

  /**
   * ✅ PARAR MONITORAMENTO
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🛑 Monitoramento de reservas parado');
    }
  }

  /**
   * ✅ VERIFICAR RESERVAS PRÓXIMAS DO VENCIMENTO
   */
  private async checkExpiringReservations() {
    try {
      console.log('⏰ Verificando reservas próximas do vencimento...');

      // Buscar reservas que expiram em menos de 15 minutos
      const now = new Date();
      const warningTime = new Date(now.getTime() + 15 * 60000); // 15 minutos

      // ✅ CORREÇÃO: Usar a variável 'reservations' corretamente e remover 'reservas' não definida
      const { data: reservations, error } = await supabase
        .from('reservas')
        .select(`
          *,
          produtos (*),
          categorias (*)
        `)
        .eq('status', 'ativa')
        .lt('data_expiracao', warningTime.toISOString())
        .gt('data_expiracao', now.toISOString())
        .is('notificacao_enviada', false);

      if (error) {
        console.error('❌ Erro ao buscar reservas:', error);
        return;
      }

      // ✅ CORREÇÃO: Usar 'reservations' em vez de 'reservas' não definida
      if (!reservations || reservations.length === 0) {
        console.log('ℹ️ Nenhuma reserva próxima do vencimento');
        return;
      }

      console.log(`⚠️ ${reservations.length} reservas próximas do vencimento`);

      // Notificar sobre cada reserva
      // ✅ CORREÇÃO: Usar 'reservations' em vez de 'reservas' não definida
      for (const reserva of reservations) {
        await this.notifyReservationEnding(reserva);
      }

    } catch (error) {
      console.error('❌ Erro no monitoramento:', error);
    }
  }

  /**
   * ✅ NOTIFICAR SOBRE RESERVA PRESTES A EXPIRAR
   */
  private async notifyReservationEnding(reserva: any) {
    try {
      const expiracao = new Date(reserva.data_expiracao);
      const agora = new Date();
      const minutosRestantes = Math.floor((expiracao.getTime() - agora.getTime()) / 60000);

      if (minutosRestantes <= 0) return;

      const product = reserva.produtos;
      const category = reserva.categorias;

      if (!product || !category) {
        console.warn('❌ Dados incompletos da reserva:', reserva.id);
        return;
      }

      // Enviar notificação
      await notificationSystem.notifyReservationEnding(
        reserva.id,
        product,
        category,
        minutosRestantes
      );

      // Marcar como notificada
      await supabase
        .from('reservas')
        .update({ notificacao_enviada: true })
        .eq('id', reserva.id);

      console.log(`✅ Notificação enviada para reserva ${reserva.id} (${minutosRestantes}min)`);

    } catch (error) {
      console.error('❌ Erro ao notificar reserva:', error);
    }
  }

  /**
   * ✅ MÉTODO ADICIONAL: BUSCAR RESERVAS EXPIRANDO (para uso externo se necessário)
   */
  async getExpiringReservations(): Promise<any[]> {
    try {
      const now = new Date();
      const warningTime = new Date(now.getTime() + 15 * 60000);

      const { data: reservations, error } = await supabase
        .from('reservas')
        .select(`
          *,
          produtos (*),
          categorias (*)
        `)
        .eq('status', 'ativa')
        .lt('data_expiracao', warningTime.toISOString())
        .gt('data_expiracao', now.toISOString())
        .is('notificacao_enviada', false);

      if (error) {
        console.error('❌ Erro ao buscar reservas expirando:', error);
        return [];
      }

      return reservations || [];
    } catch (error) {
      console.error('❌ Erro ao obter reservas expirando:', error);
      return [];
    }
  }
}

export const reservationMonitor = new ReservationMonitor();
