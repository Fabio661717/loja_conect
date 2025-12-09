// src/components/store/Dashboard.tsx - VERSÃO COMPLETA COM PROMOÇÕES
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useSupabase } from "../../hooks/useSupabase";
import { supabase } from "../../services/supabase";

interface StoreStats {
  totalProducts: number;
  activeReservations: number;
  lowStockProducts: number;
  totalRevenue: number;
  totalCategories: number;
  activePromotions: number;
}

export default function DashboardLoja() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getStoreByOwner, updateStoreWaitTime } = useSupabase();

  const [stats, setStats] = useState<StoreStats>({
    totalProducts: 0,
    activeReservations: 0,
    lowStockProducts: 0,
    totalRevenue: 0,
    totalCategories: 0,
    activePromotions: 0
  });
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<any>(null);
  const [currentWaitTime, setCurrentWaitTime] = useState<number>(8);
  const [timeLoading, setTimeLoading] = useState<boolean>(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Carregar dados da loja
      const storeData = await getStoreByOwner();
      setStore(storeData);

      if (!storeData) return;

      // ✅ CARREGAR TEMPO DE ESPERA ATUAL
      if (storeData.wait_time) {
        setCurrentWaitTime(storeData.wait_time);
      }

      // Carregar estatísticas
      const { data: products, error: productsError } = await supabase
        .from("produtos")
        .select("id, preco, estoque")
        .eq("loja_id", storeData.id);

      const { data: reservations, error: reservationsError } = await supabase
        .from("reservas")
        .select("id, status")
        .eq("loja_id", storeData.id)
        .eq("status", "pendente");

      const { data: categories, error: categoriesError } = await supabase
        .from("categorias")
        .select("id")
        .eq("loja_id", storeData.id);

      // ✅ NOVO: Carregar promoções ativas
      const { data: promotions, error: promotionsError } = await supabase
        .from("promocoes")
        .select("id")
        .eq("loja_id", storeData.id)
        .eq("ativa", true)
        .gte("data_fim", new Date().toISOString());

      if (productsError) console.error("Erro ao carregar produtos:", productsError);
      if (reservationsError) console.error("Erro ao carregar reservas:", reservationsError);
      if (categoriesError) console.error("Erro ao carregar categorias:", categoriesError);
      if (promotionsError) console.error("Erro ao carregar promoções:", promotionsError);

      const totalProducts = products?.length || 0;
      const lowStockProducts = products?.filter(p => p.estoque <= 5).length || 0;
      const totalRevenue = products?.reduce((sum, p) => sum + (p.preco * p.estoque), 0) || 0;
      const activeReservations = reservations?.length || 0;
      const totalCategories = categories?.length || 0;
      const activePromotions = promotions?.length || 0;

      setStats({
        totalProducts,
        activeReservations,
        lowStockProducts,
        totalRevenue,
        totalCategories,
        activePromotions
      });

    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNÇÃO PARA SALVAR TEMPO
  const handleTimeConfig = async (hours: number) => {
    if (!store || timeLoading) return;

    setTimeLoading(true);
    try {
      console.log("💾 Salvando tempo de espera:", hours, "horas para loja:", store.id);

      await updateStoreWaitTime(store.id, hours);
      setCurrentWaitTime(hours);

      console.log("✅ Tempo de espera atualizado para:", hours, "horas");
    } catch (error) {
      console.error("❌ Erro ao salvar tempo de espera:", error);
    } finally {
      setTimeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {store?.nome || "Minha Loja"}
          </h1>
          <p className="text-gray-600">Gerencie seus produtos, reservas, promoções e funcionários</p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200"
        >
          ← Voltar
        </button>
      </div>

      {/* ✅ ESTATÍSTICAS ATUALIZADAS COM PROMOÇÕES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-8m8 0h2" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total de Produtos</h3>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Reservas Ativas</h3>
              <p className="text-2xl font-semibold text-green-600">{stats.activeReservations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Estoque Baixo</h3>
              <p className="text-2xl font-semibold text-yellow-600">{stats.lowStockProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v1m0 6v1m0-1v-1" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Valor em Estoque</h3>
              <p className="text-2xl font-semibold text-purple-600">
                R$ {stats.totalRevenue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-indigo-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Categorias</h3>
              <p className="text-2xl font-semibold text-indigo-600">{stats.totalCategories}</p>
            </div>
          </div>
        </div>

        {/* ✅ NOVO: ESTATÍSTICA DE PROMOÇÕES */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Promoções Ativas</h3>
              <p className="text-2xl font-semibold text-red-600">{stats.activePromotions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ AÇÕES RÁPIDAS ATUALIZADAS COM BOTÃO PROMOÇÃO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <button
          onClick={() => navigate("/loja/produtos/novo")}
          className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg shadow text-center transition duration-200 transform hover:scale-105"
        >
          <div className="text-2xl mb-2">📦</div>
          <h3 className="font-semibold">Cadastrar Produto</h3>
          <p className="text-sm opacity-90 mt-1">Adicionar novo produto ao catálogo</p>
        </button>

        {/* ✅ NOVO BOTÃO: PROMOÇÕES */}
        <button
          onClick={() => navigate("/loja/promocoes")}
          className="bg-red-600 hover:bg-red-700 text-white p-6 rounded-lg shadow text-center transition duration-200 transform hover:scale-105"
        >
          <div className="text-2xl mb-2">🔥</div>
          <h3 className="font-semibold">Promoções</h3>
          <p className="text-sm opacity-90 mt-1">Criar e gerenciar promoções</p>
        </button>

        <button
          onClick={() => navigate("/loja/categorias")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-lg shadow text-center transition duration-200 transform hover:scale-105"
        >
          <div className="text-2xl mb-2">📁</div>
          <h3 className="font-semibold">Categorias</h3>
          <p className="text-sm opacity-90 mt-1">Gerenciar categorias de produtos</p>
        </button>

        <button
          onClick={() => navigate("/loja/reservas")}
          className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg shadow text-center transition duration-200 transform hover:scale-105"
        >
          <div className="text-2xl mb-2">🛒</div>
          <h3 className="font-semibold">Produtos Reservados</h3>
          <p className="text-sm opacity-90 mt-1">Gerenciar reservas ativas</p>
        </button>

        <button
          onClick={() => navigate("/loja/timer")}
          className="bg-yellow-600 hover:bg-yellow-700 text-white p-6 rounded-lg shadow text-center transition duration-200 transform hover:scale-105"
        >
          <div className="text-2xl mb-2">⏰</div>
          <h3 className="font-semibold">Tempo de Espera</h3>
          <p className="text-sm opacity-90 mt-1">Configurar tempo padrão</p>
        </button>

        <button
          onClick={() => navigate("/loja/funcionarios")}
          className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg shadow text-center transition duration-200 transform hover:scale-105"
        >
          <div className="text-2xl mb-2">👥</div>
          <h3 className="font-semibold">Funcionários</h3>
          <p className="text-sm opacity-90 mt-1">Gerenciar equipe</p>
        </button>
      </div>

      {/* ✅ SEÇÃO: Configuração Rápida de Tempo */}
      {store && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">⏰ Tempo de Espera Padrão</h2>
              <p className="text-gray-600 mt-1">Configure o tempo padrão para novas reservas:</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Configuração atual:</p>
              <p className="text-lg font-bold text-blue-600">{currentWaitTime} horas</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {[6, 8, 12, 24].map((hours) => (
              <button
                key={hours}
                onClick={() => handleTimeConfig(hours)}
                disabled={timeLoading}
                className={`px-6 py-3 rounded-lg border-2 font-medium transition-all duration-200 ${
                  currentWaitTime === hours
                    ? 'border-blue-500 bg-blue-500 text-white shadow-md'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                } ${timeLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
              >
                {timeLoading && currentWaitTime === hours ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </div>
                ) : (
                  `${hours} horas`
                )}
              </button>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>💡 Dica:</strong> Todas as novas reservas usarão automaticamente este tempo padrão.
              {currentWaitTime === 6 && " (Recomendado para produtos de alta rotatividade)"}
              {currentWaitTime === 8 && " (Tempo padrão ideal para a maioria dos produtos)"}
              {currentWaitTime === 12 && " (Bom para produtos de valor médio)"}
              {currentWaitTime === 24 && " (Ideal para produtos de alto valor ou final de semana)"}
            </p>
          </div>
        </div>
      )}

      {/* ✅ SEÇÃO: Promoções em Destaque */}
      {stats.activePromotions > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">🔥 Suas Promoções Ativas</h2>
              <p className="text-gray-600 mt-1">
                Você tem {stats.activePromotions} promoção{stats.activePromotions !== 1 ? 'es' : ''} ativa{stats.activePromotions !== 1 ? 's' : ''} no momento
              </p>
            </div>
            <button
              onClick={() => navigate("/loja/promocoes")}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200"
            >
              Gerenciar Todas
            </button>
          </div>

          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-red-500 text-xl mr-3">🔥</div>
              <div>
                <p className="text-red-800 font-medium">Suas promoções estão ativas!</p>
                <p className="text-red-700 text-sm">
                  Os clientes estão recebendo notificações sobre seus produtos em promoção.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ SEÇÃO: Ações Rápidas para Promoções */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🚀 Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate("/loja/promocoes/nova")}
            className="p-4 border-2 border-dashed border-red-300 rounded-lg text-center hover:border-red-400 hover:bg-red-50 transition-colors"
          >
            <div className="text-red-500 text-2xl mb-2">➕</div>
            <h3 className="font-medium text-red-700">Nova Promoção</h3>
            <p className="text-sm text-red-600 mt-1">Criar promoção com desconto</p>
          </button>

          <button
            onClick={() => navigate("/loja/produtos")}
            className="p-4 border-2 border-dashed border-blue-300 rounded-lg text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <div className="text-blue-500 text-2xl mb-2">📦</div>
            <h3 className="font-medium text-blue-700">Ver Produtos</h3>
            <p className="text-sm text-blue-600 mt-1">Selecionar produtos para promoção</p>
          </button>

          <button
            onClick={() => navigate("/loja/categorias")}
            className="p-4 border-2 border-dashed border-green-300 rounded-lg text-center hover:border-green-400 hover:bg-green-50 transition-colors"
          >
            <div className="text-green-500 text-2xl mb-2">📊</div>
            <h3 className="font-medium text-green-700">Estatísticas</h3>
            <p className="text-sm text-green-600 mt-1">Ver desempenho das promoções</p>
          </button>
        </div>
      </div>

      {/* Reservas Recentes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Reservas Recentes</h2>
        </div>
        <div className="p-6">
          <p className="text-gray-600 text-center py-8">
            {stats.activeReservations === 0
              ? "Nenhuma reserva ativa no momento"
              : `${stats.activeReservations} reserva(s) ativa(s) - `}
            <button
              onClick={() => navigate("/loja/reservas")}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Ver todas as reservas
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
