// src/services/reservationStorage.ts
export interface PreferredEmployee {
  id: string;
  name: string;
  whatsapp: string;
  foto?: string;
  storeId?: string;
}

const PREFERRED_EMPLOYEE_KEY = 'preferred_employee';
const FIRST_RESERVATION_KEY = 'first_reservation';

export const ReservationStorage = {
  // Salvar funcionário preferido
  setPreferredEmployee(employee: PreferredEmployee): void {
    try {
      localStorage.setItem(PREFERRED_EMPLOYEE_KEY, JSON.stringify(employee));
      console.log('✅ Funcionário preferido salvo no localStorage:', employee.name);
    } catch (error) {
      console.error('❌ Erro ao salvar funcionário preferido:', error);
    }
  },

  // Obter funcionário preferido
  getPreferredEmployee(): PreferredEmployee | null {
    try {
      const stored = localStorage.getItem(PREFERRED_EMPLOYEE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('❌ Erro ao obter funcionário preferido:', error);
      return null;
    }
  },

  // Remover funcionário preferido
  clearPreferredEmployee(): void {
    try {
      localStorage.removeItem(PREFERRED_EMPLOYEE_KEY);
    } catch (error) {
      console.error('❌ Erro ao remover funcionário preferido:', error);
    }
  },

  // Verificar se é primeira reserva
  isFirstReservation(): boolean {
    try {
      const hasDoneFirst = localStorage.getItem(FIRST_RESERVATION_KEY);
      return !hasDoneFirst; // Retorna true se nunca fez reserva
    } catch (error) {
      console.error('❌ Erro ao verificar primeira reserva:', error);
      return true; // Assume que é primeira se houver erro
    }
  },

  // Marcar que já fez primeira reserva
  markFirstReservationDone(): void {
    try {
      localStorage.setItem(FIRST_RESERVATION_KEY, 'true');
      console.log('✅ Primeira reserva marcada como realizada');
    } catch (error) {
      console.error('❌ Erro ao marcar primeira reserva:', error);
    }
  },

  // Resetar tudo (para testes)
  clearAll(): void {
    try {
      localStorage.removeItem(PREFERRED_EMPLOYEE_KEY);
      localStorage.removeItem(FIRST_RESERVATION_KEY);
    } catch (error) {
      console.error('❌ Erro ao limpar storage:', error);
    }
  }
};
