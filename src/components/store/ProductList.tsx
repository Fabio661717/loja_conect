 //store/ProductList.tsx
 import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase';

interface Product {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  descricao: string;
  imagem_url: string;
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, [user]);

  const loadProducts = async () => {
    if (!user?.lojaId) return;

    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('loja_id', user.lojaId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar produtos:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('Erro ao excluir produto:', error);
      alert('Erro ao excluir produto');
    } else {
      setProducts(products.filter(p => p.id !== productId));
      alert('Produto excluído com sucesso');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Meus Produtos</h1>
        <button
          onClick={() => navigate('/loja/produtos/novo')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
        >
          + Novo Produto
        </button>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 mb-4">Nenhum produto cadastrado ainda.</p>
          <button
            onClick={() => navigate('/loja/produtos/novo')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Cadastrar Primeiro Produto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow border">
              {product.imagem_url && (
                <img
                  src={product.imagem_url}
                  alt={product.nome}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              )}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">{product.nome}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.descricao}</p>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-lg font-bold text-green-600">
                    R$ {product.preco.toFixed(2)}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    product.estoque > 5 ? 'bg-green-100 text-green-800' :
                    product.estoque > 0 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    Estoque: {product.estoque}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/loja/produtos/editar/${product.id}`)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded text-sm"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
