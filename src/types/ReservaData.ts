// src/types/ReservaData.ts

export interface ReservaData {
  id?: string;
  produto_id: string;
  cliente_id: string;
  funcionario_id?: string | null;
  quantidade: number;
  created_at?: string;
}
