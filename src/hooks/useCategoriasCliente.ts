// loja-conect/src/hooks/useCategoriasCliente.ts
import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export interface CategoriaCliente {
  id: string;
  nome: string;
  loja_id: string;
  is_active?: boolean;
  updated_at?: string;
  source?: string;
}

export function useCategoriasCliente() {
  const [categorias, setCategorias] = useState<CategoriaCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategorias = async () => {
      const storeId = localStorage.getItem("storeId");

      if (!storeId) {
        setError("Nenhuma loja selecionada");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("categorias")
          .select("id, nome, loja_id")
          .eq("loja_id", storeId)
          .eq("ativo", true)
          .order("nome");

        if (error) throw error;

        setCategorias(data || []);
      } catch (err: any) {
        console.error("Erro ao carregar categorias:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCategorias();
  }, []);

  const getNomesCategorias = (): string[] => {
    return categorias.map(cat => cat.nome);
  };

  return {
    categorias,
    nomesCategorias: getNomesCategorias(),
    loading,
    error
  };
}
