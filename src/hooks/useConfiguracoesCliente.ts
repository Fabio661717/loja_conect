import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export interface ConfiguracoesCliente {
  theme: "light" | "dark";
  categoriasSelecionadas: string[];
  lojaId?: string;
}

export function useConfiguracoesCliente() {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesCliente>(() => {
    const saved = localStorage.getItem("cliente_config");
    return saved ? JSON.parse(saved) : {
      theme: "light",
      categoriasSelecionadas: []
    };
  });

  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<string[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);

  // Carregar categorias da loja atual
  useEffect(() => {
    const loadCategoriasLoja = async () => {
      const storeId = localStorage.getItem("storeId");
      if (!storeId) {
        console.log("StoreId não encontrado no localStorage");
        return;
      }

      try {
        setLoadingCategorias(true);
        console.log("Carregando categorias para loja:", storeId);

        const { data, error } = await supabase
          .from("categorias")
          .select("nome")
          .eq("loja_id", storeId)
          .eq("ativo", true)
          .order("nome");

        if (error) {
          console.error("Erro ao carregar categorias:", error);
          return;
        }

        console.log("Categorias carregadas:", data);

        if (data && data.length > 0) {
          const nomesCategorias = data.map(cat => cat.nome);
          setCategoriasDisponiveis(nomesCategorias);
        } else {
          setCategoriasDisponiveis([]);
        }
      } catch (error) {
        console.error("Erro ao buscar categorias:", error);
      } finally {
        setLoadingCategorias(false);
      }
    };

    loadCategoriasLoja();
  }, []);

  const atualizarConfiguracoes = (novasConfig: Partial<ConfiguracoesCliente>) => {
    const configAtualizada = { ...configuracoes, ...novasConfig };
    setConfiguracoes(configAtualizada);
    localStorage.setItem("cliente_config", JSON.stringify(configAtualizada));
  };

  const alternarTema = () => {
    const novoTheme = configuracoes.theme === "light" ? "dark" : "light";
    atualizarConfiguracoes({ theme: novoTheme });
  };

  const atualizarCategoriasSelecionadas = (categorias: string[]) => {
    atualizarConfiguracoes({ categoriasSelecionadas: categorias });
  };

  return {
    configuracoes,
    categoriasDisponiveis,
    loadingCategorias,
    alternarTema,
    atualizarCategoriasSelecionadas,
    atualizarConfiguracoes
  };
}
