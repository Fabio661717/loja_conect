// src/components/AdicionarFuncionario.tsx
import { FormEvent, useState } from "react";
import { supabase } from "../services/supabase";

interface Props {
  lojaId: string;
}

export default function AdicionarFuncionario({ lojaId }: Props) {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const handleAddFuncionario = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const { data: func, error } = await supabase
        .from("funcionarios")
        .insert([{ nome, whatsapp, loja_id: lojaId }])
        .select()
        .single();

      if (error) throw error;

      alert("Funcionário adicionado!");
      setNome("");
      setWhatsapp("");
    } catch (err: any) {
      alert(err.message || "Erro ao adicionar funcionário");
    }
  };

  return (
    <div className="border p-4 rounded shadow space-y-2">
      <h2 className="font-bold">Adicionar Funcionário</h2>
      <form onSubmit={handleAddFuncionario} className="space-y-2">
        <input
          placeholder="Nome"
          value={nome}
          onChange={e => setNome(e.target.value)}
          required
        />
        <input
          placeholder="WhatsApp"
          value={whatsapp}
          onChange={e => setWhatsapp(e.target.value)}
          required
        />
        <button type="submit" className="btn-primary">
          Adicionar
        </button>
      </form>
    </div>
  );
}
