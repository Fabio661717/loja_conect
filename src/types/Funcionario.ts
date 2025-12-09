// src/types/Funcionario.ts
export interface Funcionario {
  id: string;
  nome: string;
  whatsapp: string;
  foto_url?: string;
  loja_id?: string;
  created_at?: string;
}

// Funções de conversão
export const convertEmployeeToFuncionario = (employee: any): Funcionario => ({
  id: employee.id,
  nome: employee.nome || employee.name,
  whatsapp: employee.whatsapp,
  foto_url: employee.foto_url,
  loja_id: employee.loja_id,
  created_at: employee.created_at
});
