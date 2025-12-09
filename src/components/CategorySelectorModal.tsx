import React from 'react';

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface CategorySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategories: string[];
  onCategoryToggle: (categoryId: string) => void;
  onSave: (categoryIds: string[]) => void;
  loading?: boolean;
}

export const CategorySelectorModal: React.FC<CategorySelectorModalProps> = ({
  isOpen,
  onClose,
  categories,
  selectedCategories,
  onCategoryToggle,
  onSave,
  loading = false
}) => {
  if (!isOpen) return null;

  const handleSave = () => {
    onSave(selectedCategories);
    onClose();
  };

  const handleSelectAll = () => {
    categories.forEach(cat => {
      if (!selectedCategories.includes(cat.id)) {
        onCategoryToggle(cat.id);
      }
    });
  };

  const handleSelectNone = () => {
    selectedCategories.forEach(catId => {
      onCategoryToggle(catId);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Escolher Categorias</h2>
            <p className="text-gray-600 text-sm mt-1">
              Selecione as categorias que você deseja receber notificações
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 border rounded">
                  <div className="w-6 h-6 bg-gray-300 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📭</div>
              <p>Nenhuma categoria disponível</p>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map(category => (
                <label
                  key={category.id}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => onCategoryToggle(category.id)}
                    className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{category.name}</div>
                    {category.description && (
                      <div className="text-sm text-gray-600 mt-1">{category.description}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              disabled={categories.length === 0}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
            >
              Selecionar Todas
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleSelectNone}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Limpar Seleção
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium transition-colors disabled:opacity-50"
            >
              Salvar Preferências
            </button>
          </div>
        </div>

        {/* Contador */}
        <div className="px-6 py-3 bg-blue-50 border-t">
          <div className="text-sm text-blue-700 font-medium">
            {selectedCategories.length} categorias selecionadas
          </div>
        </div>
      </div>
    </div>
  );
};
