// 📄 src/components/auth/LoginLojista.tsx - VERSÃO CORRIGIDA
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function LoginLojista() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  // ✅ CORREÇÃO: Redirecionamento simples sem logout automático
  useEffect(() => {
    if (user && user.type === 'loja') {
      console.log('✅ Usuário já logado como lojista, redirecionando...');
      navigate('/loja/dashboard');
    }
    // ❌ REMOVIDO: O logout automático estava causando conflitos
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Tentando login como lojista...');

      // ✅ CORREÇÃO: Passa true para isStore
      const { user: loggedUser, needsStoreSignup } = await signIn(email, password, true);

      console.log('✅ Login bem-sucedido:', loggedUser);

      if (needsStoreSignup) {
        console.log('📝 Loja não cadastrada, redirecionando para cadastro...');
        navigate('/loja/cadastro-completo');
      } else {
        console.log('🚀 Redirecionando para dashboard da loja...');
        navigate('/loja/dashboard');
      }
    } catch (err: any) {
      console.error('❌ Erro no login:', err);
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Acesso da Loja</h1>
          <p className="text-gray-600">Entre no seu painel administrativo</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Sua senha"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-semibold transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar na Loja'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Não tem conta?{' '}
            <button
              onClick={() => navigate('/cadastro-lojista')}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Cadastre sua loja
            </button>
          </p>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/login-cliente')}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            ↪️ Sou cliente, quero entrar no app
          </button>
        </div>
      </div>
    </div>
  );
}
