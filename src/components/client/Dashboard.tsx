import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReservation } from "../../context/ReservationContext";
import { useSettings } from "../../context/SettingsContext";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../services/supabase";
import { checkCameraAvailability } from "../../utils/cameraDetection";
import ReservationTimer from "./ReservationTimer";

export default function ClientDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeReservations, setActiveReservations] = useState<any[]>([]);
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);

  const { signOut, user } = useAuth();
  const { theme } = useSettings();
  const { selectedEmployee } = useReservation();
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        // ✅ Verificar reservas ativas
        if (user) {
          const { data: reservations } = await supabase
            .from('reservas')
            .select(`
              id,
              fim_reserva,
              status,
              produtos:produto_id(nome)
            `)
            .eq('usuario_id', user.id)
            .in('status', ['reservado', 'pendente', 'confirmado'])
            .order('created_at', { ascending: false });

          console.log('📦 Reservas no dashboard:', reservations);
          setActiveReservations(reservations || []);
        }

        // Verificar disponibilidade da câmera
        const hasCamera = await checkCameraAvailability();
        setCameraAvailable(hasCamera);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  const handleQRScanner = async () => {
    if (cameraAvailable === false) {
      navigate("/cliente/qr-scanner?method=upload");
    } else {
      navigate("/cliente/qr-scanner");
    }
  };

  // ✅ Função para botões de ação (estilo original)
  const getActionButtonClass = () => {
    return `w-full px-4 py-2 rounded text-sm transition ${
      theme === "dark"
        ? "bg-yellow-600 hover:bg-yellow-700 text-white"
        : "bg-yellow-500 hover:bg-yellow-600 text-white"
    }`;
  };

  // ✅ Função para botões de perigo (estilo original)
  const getDangerButtonClass = () => {
    return `px-4 py-2 rounded-md text-sm font-medium transition ${
      theme === "dark"
        ? "bg-red-700 hover:bg-red-800 text-white"
        : "bg-red-600 hover:bg-red-700 text-white"
    }`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gradient-to-br from-purple-500 to-indigo-600"} text-white`}>
      {/* Header */}
      <header className={`${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white/10 backdrop-blur-sm border-white/20"} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">🛒 Loja-Conect</h1>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm">Olá, {user?.nome || user?.email}</span>

              {/* ✅ Botão Sair Padronizado */}
              <button
                onClick={signOut}
                className={getDangerButtonClass()}
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Bem-vindo ao App Cliente</h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Escaneie QR Codes, reserve produtos e receba notificações personalizadas.
          </p>
        </div>

        {/* Grid de Funcionalidades - REORGANIZADO PROFISSIONALMENTE */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. SCANNER QR CODE (PRIMEIRO - COMO SOLICITADO) */}
          <div
            className={`
              rounded-xl p-6 shadow-lg hover:shadow-2xl transition cursor-pointer transform hover:scale-105
              ${theme === "dark"
                ? "bg-gray-800 border border-gray-700 hover:bg-gray-750"
                : "bg-white text-gray-900"
              }
            `}
            onClick={handleQRScanner}
          >
            <div className="text-4xl mb-4">📱</div>
            <h2 className="text-2xl font-semibold mb-2">Escanear QR Code</h2>
            <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
              Escaneie o QR Code da loja para acessar produtos e fazer reservas.
            </p>
            <div className={`mt-2 text-xs font-medium ${
              theme === "dark" ? "text-blue-400" : "text-blue-600"
            }`}>
              {cameraAvailable === false ? (
                <span className={theme === "dark" ? "text-orange-400" : "text-orange-600"}>
                  📷 Câmera não encontrada • Use Upload
                </span>
              ) : (
                <span>📷 Camera ou Upload de imagem →</span>
              )}
            </div>
          </div>

          {/* 2. RESERVAR PRODUTOS (SEGUNDO - FLUXO LÓGICO APÓS SCAN) */}
          <div
            className={`
              rounded-xl p-6 shadow-lg hover:shadow-2xl transition cursor-pointer transform hover:scale-105
              ${theme === "dark"
                ? "bg-gray-800 border border-gray-700 hover:bg-gray-750"
                : "bg-white text-gray-900"
              }
            `}
            onClick={() => {
              const storeId = localStorage.getItem('storeId');
              if (storeId) {
                navigate('/cliente/produtos');
              } else {
                alert('Escaneie o QR Code de uma loja primeiro!');
                navigate('/cliente/qr-scanner');
              }
            }}
          >
            <div className="text-4xl mb-4">🛍️</div>
            <h2 className="text-2xl font-semibold mb-2">Reservar Produtos</h2>
            <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
              Escolha produtos e reserve com funcionários da loja.
            </p>
          </div>

          {/* 3. MINHAS RESERVAS (TERCEIRO - GERENCIAMENTO DAS RESERVAS) */}
          <div
            className={`
              rounded-xl p-6 shadow-lg hover:shadow-2xl transition cursor-pointer transform hover:scale-105
              ${theme === "dark"
                ? "bg-gray-800 border border-gray-700 hover:bg-gray-750"
                : "bg-white text-gray-900"
              }
            `}
            onClick={() => navigate('/cliente/reservas')}
          >
            <div className="text-4xl mb-4">📋</div>
            <h2 className="text-2xl font-semibold mb-2">Minhas Reservas</h2>
            <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
              Acompanhe e gerencie suas reservas ativas
            </p>
            {activeReservations.length > 0 && (
              <div className={`mt-2 text-xs font-medium ${
                theme === "dark" ? "text-blue-400" : "text-blue-600"
              }`}>
                {activeReservations.length} reserva(s) ativa(s) →
              </div>
            )}
          </div>

          {/* 4. FUNCIONÁRIOS (QUARTO - ESCOLHA DO ATENDENTE) */}
          <div
            className={`
              rounded-xl p-6 shadow-lg hover:shadow-2xl transition cursor-pointer transform hover:scale-105
              ${theme === "dark"
                ? "bg-gray-800 border border-gray-700 hover:bg-gray-750"
                : "bg-white text-gray-900"
              }
            `}
            onClick={() => navigate('/cliente/funcionarios')}
          >
            <div className="text-4xl mb-4">👥</div>
            <h2 className="text-2xl font-semibold mb-2">Funcionários</h2>
            <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
              {selectedEmployee
                ? `Seu atendente: ${selectedEmployee.name}`
                : 'Escolha seu atendente preferido'
              }
            </p>
            {selectedEmployee && (
              <div className={`mt-2 text-xs font-medium ${
                theme === "dark" ? "text-green-400" : "text-green-600"
              }`}>
                ✅ Preferido selecionado →
              </div>
            )}
          </div>

          {/* 5. CATEGORIAS PREFERIDAS (QUINTO - PERSONALIZAÇÃO) */}
          <div
            className={`
              rounded-xl p-6 shadow-lg hover:shadow-2xl transition cursor-pointer transform hover:scale-105
              ${theme === "dark"
                ? "bg-gray-800 border border-gray-700 hover:bg-gray-750"
                : "bg-white text-gray-900"
              }
            `}
            onClick={() => navigate('/category-preferences')}
          >
            <div className="text-4xl mb-4">🎯</div>
            <h2 className="text-2xl font-semibold mb-2">Categorias Preferidas</h2>
            <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
              Escolha suas categorias preferidas para receber notificações personalizadas.
            </p>
            <div className={`mt-2 text-xs font-medium ${
              theme === "dark" ? "text-blue-400" : "text-blue-600"
            }`}>
              Personalize suas preferências →
            </div>
          </div>

          {/* 6. NOTIFICAÇÕES (SEXTO - GERENCIAMENTO) */}
          <div
            className={`
              rounded-xl p-6 shadow-lg hover:shadow-2xl transition cursor-pointer transform hover:scale-105
              ${theme === "dark"
                ? "bg-gray-800 border border-gray-700 hover:bg-gray-750"
                : "bg-white text-gray-900"
              }
            `}
            onClick={() => navigate('/notifications')}
          >
            <div className="text-4xl mb-4">🔔</div>
            <h2 className="text-2xl font-semibold mb-2">Notificações</h2>
            <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
              Escolha categorias e gerencie suas preferências de notificação.
            </p>
          </div>

          {/* 7. CONFIGURAÇÕES (SÉTIMO - CONFIGURAÇÕES GERAIS) */}
          <div
            className={`
              rounded-xl p-6 shadow-lg hover:shadow-2xl transition cursor-pointer transform hover:scale-105
              ${theme === "dark"
                ? "bg-gray-800 border border-gray-700 hover:bg-gray-750"
                : "bg-white text-gray-900"
              }
            `}
            onClick={() => navigate('/cliente/configuracoes')}
          >
            <div className="text-4xl mb-4">⚙️</div>
            <h2 className="text-2xl font-semibold mb-2">Configurações</h2>
            <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
              Personalize tema e categorias para notificações.
            </p>
            <div className={`mt-2 text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
              Acesse Configurações para ativar o Windows
            </div>
          </div>
        </div>

        {/* Reservas Ativas */}
        {activeReservations.length > 0 && (
          <div className={`rounded-xl p-6 ${
            theme === "dark"
              ? "bg-gray-800 border border-gray-700"
              : "bg-white/10 backdrop-blur-sm"
          }`}>
            <h2 className="text-2xl font-semibold mb-4">🕒 Suas Reservas Ativas</h2>
            <div className="space-y-4">
              {activeReservations.map(reservation => (
                <div key={reservation.id} className={`p-4 rounded-lg ${
                  theme === "dark" ? "bg-gray-700" : "bg-white/5"
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium">Reserva #{reservation.id.slice(-6)}</p>
                      <p className="text-sm opacity-80">
                        {reservation.produtos?.nome || 'Produto'}
                      </p>
                      <p className="text-xs opacity-60 mt-1">
                        Status: {reservation.status}
                      </p>
                    </div>
                    <ReservationTimer
                      reservaId={reservation.id}
                      fimReserva={reservation.fim_reserva}
                      produtoNome={reservation.produtos?.nome || 'Produto'}
                      showActions={false}
                    />
                  </div>
                  {/* ✅ Botão Ver Detalhes Padronizado */}
                  <button
                    onClick={() => navigate('/cliente/reservas')}
                    className={getActionButtonClass()}
                  >
                    Ver Detalhes e Gerenciar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seção Informativa */}
        <div className={`rounded-xl p-6 mt-8 ${
          theme === "dark"
            ? "bg-gray-800 border border-gray-700"
            : "bg-white/10 backdrop-blur-sm"
        }`}>
          <h2 className="text-2xl font-semibold mb-4 text-center">🎯 Como Funciona?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-4">
              <div className="text-3xl mb-2">📱</div>
              <h3 className="font-semibold mb-2">1. Escaneie o QR Code</h3>
              <p className="text-sm opacity-80">Aponte a câmera para o QR Code da loja ou faça upload da imagem</p>
            </div>
            <div className="p-4">
              <div className="text-3xl mb-2">🛍️</div>
              <h3 className="font-semibold mb-2">2. Reserve Produtos</h3>
              <p className="text-sm opacity-80">Escolha produtos e faça reservas com funcionários</p>
            </div>
            <div className="p-4">
              <div className="text-3xl mb-2">🔔</div>
              <h3 className="font-semibold mb-2">3. Receba Notificações</h3>
              <p className="text-sm opacity-80">Acompanhe suas reservas e novidades</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
