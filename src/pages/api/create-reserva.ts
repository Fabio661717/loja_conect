// pages/api/create-reserva.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../services/supabase';

// ✅ CORREÇÃO: Importação condicional do Twilio apenas no server-side
const getTwilioClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Twilio should only be used on the server side');
  }

  // Dynamic import para evitar bundling no client
  const twilio = require('twilio');
  return twilio(process.env.TWILIO_SID!, process.env.TWILIO_TOKEN!);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { produto_id, cliente_id, funcionario_id, quantidade } = req.body;

  // Validação dos campos obrigatórios
  if (!produto_id || !cliente_id || quantidade == null) {
    return res.status(400).json({
      error: 'produto_id, cliente_id e quantidade são obrigatórios'
    });
  }

  try {
    // 1) Inserir reserva
    const { data, error } = await supabase
      .from('reservas')
      .insert([
        {
          produto_id,
          cliente_id,
          funcionario_id,
          quantidade,
          status: 'ativa',
          created_at: new Date().toISOString(),
          fimReserva: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        },
      ])
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(500).json({ error: 'Falha ao criar reserva' });
    }

    const reserva = data[0];

    // 2) Buscar dados do produto, cliente e funcionário
    const [produtoResult, clienteResult, funcionarioResult] = await Promise.all([
      supabase.from('produtos').select('*').eq('id', produto_id).single(),
      supabase.from('clientes').select('*').eq('id', cliente_id).single(),
      funcionario_id
        ? supabase.from('funcionarios').select('*').eq('id', funcionario_id).single()
        : Promise.resolve({ data: null, error: null })
    ]);

    if (produtoResult.error) throw produtoResult.error;
    if (clienteResult.error) throw clienteResult.error;

    const produto = produtoResult.data;
    const cliente = clienteResult.data;
    const funcionario = funcionarioResult.data;

    // 3) Enviar WhatsApp (apenas se Twilio configurado)
    try {
      if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
        const client = getTwilioClient();

        // Enviar para funcionário se existir e tiver WhatsApp
        if (funcionario?.whatsapp && produto && cliente) {
          await client.messages.create({
            from: `whatsapp:${process.env.TWILIO_NUMBER}`,
            to: `whatsapp:${funcionario.whatsapp}`,
            body: `📋 Nova reserva:\n${quantidade}x ${produto.nome}\n👤 Cliente: ${cliente.nome}\n⏰ Validade: 2 horas`,
          });
        }

        // Enviar para cliente se tiver WhatsApp
        if (cliente?.whatsapp && produto) {
          await client.messages.create({
            from: `whatsapp:${process.env.TWILIO_NUMBER}`,
            to: `whatsapp:${cliente.whatsapp}`,
            body: `✅ Reserva confirmada!\n${quantidade}x ${produto.nome}\n⏰ Validade: 2 horas\nObrigado por escolher nossos serviços!`,
          });
        }
      } else {
        console.log('Twilio não configurado - pulando envio de WhatsApp');
      }
    } catch (twilioError) {
      // Não falha a reserva se o Twilio der erro, apenas loga
      console.error('Erro ao enviar WhatsApp:', twilioError);
    }

    return res.status(200).json({
      message: 'Reserva criada com sucesso',
      reserva
    });

  } catch (err: unknown) {
    console.error('Erro ao criar reserva:', err);

    if (err instanceof Error) {
      return res.status(500).json({
        error: 'Erro interno do servidor: ' + err.message
      });
    } else {
      return res.status(500).json({
        error: 'Erro interno do servidor desconhecido'
      });
    }
  }
}
