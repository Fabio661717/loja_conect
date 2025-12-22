// 📄 src/App.tsx - VERSÃO CORRIGIDA E LIMPA
import { useEffect, useState } from "react";
import { Route, BrowserRouter as Router, Routes, useNavigate } from 'react-router-dom';

// 🧠 Contextos
import { AdminProvider } from "./context/AdminContext";
import { CategoryProvider } from "./context/CategoryContext";
import { ClientProvider } from "./context/ClientContext";
import { NotificationProvider } from "./context/NotificationContext";
import { NotificationProvider as NotificationProviderLtx } from "./context/NotificationContextLtx";
import { PromotionProvider } from "./context/PromotionContext";
import { ReservationProvider } from "./context/ReservationContext";
import { SettingsProvider, useSettings } from "./context/SettingsContext";
import { StoreProvider } from "./context/StoreContext";
import { ThemeProvider } from "./context/ThemeContext";

// 🧭 Hooks
import { useAuth } from "./hooks/useAuth";
import { useMobileDetection } from "./hooks/useMobileDetection";
import { usePushNotifications } from "./hooks/usePushNotifications";
import { useReservationSystem } from "./hooks/useReservationSystem";

// ✅ ATUALIZAÇÃO: Importação do serviço unificado
import { pushSubscriptionService } from './services/pushSubscription';

// ✅ ATUALIZAÇÃO: Importação do reservationMonitor
import { reservationMonitor } from './services/reservationMonitor';

// 🔐 Autenticação
import CadastroCliente from "./components/auth/CadastroCliente";
import CadastroLojista from "./components/auth/CadastroLojista";
import LoginCliente from "./components/auth/LoginCliente";
import LoginForm from "./components/auth/LoginForm";
import LoginLojista from "./components/auth/LoginLojista";

// 👥 Área do cliente
import ClientEmployeesList from "./components/client/ClientEmployeesList";
import Dashboard from "./components/client/Dashboard";
import Header from "./components/client/Header";
import MyReservations from "./components/client/MyReservations";
import ProductsList from "./components/client/ProductsList";
import ProdutosCliente from "./components/client/ProdutosCliente";
import PromotionList from "./components/client/PromotionList";
import SettingsModal from "./components/client/SettingsModal";
import QRScanner from "./components/QRScanner/QRScanner";

// 🏪 Área da loja
import StoreLayout from "./components/layout/StoreLayout";
import CategoryManager from "./components/store/CategoryManager";
import DashboardLoja from "./components/store/Dashboard";
import EmployeesList from "./components/store/EmployeesList";
import ProductForm from "./components/store/ProductForm";
import ProductList from "./components/store/ProductList";
import PromotionForm from "./components/store/PromotionForm";
import PromotionManager from "./components/store/PromotionManager";
import ReservationsList from "./components/store/ReservationsList";
import Timer from "./components/store/Timer";
import QRCodeGenerator from "./painelLoja/Component/QRCodeGenerator";

// 🧰 Utilitários
import DebugAuth from "./components/DebugAuth";
import DebugRouter from "./components/DebugRouter";
import ProtectedRoute from "./components/ProtectedRoute";

// 📱 Componente Mobile
import MobileDashboard from "./components/MobileDashboard";

// 🆕 Componente de Notificação
import NotificationRelLtx from "./components/NotificationRelLtx";
import { PushNotificationManager } from './components/PushNotificationManager';

// ✅ NOVA IMPORTAÇÃO ADICIONADA
import { EnableNotifications } from './components/EnableNotifications';

// 🆕 Telas
import { CategoriesScreen } from "./screens/CategoriesScreen";
import { NotificationsScreen } from "./screens/NotificationsScreen";

// ✅ ATUALIZAÇÃO: Importação do CategoryPreferences unificado
import CategoryPreferences from "./components/CategoryPreferences";

// ✅ ATUALIZAÇÃO: Serviços adicionados
import { notificationService } from "./services/notificationService";
import { reservationService } from "./services/reservationService";

