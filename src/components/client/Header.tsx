// Header.tsx
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../hooks/useAuth";
import { useConfiguracoesCliente } from "../../hooks/useConfiguracoesCliente";
import UserMenu from "../../hooks/UserMenu"; // ✅ ATUALIZAÇÃO ADICIONADA

export default function Header() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { configuracoes } = useConfiguracoesCliente();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className={`shadow-sm border-b ${
      theme === "dark"
        ? "bg-gray-800 border-gray-700 text-white"
        : "bg-white border-gray-200 text-gray-900"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo e Navegação */}
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-bold">🛒 Loja-Conect</h1>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/cliente")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  theme === "dark"
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                🏠 Início
              </button>

              <button
                onClick={() => navigate("/cliente/produtos")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  theme === "dark"
                    ? "bg-blue-700 hover:bg-blue-600 text-white"
                    : "bg-blue-100 hover:bg-blue-200 text-blue-700"
                }`}
              >
                📦 Produtos
              </button>

              {/* ✅ ATUALIZAÇÃO: Adicionado link para Reservas */}
              <button
                onClick={() => navigate("/cliente/reservas")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  theme === "dark"
                    ? "bg-green-700 hover:bg-green-600 text-white"
                    : "bg-green-100 hover:bg-green-200 text-green-700"
                }`}
              >
                ⏰ Reservas
              </button>

              {/* ✅ ATUALIZAÇÃO: Adicionado link para Promoções */}
              <button
                onClick={() => navigate("/cliente/promocoes")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  theme === "dark"
                    ? "bg-purple-700 hover:bg-purple-600 text-white"
                    : "bg-purple-100 hover:bg-purple-200 text-purple-700"
                }`}
              >
                💰 Promoções
              </button>
            </div>
          </div>

          {/* Controles do Usuário */}
          <div className="flex items-center space-x-4">
            {/* Botão Tema */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${
                theme === "dark"
                  ? "hover:bg-gray-700 text-yellow-300"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
              title={theme === "dark" ? "Modo Claro" : "Modo Escuro"}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            {/* ✅ ATUALIZAÇÃO: Substituído informações do usuário por UserMenu */}
            <UserMenu />

            <button
              onClick={() => navigate("/")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                theme === "dark"
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              ← Voltar à Seleção
            </button>

            <button
              onClick={handleLogout}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                theme === "dark"
                  ? "bg-red-700 hover:bg-red-600 text-white"
                  : "bg-red-100 hover:bg-red-200 text-red-700"
              }`}
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
