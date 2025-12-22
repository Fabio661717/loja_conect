// src/components/store/PromotionCard.tsx
import { useState } from 'react';
import { usePromotion } from '../../context/PromotionContext';
import { Promotion } from '../../types/Promotion';

interface PromotionCardProps {
  promotion: Promotion;
  onUpdate: () => void;
}

export default function PromotionCard({ promotion, onUpdate }: PromotionCardProps) {
  const { deactivatePromotion, loading } = usePromotion();
  const [showActions, setShowActions] = useState(false);

  const desconto = Math.round(((promotion.preco_original - promotion.preco_promocional) / promotion.preco_original) * 100);
  const diasRestantes = Math.ceil((new Date(promotion.data_fim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const handleDeactivate = async () => {
    if (!confirm('Tem certeza que deseja desativar esta promoção?')) return;

    try {
      await deactivatePromotion(promotion.id);
      onUpdate();
    } catch (error: any) {
      alert('Erro ao desativar promoção: ' + error.message);
    }
  };

  const getStatusColor = () => {
    if (!promotion.ativa) return 'bg-gray-100 text-gray-800';
    if (diasRestantes <= 0) return 'bg-red-100 text-red-800';
    if (diasRestantes <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = () => {
    if (!promotion.ativa) return 'Inativa';
    if (diasRestantes <= 0) return 'Expirada';
    if (diasRestantes <= 3) return `Termina em ${diasRestantes} dias`;
    return 'Ativa';
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={promotion.produto?.foto_url || '/placeholder-product.jpg'}
          alt={promotion.produto?.nome}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
        <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
          -{desconto}%
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 mb-1">
          {promotion.produto?.nome}
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          {promotion.categoria?.nome}
        </p>

        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">De:</span>
            <span className="text-sm text-gray-500 line-through">
              R$ {promotion.preco_original}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Por:</span>
            <span className="text-lg font-bold text-red-600">
              R$ {promotion.preco_promocional}
            </span>
          </div>
          {promotion.parcelas > 1 && (
            <div className="text-center">
              <span className="text-sm text-green-600">
                ou {promotion.parcelas}x de R$ {promotion.valor_parcela}
              </span>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 space-y-1 mb-4">
          <div>Início: {new Date(promotion.data_inicio).toLocaleDateString('pt-BR')}</div>
          <div>Término: {new Date(promotion.data_fim).toLocaleDateString('pt-BR')}</div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={() => setShowActions(!showActions)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ⚙️ Ações
          </button>

          {promotion.ativa && diasRestantes > 0 && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              🔥 Ativa
            </span>
          )}
        </div>

        {showActions && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="space-y-2">
              {promotion.ativa && (
                <button
                  onClick={handleDeactivate}
                  disabled={loading}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                >
                  🛑 Desativar Promoção
                </button>
              )}
              <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
                ✏️ Editar
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded">
                📊 Ver Estatísticas
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
