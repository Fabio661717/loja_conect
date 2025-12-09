// src/components/auth/LoginForm.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface LoginFormProps {
  type: 'cliente' | 'loja';
  title: string;
}

export default function LoginForm({ type, title }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isStore = type === 'loja';
      const { user, needsStoreSignup } = await signIn(email, password, isStore);

      if (!user) throw new Error("Usuário não encontrado.");

      if (isStore && needsStoreSignup) {
        navigate("/cadastro-lojista");
        return;
      }

      // Redirecionar baseado no tipo
      if (type === 'cliente') {
        navigate("/cliente");
      } else {
        navigate("/loja");
      }
    } catch (err) {
      if (err instanceof Error) alert(err.message);
      else alert("Erro ao tentar login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow space-y-6">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          {title}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center mt-4">
          Não tem conta?{" "}
          <button
            className="text-indigo-600 font-medium hover:text-indigo-800"
            onClick={() => navigate(type === 'cliente' ? "/cadastro-cliente" : "/cadastro-lojista")}
          >
            Cadastre-se
          </button>
        </p>

        <button
          onClick={() => navigate("/")}
          className="w-full text-gray-600 hover:text-gray-800 text-sm"
        >
          ← Voltar à seleção
        </button>
      </div>
    </div>
  );
}
