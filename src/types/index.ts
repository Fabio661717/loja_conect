// src/types/index.ts
export interface AccessOption {
  id: number;
  title: string;
  description: string;
  features: string[];
  checked: boolean;
  type: 'client' | 'store';
}

// ADICIONAR INTERFACE PRODUTO
export interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  estoque: number;
  categoria: string;
  imagem_url?: string;
  loja_id: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// Interfaces adicionais que podem ser úteis
export interface Loja {
  id: string;
  nome: string;
  descricao: string;
  endereco: string;
  telefone: string;
  email: string;
  logo_url?: string;
}

export interface Pedido {
  id: string;
  cliente_id: string;
  loja_id: string;
  total: number;
  status: 'pendente' | 'confirmado' | 'preparando' | 'pronto' | 'entregue' | 'cancelado';
  created_at: string;
}

// ✅ ADICIONAR INTERFACES DE PROMOÇÃO
export interface Promotion {
  id: string;
  product_id: string;
  loja_id: string;
  preco_original: number;
  preco_promocional: number;
  parcelas: number;
  valor_parcela: number;
  categoria_id: string;
  data_inicio: string;
  data_fim: string;
  ativa: boolean;
  created_at: string;
  produto?: {
    id: string;
    nome: string;
    foto_url?: string;
    descricao: string;
    categoria_id: string;
      };
  categoria?: {
    id: string;
    nome: string;
  };
}

export interface PromotionCardClientProps {
  promotion: Promotion;
}

export interface CreatePromotionData {
  product_id: string;
  preco_original: number;
  preco_promocional: number;
  parcelas: number;
  categoria_id: string;
  data_inicio: string;
  data_fim: string;
  enviar_notificacao: boolean;
}