// 🧱 Interfaces
interface ConfiguracoesProps {
  onSettingsOpen: () => void;
}

// ------------------- ÁREA DO CLIENTE -------------------
function ClienteLayout() {
  const { loading, user } = useAuth();
  const { token, status, supported } = usePushNotifications();
  const { theme } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (token) console.log("Token do Push:", token);
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <ClientProvider>
      <div className={theme === "dark" ? "bg-gray-900 text-white min-h-screen" : "bg-white text-black min-h-screen"}>
        <Header />

        {/* ✅ COMPONENTE EnableNotifications ADICIONADO */}
        {user?.type === 'cliente' && <EnableNotifications />}

        {supported && (
          <div
            className={`p-2 text-center text-sm ${
              status === "granted"
                ? "bg-green-100 text-green-800"
                : status === "denied"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {status === "granted"
              ? "🔔 Notificações ativas"
              : status === "denied"
              ? "⚠️ Notificações desativadas"
              : "⏳ Configurando notificações..."}
          </div>
        )}

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/scanear" element={<QRScanner />} />
          <Route path="/produtos" element={<ProductsList />} />
          <Route path="/produtos-cliente" element={<ProdutosCliente />} />
          <Route path="/promocoes" element={<PromotionList />} />
          <Route path="/categorias" element={<CategoriesScreen />} />
          {/* ✅ ATUALIZAÇÃO: Substituído CategoryPreferencesScreen pelo componente unificado */}
          <Route
            path="/category-preferences"
            element={
              <CategoryPreferences
                mode="screen"
                context="cliente"
                showHeader={true}
                showBackButton={true}
              />
            }
          />
          <Route path="/funcionarios" element={<ClientEmployeesList />} />
          <Route path="/notifications" element={<NotificationsScreen />} />
          <Route path="/configuracoes" element={<Configuracoes onSettingsOpen={() => setIsSettingsOpen(true)} />} />
        </Routes>

        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </div>
    </ClientProvider>
  );
}

// ------------------- ÁREA DA LOJA -------------------
function LojaLayoutContent() {
  const { user } = useAuth();
  const { status, supported } = usePushNotifications();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const lojaId = user?.lojaId || `loja-${user?.id || "default"}`;

  return (
    <AdminProvider>
      <PromotionProvider>
        <div className="min-h-screen bg-gray-50">
          {supported && status === "granted" && (
            <div className="bg-green-100 text-green-800 p-2 text-center text-sm">
              🔔 Sistema de notificações ativo
            </div>
          )}

          <Routes>
            <Route path="/" element={<DashboardLoja />} />
            <Route path="/qrcode" element={<QRCodeGenerator storeId={lojaId} />} />
            <Route path="/dashboard" element={<DashboardLoja />} />
            <Route path="/categorias" element={<CategoryManager />} />
            <Route path="/produtos" element={<ProductList />} />
            <Route path="/produtos/novo" element={<ProductForm />} />
            <Route path="/produtos/editar/:id" element={<ProductForm />} />
            <Route path="/reservas" element={<ReservationsList lojaId={lojaId} />} />
            <Route
              path="/funcionarios"
              element={
                <EmployeesList />
              }
            />
            <Route path="/timer" element={<TimerDemo />} />
            <Route path="/promocoes" element={<PromotionManager />} />
            <Route path="/promocoes/nova" element={<PromotionForm />} />
            <Route path="/promocoes/editar/:id" element={<PromotionForm />} />
            <Route path="/configuracoes" element={<ConfiguracoesLoja onSettingsOpen={() => setIsSettingsOpen(true)} />} />
          </Routes>

          <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
      </PromotionProvider>
    </AdminProvider>
  );
}

// ------------------- COMPONENTES AUXILIARES -------------------
function TimerDemo() {
  const fimReservaDemo = Date.now() + 30 * 60 * 1000;
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Demo do Timer</h2>
      <p className="mb-4">Este é um exemplo do componente Timer em ação:</p>
      <Timer fimReserva={fimReservaDemo} />
    </div>
  );
}

function Configuracoes({ onSettingsOpen }: ConfiguracoesProps) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Configurações</h1>
      <button onClick={onSettingsOpen} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
        Abrir Configurações
      </button>
    </div>
  );
}

function ConfiguracoesLoja({ onSettingsOpen }: ConfiguracoesProps) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Configurações da Loja</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <button onClick={onSettingsOpen} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
          Abrir Configurações da Loja
        </button>
      </div>
    </div>
  );
}

function Unauthorized() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Acesso Negado</h1>
        <p className="text-gray-600 mb-8">Você não tem permissão para acessar esta página.</p>
        <button
          onClick={() => navigate("/")}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          Voltar para Home
        </button>
      </div>
    </div>
  );
}

function HomeSelection() {
  const navigate = useNavigate();
  const { status, supported } = usePushNotifications();
  const isMobile = useMobileDetection();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then(() => console.log("✅ Service Worker pronto na home"))
        .catch((error) => console.log("❌ Service Worker não disponível:", error));
    }
  }, []);

  // ✅ SE FOR MOBILE, REDIRECIONA PARA DASHBOARD MOBILE
  if (isMobile) {
    return <MobileDashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Loja Conect</h1>
        <p className="text-gray-600 text-center mb-8">Selecione seu tipo de acesso</p>

        <div className="space-y-4">
          <button
            onClick={() => navigate("/login-cliente")}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold transition duration-200 flex items-center justify-center"
          >
            <span className="mr-2">📱</span> App Cliente
          </button>

          <button
            onClick={() => navigate("/login-loja")}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-semibold transition duration-200 flex items-center justify-center"
          >
            <span className="mr-2">🏪</span> Painel da Loja
          </button>
        </div>

        <div className="mt-6 border-t pt-4">
          <p className="text-sm text-gray-600 text-center mb-4">Não tem conta?</p>
          <div className="flex space-x-2">
            <button
              onClick={() => navigate("/cadastro-cliente")}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded text-sm transition duration-200"
            >
              Cadastrar Cliente
            </button>
            <button
              onClick={() => navigate("/cadastro-lojista")}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded text-sm transition duration-200"
            >
              Cadastrar Loja
            </button>
          </div>
        </div>

        <div className="mt-6 p-3 bg-gray-100 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            {supported
              ? status === "granted"
                ? "🔔 Notificações ativas"
                : status === "denied"
                ? "⚠️ Notificações pendentes"
                : "🔄 Configurando notificações"
              : "📱 Recursos avançados disponíveis"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ------------------- CONTEÚDO PRINCIPAL -------------------
function AppContent() {
  const { user } = useAuth();
  const isMobile = useMobileDetection();

  useReservationSystem();

  // ✅ ATUALIZAÇÃO: Inicialização automática do sistema com serviço unificado
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 Inicializando app com serviço unificado...');

      try {
        // ✅ ATUALIZAÇÃO: Sincronizar tokens locais primeiro
        console.log('🔄 Sincronizando tokens locais...');
        await pushSubscriptionService.initialize();

        // ✅ ATUALIZAÇÃO: Inicializar push notifications
        console.log('🔔 Inicializando push notifications...');
        const pushInitialized = await pushSubscriptionService.initialize();
        if (pushInitialized) {
          console.log('✅ Push notifications inicializadas com sucesso');
        }

        // ✅ ATUALIZAÇÃO: Verificar status do sistema
        const systemStatus = pushSubscriptionService.getSystemStatus();
        console.log('📊 Status do sistema de push:', systemStatus);

        // ✅ INICIAR VERIFICADOR DE RESERVAS
        reservationService.startReservationChecker();

        // ✅ ATUALIZAÇÃO: INICIAR MONITORAMENTO DE RESERVAS
        console.log('🔍 Iniciando monitoramento de reservas...');
        reservationMonitor.startMonitoring();

        // ✅ SOLICITAR PERMISSÃO DE NOTIFICAÇÃO
        notificationService.requestPushPermission();

        console.log('✅ App inicializado com sucesso');
      } catch (error) {
        console.error('❌ Erro na inicialização do app:', error);
      }
    };

    initializeApp();

    return () => {
      // ✅ PARAR VERIFICADOR AO SAIR DO APP
      reservationService.stopReservationChecker();

      // ✅ ATUALIZAÇÃO: PARAR MONITORAMENTO AO SAIR DO APP
      console.log('🛑 Parando monitoramento de reservas...');
      reservationMonitor.stopMonitoring();
    };
  }, []);

  // ✅ Service Worker atualizado
  useEffect(() => {
    const initializeServiceWorker = async () => {
      if ("serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
            updateViaCache: "none",
          });
          console.log("✅ Service Worker registrado:", registration);

          await navigator.serviceWorker.ready;
          console.log("✅ Service Worker pronto para uso");
        } catch (error) {
          console.error("❌ Falha ao registrar o Service Worker:", error);
        }
      }
    };

    setTimeout(() => {
      initializeServiceWorker();
    }, 1000);
  }, []);

  // ✅ SE FOR MOBILE E NÃO ESTIVER LOGADO, USA MOBILE DASHBOARD
  if (isMobile && !user) {
    return <MobileDashboard />;
  }

  return (
    <>
      {process.env.NODE_ENV === "development" && <DebugAuth />}

      <Routes>
        <Route path="/" element={<HomeSelection />} />
        <Route path="/login-cliente" element={<LoginCliente />} />
        <Route path="/login-loja" element={<LoginLojista />} />
        <Route path="/login-form" element={<LoginForm type="cliente" title="Login Cliente" />} />
        <Route path="/cadastro-cliente" element={<CadastroCliente />} />
        <Route path="/cadastro-lojista" element={<CadastroLojista />} />
        <Route path="/notifications" element={<NotificationsScreen />} />
        <Route path="/categories" element={<CategoriesScreen />} />
        {/* ✅ ATUALIZAÇÃO: Substituído CategoryPreferencesScreen pelo componente unificado */}
        <Route
          path="/category-preferences"
          element={
            <CategoryPreferences
              mode="screen"
              context="cliente"
              showHeader={true}
              showBackButton={true}
            />
          }
        />
        <Route path="/cliente/reservas" element={<MyReservations />} />
        <Route
          path="/cliente/qr-scanner"
          element={
            <ProtectedRoute requiredType="cliente" public>
              <QRScanner />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cliente/*"
          element={
            <ProtectedRoute requiredType="cliente">
              <PromotionProvider>
                <ClienteLayout />
              </PromotionProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/loja/*"
          element={
            <ProtectedRoute requiredType="loja">
              <StoreLayout>
                <LojaLayoutContent />
              </StoreLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Routes>

      {/* ✅ ATUALIZAÇÃO ADICIONADA: Componente de Notificação RealTime */}
      <NotificationRelLtx />
    </>
  );
}

// ------------------- APP FINAL COM PROVIDERS NA ORDEM CORRETA -------------------
function App() {
  return (
    <StoreProvider>
      <SettingsProvider>
        {/* ✅ ATUALIZAÇÃO: Adicionado NotificationProviderLtx envolvendo tudo */}
        <NotificationProviderLtx>
          <NotificationProvider>
            <PushNotificationManager />
            <ThemeProvider>
              <CategoryProvider>
                <ReservationProvider>
                  <Router>
                    <DebugRouter />
                    <AppContent />
                  </Router>
                </ReservationProvider>
              </CategoryProvider>
            </ThemeProvider>
          </NotificationProvider>
        </NotificationProviderLtx>
      </SettingsProvider>
    </StoreProvider>
  );
}

export default App;
