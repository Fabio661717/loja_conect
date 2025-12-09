// src/components/client/PromotionCardClient.tsx - VERSÃO CORRIGIDA
import { PromotionCardClientProps } from '../../types';

export default function PromotionCardClient({ promotion }: PromotionCardClientProps) {
  // ✅ CORREÇÃO: Validação segura
  if (!promotion || !promotion.produto) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <div className="text-center text-gray-500">
          Promoção indisponível
        </div>
      </div>
    );
  }

  const desconto = Math.round(((promotion.preco_original - promotion.preco_promocional) / promotion.preco_original) * 100);
  const diasRestantes = Math.ceil((new Date(promotion.data_fim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-white rounded-xl shadow-lg border border-red-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Badge de Desconto */}
      <div className="relative">
        <img
          src={promotion.produto.foto_url || '/placeholder-product.jpg'}
          alt={promotion.produto.nome}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
          -{desconto}% OFF
        </div>

        {/* Contador Regressivo */}
        {diasRestantes > 0 && (
          <div className="absolute bottom-3 left-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
            ⏰ {diasRestantes} dia{diasRestantes !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
          {promotion.produto.nome}
        </h3>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {promotion.produto.descricao}
        </p>

        {/* Preços */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Preço original:</span>
            <span className="text-sm text-gray-500 line-through">
              R$ {promotion.preco_original.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-gray-800">Preço com desconto:</span>
            <span className="text-xl font-bold text-red-600">
              R$ {promotion.preco_promocional.toFixed(2)}
            </span>
          </div>

          {promotion.parcelas > 1 && (
            <div className="text-center pt-2 border-t border-gray-100">
              <span className="text-sm font-medium text-green-600">
                ou {promotion.parcelas}x de R$ {promotion.valor_parcela.toFixed(2)} sem juros
              </span>
            </div>
          )}
        </div>

        {/* Economia */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-green-800 font-medium">
              💰 Você economiza:
            </span>
            <span className="text-lg font-bold text-green-700">
              R$ {(promotion.preco_original - promotion.preco_promocional).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Botão de Ação */}
        <button className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2">
          🛒 Reservar com Desconto
        </button>

        {/* Informações Adicionais */}
        <div className="mt-3 text-xs text-gray-500 text-center">
          Promoção válida até {new Date(promotion.data_fim).toLocaleDateString('pt-BR')}
        </div>
      </div>
    </div>
  );
}
