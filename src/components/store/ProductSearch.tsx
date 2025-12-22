// src/components/store/ProductSearch.tsx
import { useEffect, useState } from 'react';
import { usePromotion } from '../../context/PromotionContext';

interface ProductSearchProps {
  onProductSelect: (product: any) => void;
  selectedProduct?: any;
}

export default function ProductSearch({ onProductSelect, selectedProduct }: ProductSearchProps) {
  const { searchProducts } = usePromotion();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim()) {
        performSearch(searchTerm);
      } else {
        setProducts([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const performSearch = async (term: string) => {
    setLoading(true);
    try {
      const results = await searchProducts(term);
      setProducts(results);
      setShowResults(true);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product: any) => {
    onProductSelect(product);
    setSearchTerm(product.nome);
    setShowResults(false);
  };

  const clearSelection = () => {
    onProductSelect(null);
    setSearchTerm('');
    setShowResults(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        🔍 Buscar Produto para Promoção
      </label>

      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Digite o nome do produto..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />

        {loading && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
          </div>
        )}

        {selectedProduct && (
          <button
            onClick={clearSelection}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {showResults && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {products.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Nenhum produto encontrado
            </div>
          ) : (
            products.map(product => (
              <button
                key={product.id}
                onClick={() => handleProductSelect(product)}
                className="w-full text-left p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center space-x-3">
                  {product.foto_url && (
                    <img
                      src={product.foto_url}
                      alt={product.nome}
                      className="w-10 h-10 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{product.nome}</div>
                    <div className="text-sm text-gray-500">
                      Estoque: {product.estoque} • R$ {product.preco}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {selectedProduct && (
        <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {selectedProduct.foto_url && (
                <img
                  src={selectedProduct.foto_url}
                  alt={selectedProduct.nome}
                  className="w-12 h-12 rounded object-cover"
                />
              )}
              <div>
                <div className="font-medium text-green-800">{selectedProduct.nome}</div>
                <div className="text-sm text-green-600">
                  Preço atual: R$ {selectedProduct.preco} • Estoque: {selectedProduct.estoque}
                </div>
              </div>
            </div>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
              ✅ Selecionado
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
