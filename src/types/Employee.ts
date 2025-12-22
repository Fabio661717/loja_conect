// src/types/Employee.ts - VERSÃO CORRIGIDA
export interface Employee {
  id: string;
  nome: string;
  name: string; // ✅ OBRIGATÓRIO agora
  whatsapp: string;
  email?: string;
  cargo?: string;
  loja_id: string;
  productPreco?: number;
  foto_url?: string;
  foto?: string;
  photoUrl?: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
  hasCustomPhoto: boolean; // ✅ OBRIGATÓRIO agora
}

// Tipo para resposta do Supabase
export interface EmployeeResponse {
  id: string;
  nome: string;
  whatsapp: string;
  email?: string;
  cargo?: string;
  loja_id: string;
  foto_url?: string;
  foto?: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}
