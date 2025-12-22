// src/components/LogoutButton.tsx
import { useAuth } from "../hooks/useAuth";

const LogoutButton = () => {
  const { user, signOut } = useAuth();

  if (!user) return null; // só mostra se tiver logado

  return (
    <button
      onClick={signOut}
      className="fixed bottom-4 right-4 px-3 py-2 bg-red-500 text-white text-sm rounded-lg shadow-md hover:bg-red-600 transition"
    >
      Sair
    </button>
  );
};

export default LogoutButton;
