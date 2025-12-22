// src/constants/appConstants.ts
export const APP_CONSTANTS = {
  // CORREÇÃO: Configurações de tempo centralizadas
  RESERVA: {
    DURACAO_PADRAO_HORAS: 2,
    DURACAO_PADRAO_MS: 2 * 60 * 60 * 1000,
    TEMPO_RENOVACAO_HORAS: 2,
    ALERTA_EXPIRACAO_MINUTOS: 30,
    TEMPO_MAXIMO_FUTURO_HORAS: 24
  },

  MENSAGENS: {
    TEMPO_ESGOTADO: '⏰ Tempo Esgotado!',
    RESERVA_EXPIRADA: 'Sua reserva expirou e o produto foi liberado.',
    RESERVA_RENOVADA: 'Reserva renovada com sucesso!',
    RESERVA_CANCELADA: 'Reserva cancelada com sucesso!',
    RESERVA_AGENDADA: 'Reserva agendada para depois!',
    ERRO_RENOVACAO: 'Erro ao renovar reserva',
    ERRO_CANCELAMENTO: 'Erro ao cancelar reserva'
  },

  CORES: {
    EXPIRADO: '#ef4444',
    ALERTA: '#f59e0b',
    NORMAL: '#10b981',
    EXPIRADO_CLARO: '#fecaca',
    ALERTA_CLARO: '#fef3c7',
    NORMAL_CLARO: '#d1fae5'
  }
} as const;
