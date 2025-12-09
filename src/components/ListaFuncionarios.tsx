// src/components/ListaFuncionarios.tsx
import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

interface Funcionario {
  id: string;
  nome: string;
  whatsapp: string;
  loja_id?: string;
  created_at?: string;
}

interface Props {
  lojaId: string;
}

export default function ListaFuncionarios({ lojaId }: Props) {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);

  useEffect(() => {
    const fetchFuncionarios = async () => {
      // CORREÇÃO: Removido os tipos genéricos incorretos
      const { data, error } = await supabase
        .from("funcionarios") // ← Apenas o nome da tabela
        .select("*")
        .eq("loja_id", lojaId);

      if (error) {
        console.error("Erro ao buscar funcionários:", error);
      } else {
        // CORREÇÃO: Garantir que os dados correspondem à interface
        setFuncionarios(data || []);
      }
    };

    fetchFuncionarios();
  }, [lojaId]);

  if (funcionarios.length === 0) {
    return (
      <div className="border p-4 rounded shadow space-y-2">
        <h2 className="font-bold text-lg">Funcionários</h2>
        <p className="text-gray-500">Nenhum funcionário cadastrado</p>
      </div>
    );
  }

  return (
    <div className="border p-4 rounded shadow space-y-2">
      <h2 className="font-bold text-lg">Funcionários</h2>
      <ul className="space-y-2">
        {funcionarios.map(f => (
          <li key={f.id} className="border p-2 rounded bg-gray-50">
            <div className="font-medium">{f.nome}</div>
            <div className="text-sm text-gray-600">{f.whatsapp}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
