// 📄 src/hooks/useCategories.ts - VERSÃO CORRIGIDA
import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { Categoria, useSupabase } from './useSupabase';


export function useCategories() {
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, getCorrectLojaId, lojaId: authLojaId } = useAuth();
  const { getCategorias, createCategoria, updateCategoria, deleteCategoria } = useSupabase();

  // ✅ CORREÇÃO: Função melhorada para obter lojaId
  const getLojaId = (): string | null => {
    // Prioridade 1: Do useAuth (mais confiável)
    if (authLojaId) {
      console.log('✅ Loja ID do useAuth:', authLojaId);
      return authLojaId;
    }

    // Prioridade 2: Da função getCorrectLojaId
    const correctLojaId = getCorrectLojaId?.();
    if (correctLojaId) {
      console.log('✅ Loja ID do getCorrectLojaId:', correctLojaId);
      return correctLojaId;
    }

    // Prioridade 3: Do user object
    if (user?.lojaId) {
      console.log('✅ Loja ID do user object:', user.lojaId);
      return user.lojaId;
    }

    // Prioridade 4: Do localStorage (múltiplas chaves possíveis)
    const lojaIdFromStorage =
      localStorage.getItem("loja_id") ||
      localStorage.getItem("storeId") ||
      sessionStorage.getItem("loja_id");

    if (lojaIdFromStorage) {
      console.log('✅ Loja ID do storage:', lojaIdFromStorage);
      return lojaIdFromStorage;
    }

    // Prioridade 5: User ID (para casos onde loja_id = user_id)
    if (user?.id && user?.type === 'loja') {
      console.log('✅ Usando user ID como loja ID:', user.id);
      return user.id;
    }

    console.error('❌ Nenhum Loja ID encontrado em nenhuma fonte');
    console.log('🔍 Debug - User:', user);
    console.log('🔍 Debug - localStorage loja_id:', localStorage.getItem('loja_id'));
    console.log('🔍 Debug - localStorage storeId:', localStorage.getItem('storeId'));
    console.log('🔍 Debug - sessionStorage loja_id:', sessionStorage.getItem('loja_id'));

    return null;
  };

  const lojaId = getLojaId();

  // Carregar categorias automaticamente quando a lojaId mudar
  useEffect(() => {
    console.log('🔄 useCategories - lojaId:', lojaId);
    console.log('🔄 useCategories - user:', user);

    if (lojaId) {
      loadCategories();
    } else {
      setCategories([]);
      setError('Nenhuma loja identificada. Faça login novamente.');
    }
  }, [lojaId, user?.id]); // ✅ Adicionar user.id como dependência

  const loadCategories = async () => {
    const currentLojaId = getLojaId(); // ✅ Sempre pegar o mais recente

    if (!currentLojaId) {
      setCategories([]);
      setError('Loja não identificada. Faça login novamente.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Carregando categorias para loja:', currentLojaId);
      const categoriasData = await getCategorias(currentLojaId);
      console.log('✅ Categorias carregadas:', categoriasData.length);
      console.log('📋 Lista de categorias:', categoriasData.map(c => c.nome));

      setCategories(categoriasData);
    } catch (err: any) {
      console.error('❌ Erro ao carregar categorias:', err);
      setError(err.message);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Criar nova categoria
  const createCategory = async (nome: string, descricao?: string): Promise<Categoria> => {
    const currentLojaId = getLojaId();
    if (!currentLojaId) throw new Error('Loja não identificada');

    setError(null);

    try {
      console.log('🔄 Criando categoria:', nome, 'para loja:', currentLojaId);
      const novaCategoria = await createCategoria(currentLojaId, {
        nome: nome.trim(),
        descricao: descricao || ''
      });

      // Atualizar lista local
      setCategories(prev => [...prev, novaCategoria]);
      console.log('✅ Categoria criada com sucesso:', novaCategoria);

      return novaCategoria;
    } catch (err: any) {
      console.error('❌ Erro ao criar categoria:', err);
      setError(err.message);
      throw err;
    }
  };

  // Atualizar categoria existente
  const updateCategory = async (id: string, nome: string, descricao?: string): Promise<Categoria> => {
    if (!lojaId) throw new Error('Loja não identificada');

    setError(null);

    try {
      const categoriaAtualizada = await updateCategoria(id, {
        nome: nome.trim(),
        ...(descricao !== undefined && { descricao })
      });

      // Atualizar lista local
      setCategories(prev =>
        prev.map(cat => cat.id === id ? categoriaAtualizada : cat)
      );

      return categoriaAtualizada;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Excluir categoria
  const deleteCategory = async (id: string): Promise<void> => {
    setError(null);

    try {
      await deleteCategoria(id);

      // Atualizar lista local
      setCategories(prev => prev.filter(cat => cat.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Buscar categoria por ID
  const getCategoryById = (id: string): Categoria | undefined => {
    return categories.find(cat => cat.id === id);
  };

  // Buscar categoria por nome
  const getCategoryByName = (nome: string): Categoria | undefined => {
    return categories.find(cat =>
      cat.nome.toLowerCase() === nome.toLowerCase()
    );
  };

  // Verificar se categoria existe
  const categoryExists = (nome: string): boolean => {
    return categories.some(cat =>
      cat.nome.toLowerCase() === nome.toLowerCase()
    );
  };

  // Obter categorias para select options
  const getCategoryOptions = (): { value: string; label: string }[] => {
    return categories.map(cat => ({
      value: cat.id,
      label: cat.nome
    }));
  };

  // Obter categorias agrupadas
  const getCategoriesGrouped = () => {
    return categories.reduce((acc, cat) => {
      const firstLetter = cat.nome.charAt(0).toUpperCase();
      if (!acc[firstLetter]) {
        acc[firstLetter] = [];
      }
      acc[firstLetter].push(cat);
      return acc;
    }, {} as Record<string, Categoria[]>);
  };

  // Estatísticas das categorias
  const getCategoryStats = () => {
    return {
      total: categories.length,
      empty: categories.filter(cat => !cat.descricao).length,
      withDescription: categories.filter(cat => cat.descricao).length,
    };
  };

  // Resetar estado de erro
  const clearError = () => {
    setError(null);
  };

  return {
    // Estado
    categories,
    loading,
    error,


    // Ações principais
    createCategory,
    updateCategory,
    deleteCategory,
    refreshCategories: loadCategories,

    // Buscas e utilitários
    getCategoryById,
    getCategoryByName,
    categoryExists,
    getCategoryOptions,
    getCategoriesGrouped,
    getCategoryStats,

    // Gerenciamento de estado
    clearError,


    // Informações da loja
    lojaId,
    hasStore: !!lojaId,
  };
}
