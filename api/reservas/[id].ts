// pages/api/reservas/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../src/services/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID da reserva é obrigatório' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // Buscar reserva por ID
        const { data: reserva, error: getError } = await supabase
          .from('reservas')
          .select(`
            *,
            produtos (nome),
            clientes (nome)
          `)
          .eq('id', id)
          .single();

        if (getError) throw getError;
        if (!reserva) {
          return res.status(404).json({ error: 'Reserva não encontrada' });
        }

        const reservaFormatada = {
          ...reserva,
          produtoNome: (reserva.produtos as any)?.nome || 'Produto não encontrado',
          clienteNome: (reserva.clientes as any)?.nome || 'Cliente não encontrado'
        };

        return res.status(200).json(reservaFormatada);

      case 'PATCH':
        const { acao, horas } = req.body;

        if (acao === 'renovar') {
          // Renovar reserva
          const novaDataFim = new Date(Date.now() + (horas || 2) * 60 * 60 * 1000);

          const { data: reservaRenovada, error: renovarError } = await supabase
            .from('reservas')
            .update({
              fimReserva: novaDataFim.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

          if (renovarError) throw renovarError;

          return res.status(200).json({
            message: 'Reserva renovada com sucesso',
            reserva: reservaRenovada
          });
        }

        if (acao === 'agendar-depois') {
          // Agendar para depois (exemplo: adicionar 1 dia)
          const novaDataFim = new Date(Date.now() + 24 * 60 * 60 * 1000);

          const { data: reservaAgendada, error: agendarError } = await supabase
            .from('reservas')
            .update({
              fimReserva: novaDataFim.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

          if (agendarError) throw agendarError;

          return res.status(200).json({
            message: 'Reserva agendada para depois',
            reserva: reservaAgendada
          });
        }

        return res.status(400).json({ error: 'Ação inválida' });

      case 'DELETE':
        // Cancelar reserva
        const { data: reservaCancelada, error: cancelarError } = await supabase
          .from('reservas')
          .update({
            status: 'cancelada',
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (cancelarError) throw cancelarError;

        return res.status(200).json({
          message: 'Reserva cancelada com sucesso',
          reserva: reservaCancelada
        });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (err: unknown) {
    console.error(err);
    if (err instanceof Error) {
      return res.status(500).json({ error: err.message });
    } else {
      return res.status(500).json({ error: 'Erro desconhecido' });
    }
  }
}
