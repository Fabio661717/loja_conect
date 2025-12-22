// 📄 src/components/auth/LoginCliente.tsx - VERSÃO CORRIGIDA
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function LoginCliente() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  // ✅ CORREÇÃO: Redirecionamento se já estiver logado como cliente
  useEffect(() => {
    if (user && user.type === 'cliente') {
      console.log('✅ Usuário já logado como cliente, redirecionando...');
      navigate("/cliente");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ CORREÇÃO: Não passar isStore (default é false = cliente)
      const { user } = await signIn(email, password);
      if (!user) throw new Error("Usuário não encontrado.");

      console.log('✅ Login cliente bem-sucedido, redirecionando...');
      navigate("/cliente");
    } catch (err) {
      if (err instanceof Error) alert(err.message);
      else alert("Erro ao tentar login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 mt-8">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow space-y-6">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          App Cliente
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="input-field"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="input-field"
          />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center mt-4">
          Não tem conta?{" "}
          <button
            className="text-indigo-600 font-medium"
            onClick={() => navigate("/cadastro-cliente")}
          >
            Cadastre-se
          </button>
        </p>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/login-loja')}
            className="text-green-600 hover:text-green-700 text-sm"
          >
            ↪️ Sou lojista, quero entrar no painel
          </button>
        </div>
      </div>
    </div>
  );
}
