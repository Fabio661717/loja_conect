import { Employee } from '../types/Employee';
import { supabase } from './supabase';

export const employeeService = {
  // Buscar funcionários de uma loja
  async getEmployeesByStore(storeId: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('loja_id', storeId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Buscar funcionário por ID
  async getEmployeeById(employeeId: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('id', employeeId)
      .single();

    if (error) return null;
    return data;
  },

  // Verificar se é a primeira reserva do usuário
  async isFirstReservation(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('reservas')
      .select('id')
      .eq('cliente_id', userId)
      .limit(1);

    if (error) return true; // Em caso de erro, assume que é a primeira
    return !data || data.length === 0;
  }
};
