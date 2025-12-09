// src/components/store/PromotionManager.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePromotion } from '../../context/PromotionContext';
import { useCategories } from '../../hooks/useCategorias';
import PromotionCard from './PromotionCard';

export default function PromotionManager() {
  const navigate = useNavigate();
  const { promotions, activePromotions, loading, refreshPromotions } = usePromotion();
  const { categories } = useCategories();

  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredPromotions = promotions.filter(promotion => {
    if (filter === 'active' && !promotion.ativa) return false;
    if (filter === 'inactive' && promotion.ativa) return false;
    if (selectedCategory !== 'all' && promotion.categoria_id !== selectedCategory) return false;
    return true;
  });

  const stats = {
    total: promotions.length,
    active: activePromotions.length,
    inactive: promotions.length - activePromotions.length
  };

  useEffect(() => {
    refreshPromotions();
  }, []);

  if (loading && promotions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🔥 Gerenciar Promoções</h1>
              <p className="text-gray-600 mt-1">
                Crie e gerencie promoções para seus produtos
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/loja/promocoes/nova')}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
              >
                ➕ Nova Promoção
              </button>
              <button
                onClick={() => navigate('/loja')}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium"
              >
                ← Voltar
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-700">Total</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-green-700">Ativas</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
              <div className="text-sm text-gray-700">Inativas</div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas as promoções</option>
                <option value="active">Apenas ativas</option>
                <option value="inactive">Apenas inativas</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas as categorias</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Promoções */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {filteredPromotions.length} Promoção{filteredPromotions.length !== 1 ? 'es' : ''} Encontrada{filteredPromotions.length !== 1 ? 's' : ''}
          </h2>

          {filteredPromotions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔥</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhuma promoção encontrada
              </h3>
              <p className="text-gray-500 mb-6">
                {filter === 'all'
                  ? 'Comece criando sua primeira promoção!'
                  : 'Nenhuma promoção corresponde aos filtros selecionados.'
                }
              </p>
              <button
                onClick={() => navigate('/loja/promocoes/nova')}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium"
              >
                ➕ Criar Primeira Promoção
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPromotions.map(promotion => (
                <PromotionCard
                  key={promotion.id}
                  promotion={promotion}
                  onUpdate={refreshPromotions}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
