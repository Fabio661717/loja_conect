// 📄 src/components/store/CategoryManager.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Categoria, useSupabase } from '../../hooks/useSupabase';
import { categoryService } from '../../services/categoryService'; // ✅ novo import

export default function CategoryManager() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getCategorias, createCategoria, updateCategoria, deleteCategoria } = useSupabase();

  const [categories, setCategories] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ id: string; nome: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔹 Carregar categorias da loja
  useEffect(() => {
    if (user?.lojaId) {
      loadCategories();
    }
  }, [user]);

  const loadCategories = async () => {
    if (!user?.lojaId) return;

    setLoading(true);
    setError(null);

    try {
      const categoriasData = await getCategorias(user.lojaId);
      setCategories(categoriasData);
    } catch (err: any) {
      setError(err.message);
      console.error('❌ Erro ao carregar categorias:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Criar nova categoria + sincronizar notificações
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !user?.lojaId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const novaCategoria = await createCategoria(user.lojaId, {
        nome: newCategoryName.trim(),
        descricao: ''
      });

      setCategories(prev => [...prev, novaCategoria]);
      setNewCategoryName('');

      // ✅ NOVO: Sincronizar automaticamente com as notificações
      await categoryService.syncStoreCategoriesWithNotifications(user.lojaId);

      alert('✅ Categoria criada e sincronizada com notificações!');
    } catch (err: any) {
      setError(err.message);
      alert(`❌ Erro: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🟡 Atualizar categoria
  const handleUpdateCategory = async (id: string, novoNome: string) => {
    if (!novoNome.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const categoriaAtualizada = await updateCategoria(id, { nome: novoNome.trim() });

      setCategories(prev =>
        prev.map(cat => (cat.id === id ? categoriaAtualizada : cat))
      );
      setEditingCategory(null);
      alert('✅ Categoria atualizada com sucesso!');
    } catch (err: any) {
      setError(err.message);
      alert(`❌ Erro: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔴 Excluir categoria
  const handleDeleteCategory = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${nome}"?`)) return;

    setError(null);

    try {
      await deleteCategoria(id);
      setCategories(prev => prev.filter(cat => cat.id !== id));
      alert('✅ Categoria excluída com sucesso!');
    } catch (err: any) {
      setError(err.message);
      alert(`❌ Erro: ${err.message}`);
    }
  };

  // 🕐 Tela de carregamento inicial
  if (loading && categories.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Gerenciar Categorias</h1>
              <button onClick={() => navigate('/loja')} className="text-gray-600 hover:text-gray-800">
                ← Voltar para Dashboard
              </button>
            </div>
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 🧩 Interface principal
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">📁 Gerenciar Categorias</h1>
            <button onClick={() => navigate('/loja')} className="text-gray-600 hover:text-gray-800">
              ← Voltar para Dashboard
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* 🟢 Formulário para nova categoria */}
          <form onSubmit={handleCreateCategory} className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Adicionar Nova Categoria</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nome da nova categoria (ex: Blusas, Calçados, Eletrônicos...)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={!newCategoryName.trim() || isSubmitting}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Adicionando...' : '➕ Adicionar'}
              </button>
            </div>
          </form>

          {/* 🗂️ Lista de categorias */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Categorias Cadastradas</h3>

            {categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-lg mb-2">📝 Nenhuma categoria cadastrada ainda.</p>
                <p className="text-sm mb-4">Crie sua primeira categoria usando o formulário acima!</p>
                <p className="text-xs text-gray-400">
                  💡 Dica: Crie categorias como "Camisetas", "Calças", "Tênis", "Acessórios" antes de cadastrar produtos.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
                  >
                    {editingCategory?.id === category.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingCategory.nome}
                          onChange={(e) => setEditingCategory({ ...editingCategory, nome: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateCategory(category.id, editingCategory.nome)}
                          disabled={isSubmitting}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm font-medium"
                        >
                          ✅ Salvar
                        </button>
                        <button
                          onClick={() => setEditingCategory(null)}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm font-medium"
                        >
                          ❌ Cancelar
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-sm">📁</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">{category.nome}</span>
                            <p className="text-sm text-gray-500">
                              Criada em: {new Date(category.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingCategory({ id: category.id, nome: category.nome })}
                            className="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-600 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
                            title="Editar categoria"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id, category.nome)}
                            className="text-red-600 hover:text-red-800 px-3 py-1 border border-red-600 rounded text-sm font-medium hover:bg-red-50 transition-colors"
                            title="Excluir categoria"
                          >
                            🗑️ Excluir
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ℹ️ Informações úteis */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">💡 Informações Importantes</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Crie categorias antes de cadastrar produtos</li>
              <li>• Cada produto deve estar vinculado a uma categoria</li>
              <li>• Não é possível excluir categorias que possuem produtos vinculados</li>
              <li>• Use nomes claros e objetivos para as categorias</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
