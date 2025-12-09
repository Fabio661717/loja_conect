//MyReservations.tsx
import { useEffect, useState } from "react";
import { useSettings } from "../../context/SettingsContext";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../services/supabase";
import ReservationTimer from "./ReservationTimer";

interface Produto {
  nome: string;
  foto_url: string;
  preco: number;
}

interface Funcionario {
  nome: string;
  whatsapp: string;
}

interface Reserva {
  id: string;
  produto_id: string;
  funcionario_id: string;
  quantidade: number;
  tamanho?: string;
  status: string;
  fim_reserva: string;
  created_at: string;
  produto?: Produto;
  funcionario?: Funcionario;
}

export default function MyReservations() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { theme } = useSettings();

  // ✅ ATUALIZADO: Função carregarReservas com melhor debug
  const carregarReservas = async () => {
    if (!user) {
      console.log('❌ Usuário não autenticado');
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Carregando reservas para usuário:', user.id);

      // CORREÇÃO: Query direta sem joins complexos
      const { data: reservasData, error: reservasError } = await supabase
        .from('reservas')
        .select('*')
        .eq('usuario_id', user.id)
        .in('status', ['reservado', 'pendente', 'confirmado'])
        .order('created_at', { ascending: false });

      if (reservasError) {
        console.error('❌ Erro ao buscar reservas:', reservasError);
        throw reservasError;
      }

      console.log('📊 Reservas brutas do banco:', reservasData);

      if (!reservasData || reservasData.length === 0) {
        console.log('ℹ️ Nenhuma reserva encontrada no banco');
        setReservas([]);
        setLoading(false);
        return;
      }

      // DEBUG: Verificar estrutura de uma reserva
      console.log('🔍 Estrutura da primeira reserva:', reservasData[0]);

      // CORREÇÃO: Buscar produtos e funcionários separadamente
      const produtoIds = reservasData.map(r => r.produto_id).filter(Boolean);
      const funcionarioIds = reservasData.map(r => r.funcionario_id).filter(Boolean);

      console.log('📦 IDs dos produtos:', produtoIds);
      console.log('👤 IDs dos funcionários:', funcionarioIds);

      // Buscar produtos
      let produtosData: any[] = [];
      if (produtoIds.length > 0) {
        const { data: produtos, error: produtosError } = await supabase
          .from('produtos')
          .select('id, nome, foto_url, preco')
          .in('id', produtoIds);

        if (produtosError) {
          console.error('❌ Erro ao buscar produtos:', produtosError);
        } else {
          produtosData = produtos || [];
          console.log('✅ Produtos encontrados:', produtosData);
        }
      }

      // Buscar funcionários
      let funcionariosData: any[] = [];
      if (funcionarioIds.length > 0) {
        const { data: funcionarios, error: funcionariosError } = await supabase
          .from('funcionarios')
          .select('id, nome, whatsapp')
          .in('id', funcionarioIds);

        if (funcionariosError) {
          console.error('❌ Erro ao buscar funcionários:', funcionariosError);
        } else {
          funcionariosData = funcionarios || [];
          console.log('✅ Funcionários encontrados:', funcionariosData);
        }
      }

      // Combinar os dados
      const reservasCompletas = reservasData.map(reserva => {
        const produto = produtosData.find(p => p.id === reserva.produto_id);
        const funcionario = funcionariosData.find(f => f.id === reserva.funcionario_id);

        console.log(`🔗 Reserva ${reserva.id}:`, {
          produto_id: reserva.produto_id,
          produto_encontrado: !!produto,
          funcionario_id: reserva.funcionario_id,
          funcionario_encontrado: !!funcionario
        });

        return {
          ...reserva,
          produto: produto ? {
            nome: produto.nome,
            foto_url: produto.foto_url,
            preco: produto.preco
          } : undefined,
          funcionario: funcionario ? {
            nome: funcionario.nome,
            whatsapp: funcionario.whatsapp
          } : undefined
        };
      });

      console.log('✅ Reservas completas processadas:', reservasCompletas);
      setReservas(reservasCompletas);

    } catch (error) {
      console.error('❌ Erro ao carregar reservas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarReservas();

    // Configurar atualização em tempo real
    const subscription = supabase
      .channel('reservas-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservas',
          filter: `usuario_id=eq.${user?.id}`
        },
        () => {
          carregarReservas();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleCancelarReserva = async (reservaId: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('reservas')
        .update({ status: 'cancelado' })
        .eq('id', reservaId);

      if (error) throw error;

      // Atualizar estoque
      const reserva = reservas.find(r => r.id === reservaId);
      if (reserva) {
        await supabase.rpc('incrementar_estoque_atomico', {
          p_produto_id: reserva.produto_id,
          p_quantidade: reserva.quantidade
        });
      }

      // Atualizar lista local
      setReservas(reservas.filter(r => r.id !== reservaId));

      alert('✅ Reserva cancelada com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao cancelar reserva:', error);
      alert('❌ Erro ao cancelar reserva');
    }
  };

  const handleReservaExpirada = (reservaId: string) => {
    setReservas(reservas.filter(r => r.id !== reservaId));
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-lg">🔄 Carregando reservas...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">📋 Minhas Reservas</h1>
          <span className={`px-3 py-1 rounded-full text-sm ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            {reservas.length} {reservas.length === 1 ? 'reserva' : 'reservas'}
          </span>
        </div>

        {/* DEBUG: Mostrar informações */}
        <div className={`mb-4 p-3 rounded text-sm ${
          theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
        }`}>
          🔍 Debug: {reservas.length} reservas encontradas | User ID: {user?.id}
        </div>

        {reservas.length === 0 ? (
          <div className={`text-center py-12 rounded-lg ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold mb-2">Nenhuma reserva ativa</h3>
            <p className={`mb-6 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Você ainda não possui reservas ativas. Escaneie um QR Code para começar!
            </p>
            <button
              onClick={() => window.location.href = '/cliente/qr-scanner'}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              📱 Escanear QR Code
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {reservas.map((reserva) => (
              <div
                key={reserva.id}
                className={`rounded-xl shadow-lg border p-6 ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Imagem do Produto */}
                  <div className="flex-shrink-0">
                    <img
                      src={reserva.produto?.foto_url || '/placeholder-product.jpg'}
                      alt={reserva.produto?.nome || 'Produto'}
                      className="w-24 h-24 lg:w-32 lg:h-32 rounded-lg object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                      }}
                    />
                  </div>

                  {/* Informações da Reserva */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">
                          {reserva.produto?.nome || 'Produto não encontrado'}
                        </h3>
                        <p className={`text-sm ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          Reserva #{reserva.id.slice(-6)} | Status: {reserva.status}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        reserva.status === 'reservado'
                          ? 'bg-green-500 text-white'
                          : reserva.status === 'pendente'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-blue-500 text-white'
                      }`}>
                        {reserva.status === 'reservado' ? '🟢 Ativa' :
                         reserva.status === 'pendente' ? '🟡 Pendente' : '🔵 Confirmada'}
                      </span>
                    </div>

                    {/* Detalhes da Reserva */}
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <div>
                        <p className="font-medium">📦 Quantidade: {reserva.quantidade}</p>
                        {reserva.tamanho && (
                          <p className="font-medium">📏 Tamanho: {reserva.tamanho}</p>
                        )}
                        <p className="font-medium">💵 Preço: R$ {reserva.produto?.preco?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <p className="font-medium">👤 Funcionário: {reserva.funcionario?.nome || 'Não atribuído'}</p>
                        {reserva.funcionario?.whatsapp && (
                          <p className="font-medium">📞 WhatsApp: {reserva.funcionario.whatsapp}</p>
                        )}
                        <p className="font-medium">
                          🕒 Criada em: {new Date(reserva.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    {/* Timer e Ações */}
                    <div className="space-y-4">
                      <ReservationTimer
                        reservaId={reserva.id}
                        fimReserva={reserva.fim_reserva}
                        produtoNome={reserva.produto?.nome || 'Produto'}
                        onExpired={() => handleReservaExpirada(reserva.id)}
                        showActions={true}
                      />

                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleCancelarReserva(reserva.id)}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                        >
                          ❌ Cancelar Reserva
                        </button>

                        {reserva.funcionario?.whatsapp && (
                          <a
                            href={`https://wa.me/55${reserva.funcionario.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors text-center"
                          >
                            💬 Falar no WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
