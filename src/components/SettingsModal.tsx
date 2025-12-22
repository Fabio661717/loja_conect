// SettingsModal.tsx
import { useCategoriasCliente } from "../hooks/useCategoriasCliente";
import { useConfiguracoesCliente } from "../hooks/useConfiguracoesCliente";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { configuracoes, categoriasDisponiveis, alternarTema, atualizarCategoriasSelecionadas } = useConfiguracoesCliente();
const { categorias: _categorias, loading } = useCategoriasCliente();

  if (!isOpen) return null;

  const handleCategoriaToggle = (categoria: string) => {
    const novasCategorias = configuracoes.categoriasSelecionadas.includes(categoria)
      ? configuracoes.categoriasSelecionadas.filter(c => c !== categoria)
      : [...configuracoes.categoriasSelecionadas, categoria];

    atualizarCategoriasSelecionadas(novasCategorias);
  };

  const selecionarTodasCategorias = () => {
    atualizarCategoriasSelecionadas(categoriasDisponiveis);
  };

  const limparSelecoes = () => {
    atualizarCategoriasSelecionadas([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Configurações</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Tema */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Aparência</h3>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>Modo Escuro</span>
              <button
                onClick={alternarTema}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  configuracoes.theme === "dark" ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    configuracoes.theme === "dark" ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Categorias */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Categorias</h3>
              <div className="flex space-x-2">
                <button
                  onClick={selecionarTodasCategorias}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Todas
                </button>
                <button
                  onClick={limparSelecoes}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Limpar
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Carregando categorias...</p>
              </div>
            ) : categoriasDisponiveis.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                Nenhuma categoria disponível para esta loja
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {categoriasDisponiveis.map((categoria) => (
                  <label
                    key={categoria}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={configuracoes.categoriasSelecionadas.includes(categoria)}
                      onChange={() => handleCategoriaToggle(categoria)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="flex-1">{categoria}</span>
                  </label>
                ))}
              </div>
            )}

            {configuracoes.categoriasSelecionadas.length > 0 && (
              <p className="text-sm text-gray-600 mt-3">
                {configuracoes.categoriasSelecionadas.length} categoria(s) selecionada(s)
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
