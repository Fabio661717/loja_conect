// src/types/Reservation.ts - VERSÃO COMPLETA
export interface Reservation {
  id: string;
  produto_id: string;
  usuario_id: string;
  funcionario_id?: string;
  quantidade: number;
  tamanho?: string;
  status: 'ativa' | 'pendente' | 'confirmada' | 'concluida' | 'cancelada' | 'expirada';
  fim_reserva: string;
  created_at: string;
  updated_at?: string;
  loja_id: string;
  ativo?: boolean;
  renovacoes?: number;
  ultima_renovacao?: string;

  // Campos adicionais vindos dos relacionamentos:
  produto?: {
    id: string;
    nome: string;
    preco: number;
    foto_url?: string;
    categoria?: string;
    estoque?: number;
  };
  cliente?: {
    id: string;
    nome: string;
    email: string;
    telefone?: string;
  };
  funcionario?: {
    id: string;
    nome: string;
    whatsapp: string;
  };
}

// ✅ INTERFACE ADICIONADA: CreateReservationData
export interface CreateReservationData {
  produto_id: string;
  usuario_id: string;
  funcionario_id?: string;
  quantidade: number;
  tamanho?: string;
  loja_id: string;
}

// ✅ INTERFACE ADICIONADA: UpdateReservationData
export interface UpdateReservationData {
  status?: string;
  fim_reserva?: string;
  renovacoes?: number;
  ultima_renovacao?: string;
  ativo?: boolean;
}

// ✅ INTERFACE PARA O SERVICE DE RESERVA (COMPATIBILIDADE)
export interface Reserva {
  id: string;
  produto_id: string;
  cliente_id: string;
  funcionario_id?: string;
  quantidade: number;
  produtoNome: string;
  clienteNome: string;
  fimReserva: string;
  status: string;
  created_at: string;
}

export interface CreateReservaData {
  produto_id: string;
  cliente_id: string;
  funcionario_id?: string;
  quantidade: number;
}
