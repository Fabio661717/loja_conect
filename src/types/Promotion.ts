// ✅ src/types/Promotion.ts - VERSÃO CORRIGIDA
export interface Promotion {
  id: string;
  produto_id: string; // ✅ CORREÇÃO: Mudado para português para match com o banco
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
  descricao?: string; // ✅ ADICIONADO: Campo opcional

  // relacionamentos opcionais
  produto?: {
    id: string;
    nome: string;
    foto_url?: string;
    descricao?: string;
    categoria_id: string;
  };

  categoria?: {
    id: string;
    nome: string;
  };
}

export interface CreatePromotionData {
  product_id: string; // ✅ Mantido em inglês para a interface de criação
  preco_original: number;
  preco_promocional: number;
  parcelas: number;
  data_inicio: string;
  data_fim: string;
  categoria_id: string;
  enviar_notificacao?: boolean;
  descricao?: string; // ✅ ADICIONADO
}
