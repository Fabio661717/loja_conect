// src/app/api/reservas/ativas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../src/services/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get('cliente_id');

    let query = supabase
      .from('reservas')
      .select(`
        *,
        produtos:nome,
        clientes:nome
      `)
      .eq('status', 'ativa')
      .order('created_at', { ascending: false });

    if (clienteId) {
      query = query.eq('cliente_id', clienteId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Formatar os dados para incluir nome do produto
    const reservasFormatadas = data?.map(reserva => ({
      ...reserva,
      produtoNome: reserva.produtos?.nome || 'Produto não encontrado'
    })) || [];

    return NextResponse.json(reservasFormatadas);
  } catch (err: unknown) {
    console.error(err);
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: "Erro desconhecido" }, { status: 500 });
    }
  }
}
