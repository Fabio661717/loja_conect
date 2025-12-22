// pages/api/reservas/ativas.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../src/services/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cliente_id } = req.query;

    let query = supabase
      .from('reservas')
      .select(`
        *,
        produtos (nome),
        clientes (nome)
      `)
      .eq('status', 'ativa')
      .order('created_at', { ascending: false });

    if (cliente_id) {
      query = query.eq('cliente_id', cliente_id as string);
    }

    const { data, error } = await query;

    if (error) throw error;

    const reservasFormatadas = (data || []).map((reserva: any) => ({
      ...reserva,
      produtoNome: reserva.produtos?.nome || 'Produto não encontrado',
      clienteNome: reserva.clientes?.nome || 'Cliente não encontrado'
    }));

    return res.status(200).json(reservasFormatadas);

  } catch (err: unknown) {
    console.error(err);
    if (err instanceof Error) {
      return res.status(500).json({ error: err.message });
    } else {
      return res.status(500).json({ error: 'Erro desconhecido' });
    }
  }
}
