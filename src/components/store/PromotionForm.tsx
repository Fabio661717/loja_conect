// src/components/store/PromotionForm.tsx - VERSÃO COMPLETAMENTE CORRIGIDA
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePromotion } from '../../context/PromotionContext';
import { useCategories } from '../../hooks/useCategorias';
import { useNotificationSystem } from '../../hooks/useNotificationSystem';
import ProductSearch from './ProductSearch';

// ✅ PROMOTION MANAGER INTEGRADO
import { useNotifications } from '../../context/NotificationContext';

export default function PromotionForm() {
  const navigate = useNavigate();
  const { createPromotion, loading } = usePromotion();
  const { categories } = useCategories();
  const { notifyPromotion } = useNotificationSystem();
  const { sendPushNotification } = useNotifications();

  const [formData, setFormData] = useState({
    product_id: '',
    preco_original: 0,
    preco_promocional: 0,
    parcelas: 1,
    categoria_id: '',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: '',
    enviar_notificacao: true
  });

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [calculations, setCalculations] = useState({
    descontoPercentual: 0,
    valorParcela: 0,
    totalEconomia: 0
  });

  // ✅ PROMOTION MANAGER INTEGRADO
  const PromotionManager = ({ promotion, targetUsers }: { promotion: any; targetUsers: string[] }) => {
    const { sendPushNotification } = useNotifications();

    const launchPromotion = async (promotionData: any, userList: string[]) => {
      try {
        console.log('🚀 Iniciando lançamento de promoção para', userList.length, 'usuários');

        // Enviar para múltiplos usuários
        const notifications = userList.map(userId =>
          sendPushNotification(
            userId,
            '🔥 Promoção Relâmpago!',
            `${promotionData.title} - ${promotionData.description}`,
            {
              promotionId: promotionData.id,
              discount: promotionData.discount,
              validUntil: promotionData.endDate
            }
          )
        );

        const results = await Promise.allSettled(notifications);

        const successful = results.filter(result => result.status === 'fulfilled').length;
        const failed = results.filter(result => result.status === 'rejected').length;

        console.log(`📊 Resultado das notificações: ${successful} sucessos, ${failed} falhas`);

        return { successful, failed };
      } catch (error) {
        console.error('❌ Erro ao lançar promoção:', error);
        throw error;
      }
    };

    return (
      <div className="promotion-manager">
        <button
          onClick={() => launchPromotion(promotion, targetUsers)}
          className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white py-2 px-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          🚀 Lançar Promoção em Massa
        </button>
      </div>
    );
  };

  // Calcular valores quando preços mudam
  useEffect(() => {
    if (formData.preco_original > 0 && formData.preco_promocional > 0) {
      const desconto = ((formData.preco_original - formData.preco_promocional) / formData.preco_original) * 100;
      const economia = formData.preco_original - formData.preco_promocional;
      const parcela = formData.preco_promocional / formData.parcelas;

      setCalculations({
        descontoPercentual: Math.round(desconto),
        valorParcela: parseFloat(parcela.toFixed(2)),
        totalEconomia: parseFloat(economia.toFixed(2))
      });
    }
  }, [formData.preco_original, formData.preco_promocional, formData.parcelas]);

  // Preencher dados quando produto é selecionado
  useEffect(() => {
    if (selectedProduct) {
      setFormData(prev => ({
        ...prev,
        product_id: selectedProduct.id,
        preco_original: selectedProduct.preco,
        categoria_id: selectedProduct.categoria_id
      }));
    }
  }, [selectedProduct]);

  // ✅ FUNÇÃO CORRIGIDA: Notificar clientes sobre promoção (AGORA COM 4 ARGUMENTOS)
  const notifyClientsAboutPromotion = async () => {
    if (!selectedProduct || !formData.enviar_notificacao) return;

    try {
      // ✅ Buscar categoria do produto
      const categoriaSelecionada = categories.find(cat => cat.id === formData.categoria_id);
      if (!categoriaSelecionada) {
        console.warn('❌ Categoria não encontrada para notificação');
        return;
      }

      const discount = calculations.descontoPercentual;
      const originalPrice = formData.preco_original;

      console.log('🎯 Enviando notificação de promoção:', {
        product: selectedProduct.nome,
        category: categoriaSelecionada.nome,
        discount: `${discount}%`,
        originalPrice,
        promotionalPrice: formData.preco_promocional
      });

      // ✅ Converter categoria para o formato esperado por notifyPromotion
      const categoriaConvertida = {
        id: categoriaSelecionada.id,
        name: categoriaSelecionada.nome,
        nome: categoriaSelecionada.nome, // manter compatibilidade
        loja_id: categoriaSelecionada.loja_id,
        descricao: categoriaSelecionada.descricao,
        is_active: categoriaSelecionada.is_active,
        created_at: categoriaSelecionada.created_at,
        updated_at: categoriaSelecionada.updated_at,
source: (categoriaSelecionada.source ?? "store") as "store" | "global"      };

      // ✅ CORREÇÃO: Chamada com 4 argumentos corretos
      await notifyPromotion(
        {
          ...selectedProduct,
          preco: formData.preco_promocional // usar preço promocional
        },
        categoriaConvertida,
        discount, // ✅ TERCEIRO ARGUMENTO: porcentagem de desconto
        originalPrice // ✅ QUARTO ARGUMENTO: preço original
      );

      console.log('✅ Notificação de promoção enviada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de promoção:', error);
      // Não falha a criação da promoção se a notificação der erro
    }
  };

  // ✅ FUNÇÃO: Lançar promoção em massa usando PromotionManager
  const launchMassPromotion = async () => {
    if (!selectedProduct) {
      alert('Por favor, selecione um produto primeiro');
      return;
    }

    try {
      // Simular lista de usuários-alvo
      const targetUsers = ['user1', 'user2', 'user3'];

      const promotionData = {
        id: `promo-${Date.now()}`,
        title: `🔥 PROMOÇÃO: ${selectedProduct.nome}`,
        description: `Aproveite ${calculations.descontoPercentual}% de desconto! De R$ ${formData.preco_original} por R$ ${formData.preco_promocional}`,
        discount: calculations.descontoPercentual,
        endDate: formData.data_fim,
        product: selectedProduct
      };

      console.log('🚀 Preparando promoção em massa:', promotionData);

      // ✅ CORREÇÃO: Usar sendPushNotification diretamente
      const notifications = targetUsers.map(userId =>
        sendPushNotification(
          userId,
          promotionData.title,
          promotionData.description,
          {
            promotionId: promotionData.id,
            discount: promotionData.discount,
            validUntil: promotionData.endDate,
            productId: selectedProduct.id
          }
        )
      );

      await Promise.all(notifications);

      alert(`✅ Promoção lançada para ${targetUsers.length} clientes!`);

    } catch (error) {
      console.error('❌ Erro ao lançar promoção em massa:', error);
      alert('Erro ao lançar promoção em massa');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) {
      alert('Por favor, selecione um produto');
      return;
    }

    if (!formData.data_fim) {
      alert('Por favor, defina a data final da promoção');
      return;
    }

    if (formData.preco_promocional >= formData.preco_original) {
      alert('O preço promocional deve ser menor que o preço original');
      return;
    }

    // ✅ Buscar nome real da categoria selecionada
    const categoriaSelecionada = categories.find(cat => cat.id === formData.categoria_id);
    if (!categoriaSelecionada) {
      alert('Categoria não encontrada');
      return;
    }

    const categoriaNomeReal = categoriaSelecionada.nome;

    try {
      console.log('📦 Dados da promoção:', {
        product_id: selectedProduct.id,
        categoria_id: formData.categoria_id,
        categoria_nome_real: categoriaNomeReal,
        preco_original: formData.preco_original,
        preco_promocional: formData.preco_promocional,
        desconto_percentual: calculations.descontoPercentual
      });

      // ✅ Criar promoção no banco
      await createPromotion({
        ...formData,
        categoria_nome: categoriaNomeReal
      });

      // ✅ Notificar clientes interessados
      if (formData.enviar_notificacao) {
        await notifyClientsAboutPromotion();
        alert('✅ Promoção criada com sucesso! Clientes interessados foram notificados.');
      } else {
        alert('✅ Promoção criada com sucesso!');
      }

      navigate('/loja/promocoes');
    } catch (error: any) {
      console.error('❌ Erro ao criar promoção:', error);
      alert('❌ Erro ao criar promoção: ' + error.message);
    }
  };

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
  };

  // ✅ Dados de exemplo para o PromotionManager
  const samplePromotion = {
    id: 'sample-promo',
    title: `🔥 ${selectedProduct?.nome || 'Produto'} em Promoção!`,
    description: `Desconto especial de ${calculations.descontoPercentual}%`,
    discount: calculations.descontoPercentual,
    endDate: formData.data_fim || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };

  const sampleUsers = ['user1', 'user2', 'user3'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🔥 Criar Nova Promoção</h1>
              <p className="text-gray-600 mt-1">
                Crie promoções atrativas para seus produtos
              </p>
            </div>
            <button
              onClick={() => navigate('/loja/promocoes')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Voltar
            </button>
          </div>

          {/* ✅ PROMOTION MANAGER INTEGRADO */}
          {selectedProduct && calculations.descontoPercentual > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-800 mb-3">🚀 Gerenciador de Promoções</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-purple-700 mb-2">Promoção em Massa</h4>
                  <p className="text-sm text-purple-600 mb-3">
                    Envie notificações push para múltiplos clientes de uma vez
                  </p>
                  <button
                    onClick={launchMassPromotion}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-2 px-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    📢 Lançar para Todos
                  </button>
                </div>

                <div className="bg-white p-3 rounded border">
                  <h4 className="font-medium text-gray-700 mb-2">📊 Estatísticas</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>• Desconto: <strong>{calculations.descontoPercentual}%</strong></div>
                    <div>• Economia: <strong>R$ {calculations.totalEconomia}</strong></div>
                    <div>• Preço final: <strong>R$ {formData.preco_promocional}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <ProductSearch
              onProductSelect={handleProductSelect}
              selectedProduct={selectedProduct}
            />

            {/* Preços */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💰 Preço Original (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.preco_original}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    preco_original: parseFloat(e.target.value) || 0
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!selectedProduct}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔥 Preço Promocional (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.preco_promocional}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    preco_promocional: parseFloat(e.target.value) || 0
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            </div>

            {calculations.descontoPercentual > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">📊 Resumo da Promoção</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {calculations.descontoPercentual}%
                    </div>
                    <div className="text-sm text-yellow-700">Desconto</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      R$ {calculations.totalEconomia}
                    </div>
                    <div className="text-sm text-yellow-700">Economia</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {formData.parcelas}x
                    </div>
                    <div className="text-sm text-yellow-700">Parcelas</div>
                  </div>
                </div>
              </div>
            )}

            {/* Parcelas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💳 Número de Parcelas
              </label>
              <select
                value={formData.parcelas}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  parcelas: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1x (À vista)</option>
                <option value={2}>2x</option>
                <option value={3}>3x</option>
                <option value={4}>4x</option>
                <option value={5}>5x</option>
                <option value={6}>6x</option>
                <option value={10}>10x</option>
                <option value={12}>12x</option>
              </select>

              {formData.parcelas > 1 && calculations.valorParcela > 0 && (
                <p className="text-sm text-green-600 mt-2">
                  💰 {formData.parcelas}x de R$ {calculations.valorParcela} sem juros
                </p>
              )}
            </div>

            {/* Categoria para Notificação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📢 Categoria para Notificação
              </label>
              <select
                value={formData.categoria_id}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  categoria_id: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecione uma categoria</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Data de Início
                </label>
                <input
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    data_inicio: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Data de Término
                </label>
                <input
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    data_fim: e.target.value
                  }))}
                  min={formData.data_inicio}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Notificação */}
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
              <input
                type="checkbox"
                id="enviar_notificacao"
                checked={formData.enviar_notificacao}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  enviar_notificacao: e.target.checked
                }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="enviar_notificacao" className="text-sm text-blue-800">
                📢 Enviar notificação para clientes interessados nesta categoria
              </label>
            </div>

            {formData.enviar_notificacao && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-600">🔔</span>
                  <h4 className="font-semibold text-green-800">Sistema de Notificações Ativo</h4>
                </div>
                <p className="text-sm text-green-700">
                  Clientes que selecionaram esta categoria como preferida receberão uma notificação
                  automática sobre esta promoção, incluindo alerta sonoro no celular.
                </p>
              </div>
            )}

            {/* Botões */}
            <div className="flex justify-between items-center pt-6 border-t">
              <div>
                {selectedProduct && (
                  <button
                    type="button"
                    onClick={launchMassPromotion}
                    className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition duration-200 text-sm"
                  >
                    🚀 Testar Promoção em Massa
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/loja/promocoes')}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Criando...
                    </>
                  ) : (
                    '🔥 Criar Promoção'
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* ✅ PROMOTION MANAGER COMPONENT VISUAL */}
          {selectedProduct && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Promotion Manager</h3>
              <PromotionManager
                promotion={samplePromotion}
                targetUsers={sampleUsers}
              />
              <p className="text-sm text-gray-600 mt-2">
                Use este manager para enviar promoções para grupos específicos de clientes
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
