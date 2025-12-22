// src/utils/timeUtils.ts
export class TimeUtils {
  // CORREÇÃO: Função robusta para cálculo de diferença de tempo
  static calcularDiferencaTempo(dataFim: string, dataInicio?: Date): number {
    try {
      const inicio = dataInicio || new Date();
      const fim = new Date(dataFim);

      if (isNaN(fim.getTime())) {
        throw new Error('Data de fim inválida');
      }

      const diferenca = fim.getTime() - inicio.getTime();
      return Math.max(0, diferenca); // Nunca retorna negativo
    } catch (error) {
      console.error('Erro ao calcular diferença de tempo:', error);
      return 0;
    }
  }

  // CORREÇÃO: Validação completa de data de reserva
  static validarDataReserva(fimReserva: string): {
    valida: boolean;
    erro?: string;
    tempoRestante?: number;
  } {
    try {
      const agora = new Date();
      const fim = new Date(fimReserva);

      // Validação básica da data
      if (isNaN(fim.getTime())) {
        return { valida: false, erro: 'Data de reserva inválida' };
      }

      // Verificar se a data não está no passado
      if (fim <= agora) {
        return { valida: false, erro: 'Data de reserva já expirou' };
      }

      // Verificar se a data não está muito no futuro (max 24 horas)
      const maxTempo = 24 * 60 * 60 * 1000; // 24 horas
      if (fim.getTime() - agora.getTime() > maxTempo) {
        return { valida: false, erro: 'Data de reserva muito distante' };
      }

      const tempoRestante = fim.getTime() - agora.getTime();
      return { valida: true, tempoRestante };
    } catch (error) {
      return { valida: false, erro: 'Erro ao validar data de reserva' };
    }
  }

  // CORREÇÃO: Formatação de tempo com validação
  static formatarTempo(milliseconds: number): {
    hours: string;
    minutes: string;
    seconds: string;
    totalHours: number;
    totalMinutes: number;
    expirado: boolean;
  } {
    if (milliseconds <= 0) {
      return {
        hours: '00',
        minutes: '00',
        seconds: '00',
        totalHours: 0,
        totalMinutes: 0,
        expirado: true
      };
    }

    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
      totalHours: hours,
      totalMinutes: hours * 60 + minutes,
      expirado: false
    };
  }

  // CORREÇÃO: Calcular progresso baseado no tempo total da reserva (2 horas)
  static calcularProgresso(fimReserva: string, tempoDecorrido?: number): number {
    try {
      const DURACAO_RESERVA = 2 * 60 * 60 * 1000; // 2 horas em milliseconds
      const fim = new Date(fimReserva);
      const inicio = new Date(fim.getTime() - DURACAO_RESERVA);
      const agora = tempoDecorrido ? new Date(inicio.getTime() + tempoDecorrido) : new Date();

      const tempoTotal = fim.getTime() - inicio.getTime();
      const tempoPassado = agora.getTime() - inicio.getTime();

      if (tempoTotal <= 0) return 100;
      if (tempoPassado <= 0) return 0;

      const progresso = (tempoPassado / tempoTotal) * 100;
      return Math.min(Math.max(progresso, 0), 100);
    } catch (error) {
      console.error('Erro ao calcular progresso:', error);
      return 0;
    }
  }
}
