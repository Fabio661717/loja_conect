// 📄 src/services/clientService.ts - NOVO ARQUIVO
import { supabase } from './supabase';

export interface ClientData {
  nome: string;
  email: string;
  telefone?: string;
  endereco?: string;
}

export const clientService = {
  // ✅ APENAS para criar clientes - não interfere com lojas
  createClient: async (clientData: ClientData) => {
    const { data, error } = await supabase
      .from('clientes')
      .insert([clientData])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  updateClient: async (clientId: string, updates: Partial<ClientData>) => {
    const { data, error } = await supabase
      .from('clientes')
      .update(updates)
      .eq('id', clientId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  getClient: async (clientId: string) => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Produtos para clientes
  getAvailableProducts: async (storeId?: string) => {
    let query = supabase
      .from('produtos')
      .select('*, lojas(nome)')
      .eq('disponivel', true);

    if (storeId) {
      query = query.eq('loja_id', storeId);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Reservas
  createReservation: async (reservationData: any) => {
    const { data, error } = await supabase
      .from('reservas')
      .insert([reservationData])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
};
