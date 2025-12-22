// src/pages/HomeSelection.tsx
import { useNavigate } from "react-router-dom";

export default function HomeSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center max-w-4xl w-full">
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">🏪 Loja-Conect</h1>
          <p className="text-xl text-gray-600">Sistema completo para clientes e lojistas</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Card Cliente - Agora redireciona para login */}
          <button
            onClick={() => navigate("/login-cliente")}
            className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-transparent hover:border-blue-500"
          >
            <div className="text-5xl mb-6">🛒</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Área do Cliente</h2>
            <p className="text-gray-600 mb-4">Visualize produtos, faça reservas e receba notificações</p>
            <div className="text-sm text-blue-600 font-medium">Acessar como Cliente →</div>
          </button>

          {/* Card Loja - Agora redireciona para login */}
          <button
            onClick={() => navigate("/login-loja")}
            className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-transparent hover:border-green-500"
          >
            <div className="text-5xl mb-6">📊</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Painel da Loja</h2>
            <p className="text-gray-600 mb-4">Gerencie produtos, pedidos e funcionários</p>
            <div className="text-sm text-green-600 font-medium">Acessar como Lojista →</div>
          </button>
        </div>

        <div className="mt-12 text-gray-500 text-sm">
          <p>Escolha como deseja acessar o sistema</p>
        </div>
      </div>
    </div>
  );
}
