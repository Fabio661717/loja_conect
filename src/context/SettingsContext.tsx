// src/context/SettingsContext.tsx - VERSÃO COMPLETA ATUALIZADA
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";

interface SettingsContextProps {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void; // ✅ NOVA FUNÇÃO ADICIONADA
  categories: string[];
  selectedCategories: string[];
  setSelectedCategories: (cats: string[]) => void;
}

const SettingsContext = createContext<SettingsContextProps | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // ✅ EFEITO PARA CARREGAR TEMA SALVO
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setThemeState(savedTheme);
    }
  }, []);

  // ✅ FUNÇÃO PARA DEFINIR TEMA (mantida para compatibilidade)
  const setTheme = (newTheme: "light" | "dark") => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // ✅ NOVA FUNÇÃO: TOGGLE THEME
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // ✅ EFEITO PARA BUSCAR CATEGORIAS (funcionalidade original mantida)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const storeId = localStorage.getItem("storeId");

        // ✅ VERIFICAR SE TEM STOREID ANTES DE FAZER A QUERY
        if (!storeId) {
          console.log("⚠️ Nenhum storeId encontrado, usando categorias padrão");
          setCategories(["Eletrônicos", "Roupas", "Casa", "Esportes"]); // Categorias padrão
          return;
        }

        // ✅ VERIFICAR SE O SUPABASE ESTÁ CONFIGURADO
        if (!supabase) {
          console.error("❌ Supabase não está configurado");
          setCategories(["Eletrônicos", "Roupas", "Casa", "Esportes"]);
          return;
        }

        const { data, error } = await supabase
          .from("categorias")
          .select("nome")
          .eq("loja_id", storeId);

        if (error) {
          console.error("❌ Erro ao buscar categorias:", error);
          setCategories(["Eletrônicos", "Roupas", "Casa", "Esportes"]);
          return;
        }

        if (data && data.length > 0) {
          setCategories(data.map((c: any) => c.nome));
        } else {
          // ✅ CATEGORIAS PADRÃO SE NÃO ENCONTRAR NO BANCO
          setCategories(["Eletrônicos", "Roupas", "Casa", "Esportes"]);
        }
      } catch (error) {
        console.error("❌ Erro inesperado ao buscar categorias:", error);
        // ✅ FALLBACK PARA CATEGORIAS PADRÃO EM CASO DE ERRO
        setCategories(["Eletrônicos", "Roupas", "Casa", "Esportes"]);
      }
    };

    fetchCategories();
  }, []);

  // ✅ VALOR COMPLETO DO CONTEXT (com todas as funcionalidades)
  const contextValue: SettingsContextProps = {
    theme,
    setTheme, // ✅ Mantida para compatibilidade
    toggleTheme, // ✅ Nova função adicionada
    categories,
    selectedCategories,
    setSelectedCategories
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
};
