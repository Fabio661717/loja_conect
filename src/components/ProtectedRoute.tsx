// 📄 src/components/ProtectedRoute.tsx - VERSÃO ATUALIZADA
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredType: 'cliente' | 'loja';
  public?: boolean; // Para rotas que podem ser acessadas sem autenticação
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredType,
  public: isPublic = false
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Se a rota é pública, permite acesso
  if (isPublic) {
    return <>{children}</>;
  }

  // Se não está autenticado, redireciona para login
  if (!user) {
    const loginPath = requiredType === 'cliente' ? '/login-cliente' : '/login-loja';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // Verifica se o tipo de usuário corresponde
  if (user.type !== requiredType) {
    console.warn(`Acesso negado: usuário ${user.type} tentando acessar área ${requiredType}`);
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
