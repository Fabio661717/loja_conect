// 📄 src/components/auth/CadastroCliente.tsx - VERSÃO CORRIGIDA
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function CadastroCliente() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ CORREÇÃO: 'false' indica que é cliente e cria apenas na tabela 'clientes'
      await signUp(email, password, { nome }, false);
      alert("Cadastro concluído! Faça login para acessar o app.");
      navigate("/login-cliente");
    } catch (err) {
      if (err instanceof Error) alert(err.message);
      else alert("Erro ao cadastrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow space-y-6">
        <h2 className="text-center text-3xl font-extrabold">Cadastro Cliente</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            required
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="input-field"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
          <input
            type="password"
            required
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>
        <p className="text-center mt-4">
          Já tem conta?{" "}
          <button
            className="text-indigo-600 font-medium"
            onClick={() => navigate("/login-cliente")}
          >
            Faça login
          </button>
        </p>
      </div>
    </div>
  );
}
