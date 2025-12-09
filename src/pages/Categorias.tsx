// src/pages/Categorias.tsx - VERSÃO CORRIGIDA
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useSupabase } from "../hooks/useSupabase";

// ✅ CORREÇÃO: Usar a interface Categoria do useSupabase
interface Categoria {
  id: string;
  nome: string;
  descricao?: string;
  loja_id: string;
  created_at: string;
  // ✅ CORREÇÃO: Campo ativo é opcional (pode não existir no banco)
  ativo?: boolean;
}

export default function Categorias() {
  const { user } = useAuth();
  const {
    getCategorias,
    createCategoria,
    updateCategoria,
    deleteCategoria,
    getStoreByOwner,
    loading
    // ✅ CORREÇÃO: Removido 'error' pois não existe no hook
  } = useSupabase();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    ativo: true,
  });

  useEffect(() => {
    if (user) {
      carregarCategorias();
    }
  }, [user]);

  const carregarCategorias = async () => {
    try {
      const loja = await getStoreByOwner();
      if (!loja) {
        alert("Loja não encontrada");
        return;
      }

      const categoriasData = await getCategorias(loja.id);

      // ✅ CORREÇÃO: Garantir que todas as categorias tenham o campo ativo
      const categoriasComAtivo: Categoria[] = categoriasData.map((cat: any) => ({
        ...cat,
        ativo: cat.ativo !== undefined ? cat.ativo : true
      }));

      setCategorias(categoriasComAtivo);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      alert("Erro ao carregar categorias");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      alert("Nome da categoria é obrigatório");
      return;
    }

    try {
      const loja = await getStoreByOwner();
      if (!loja) {
        alert("Loja não encontrada");
        return;
      }

      // ✅ CORREÇÃO: Criar objeto de dados sem type casting problemático
      const categoriaData = {
        nome: formData.nome,
        descricao: formData.descricao || undefined
      };

      if (editando) {
        // ✅ CORREÇÃO: Para edição, incluir ativo apenas se estiver editando
        const updateData: any = {
          nome: formData.nome,
          descricao: formData.descricao || undefined
        };

        // ✅ CORREÇÃO: Incluir ativo apenas se o campo existir no banco
        if (editando.ativo !== undefined) {
          updateData.ativo = formData.ativo;
        }

        await updateCategoria(editando.id, updateData);
        alert("✅ Categoria atualizada com sucesso!");
      } else {
        await createCategoria(loja.id, categoriaData);
        alert("✅ Categoria criada com sucesso!");
      }

      // Limpar formulário e recarregar lista
      setFormData({ nome: "", descricao: "", ativo: true });
      setEditando(null);
      await carregarCategorias();

    } catch (error: any) {
      console.error("Erro ao salvar categoria:", error);
      alert(error.message || "Erro ao salvar categoria");
    }
  };

  const handleEditar = (categoria: Categoria) => {
    setEditando(categoria);
    setFormData({
      nome: categoria.nome,
      descricao: categoria.descricao || "",
      ativo: categoria.ativo !== undefined ? categoria.ativo : true,
    });
  };

  const handleCancelarEdicao = () => {
    setEditando(null);
    setFormData({ nome: "", descricao: "", ativo: true });
  };

  const handleExcluir = async (categoria: Categoria) => {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${categoria.nome}"?`)) {
      return;
    }

    try {
      await deleteCategoria(categoria.id);
      alert("✅ Categoria excluída com sucesso!");
      await carregarCategorias();
    } catch (error: any) {
      console.error("Erro ao excluir categoria:", error);
      alert(error.message || "Erro ao excluir categoria");
    }
  };

  const toggleAtivo = async (categoria: Categoria) => {
    try {
      // ✅ CORREÇÃO: Verificar se o campo ativo existe antes de tentar atualizar
      if (categoria.ativo === undefined) {
        alert("Esta categoria não suporta ativação/desativação");
        return;
      }

      const updateData = { ativo: !categoria.ativo };
      await updateCategoria(categoria.id, updateData);
      alert(`✅ Categoria ${!categoria.ativo ? 'ativada' : 'desativada'} com sucesso!`);
      await carregarCategorias();
    } catch (error: any) {
      console.error("Erro ao atualizar categoria:", error);
      alert(error.message || "Erro ao atualizar categoria");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Categorias</h1>
          <p className="text-gray-600 mt-1">Crie categorias para organizar seus produtos</p>
        </div>

        <button
          onClick={carregarCategorias}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          🔄 Atualizar Lista
        </button>
      </div>

      {/* Formulário para adicionar/editar categoria */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {editando ? "✏️ Editar Categoria" : "➕ Criar Nova Categoria"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Categoria *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Roupas, Calçados, Eletrônicos..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição (Opcional)
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descreva esta categoria..."
              rows={3}
            />
          </div>

          {/* ✅ CORREÇÃO: Mostrar toggle de ativo apenas se a categoria tiver o campo */}
          {editando && editando.ativo !== undefined && (
            <div className="flex items-center">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Categoria ativa</span>
              </label>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "⏳ Salvando..." : editando ? "✅ Atualizar" : "➕ Criar Categoria"}
            </button>

            {editando && (
              <button
                type="button"
                onClick={handleCancelarEdicao}
                disabled={loading}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
              >
                ❌ Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Lista de categorias */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          📋 Suas Categorias {categorias.length > 0 && `(${categorias.length})`}
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="flex items-center gap-3 text-gray-600">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span>Carregando categorias...</span>
            </div>
          </div>
        ) : categorias.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhuma categoria cadastrada</h3>
            <p className="text-gray-500 mb-4">
              Crie sua primeira categoria usando o formulário acima para organizar seus produtos.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {categorias.map((categoria) => (
              <div
                key={categoria.id}
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                  categoria.ativo !== false // ✅ CORREÇÃO: Considerar ativo se não for false
                    ? 'border-green-200 bg-green-50 hover:bg-green-100'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100 opacity-60'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg text-gray-900">{categoria.nome}</h3>
                    {/* ✅ CORREÇÃO: Mostrar status apenas se o campo ativo existir */}
                    {categoria.ativo !== undefined && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        categoria.ativo !== false
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {categoria.ativo !== false ? 'Ativa' : 'Inativa'}
                      </span>
                    )}
                  </div>
                  {categoria.descricao && (
                    <p className="text-gray-600 mt-1">{categoria.descricao}</p>
                  )}
                  <p className="text-sm text-gray-400 mt-1">
                    Criada em: {new Date(categoria.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div className="flex gap-2">
                  {/* ✅ CORREÇÃO: Mostrar botão de ativar/desativar apenas se o campo existir */}
                  {categoria.ativo !== undefined && (
                    <button
                      onClick={() => toggleAtivo(categoria)}
                      className={`px-3 py-1 rounded text-sm ${
                        categoria.ativo !== false
                          ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {categoria.ativo !== false ? '⏸️ Desativar' : '▶️ Ativar'}
                    </button>
                  )}
                  <button
                    onClick={() => handleEditar(categoria)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleExcluir(categoria)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informações */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">💡 Como funciona:</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• <strong>Crie categorias primeiro</strong> nesta página</li>
          <li>• Categorias <strong>ativas</strong> aparecem para os clientes</li>
          <li>• Categorias <strong>inativas</strong> ficam ocultas dos clientes</li>
          <li>• Você pode ativar/desativar categorias sem excluí-las</li>
          <li>• As categorias ajudam a organizar e filtrar seus produtos</li>
        </ul>
      </div>
    </div>
  );
}
