// NotificationsPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../context/NotificationContext";
import { useSettings } from "../../context/SettingsContext";
import { useAuth } from "../../hooks/useAuth";
import SettingsModal from "./SettingsModal";

export default function NotificationsPage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { theme } = useSettings();
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    userNotifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    fetchUserNotifications,
    categories,
    userPreferences
  } = useNotification();

  useEffect(() => {
    if (user) {
      fetchUserNotifications();
    }
  }, [user, fetchUserNotifications]);

  const handleNotificationClick = async (notification: any) => {
    // Marcar como lida se não estiver lida
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navegar baseado no tipo/categoria
    if (notification.category === 'promocoes' || notification.type === 'promocao') {
      navigate('/cliente/produtos?promocoes=true');
    } else if (notification.category === 'novos_produtos' || notification.type === 'novo_produto') {
      navigate('/cliente/produtos?novos=true');
    } else if (notification.category === 'reservas' || notification.type === 'reserva') {
      navigate('/cliente/reservas');
    } else {
      navigate('/cliente/produtos');
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const getNotificationIcon = (category: string, type?: string) => {
    if (type === 'promocao') return '💰';
    if (type === 'novo_produto') return '🆕';
    if (type === 'reserva') return '⏰';

    const icons: { [key: string]: string } = {
      'promocoes': '💰',
      'novos_produtos': '🆕',
      'reservas': '⏰',
      'estoque': '📦'
    };
    return icons[category] || '🔔';
  };

  const getNotificationTitle = (notification: any) => {
    if (notification.title) return notification.title;

    const titles: { [key: string]: string } = {
      'promocoes': '🎉 Promoção Especial',
      'novos_produtos': '🆕 Novo Produto',
      'reservas': '⏰ Alerta de Reserva',
      'estoque': '📦 Atualização de Estoque'
    };
    return titles[notification.category] || '🔔 Nova Notificação';
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando notificações...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Header */}
      <header className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} shadow-sm border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/cliente")}
                className={`p-2 rounded-lg ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              >
                ← Voltar
              </button>
              <div>
                <h1 className="text-xl font-bold">Notificações</h1>
                <p className="text-sm opacity-70">
                  {unreadCount > 0
                    ? `${unreadCount} não lida${unreadCount !== 1 ? 's' : ''}`
                    : 'Todas lidas'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Marcar todas como lidas
                </button>
              )}

              <button
                onClick={() => setIsSettingsOpen(true)}
                className={`p-2 rounded-lg ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                title="Configurações de Notificação"
              >
                ⚙️ Configurações
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications List */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Categorias Ativas */}
        {userPreferences.filter(pref => pref.is_enabled).length > 0 && (
          <div className={`
            p-4 rounded-lg mb-6
            ${theme === "dark"
              ? "bg-green-900 border border-green-700"
              : "bg-green-50 border border-green-200"
            }
          `}>
            <h3 className="font-semibold mb-2">✅ Notificações Ativas</h3>
            <div className="flex flex-wrap gap-2">
              {userPreferences
                .filter(pref => pref.is_enabled && pref.category)
                .map(pref => (
                  <span
                    key={pref.category_id}
                    className={`
                      px-3 py-1 rounded-full text-sm flex items-center gap-2
                      ${theme === "dark"
                        ? "bg-green-800 text-green-200"
                        : "bg-green-100 text-green-800"
                      }
                    `}
                  >
                    {getNotificationIcon(pref.category!.name)}
                    {pref.category!.name.charAt(0).toUpperCase() + pref.category!.name.slice(1)}
                  </span>
                ))}
            </div>
            <p className="text-sm mt-2 opacity-70">
              Você receberá alertas para as categorias selecionadas.
            </p>
          </div>
        )}

        {userNotifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold mb-2">Nenhuma notificação</h3>
            <p className="text-gray-500 mb-6">
              Quando você tiver notificações, elas aparecerão aqui.
            </p>
            {userPreferences.filter(pref => pref.is_enabled).length === 0 && (
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                ⚙️ Configurar Notificações
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {userNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`
                  rounded-lg p-4 cursor-pointer transition-all border
                  ${notification.is_read
                    ? theme === "dark"
                      ? "bg-gray-800 border-gray-700 hover:bg-gray-750"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                    : theme === "dark"
                      ? "bg-blue-900 border-blue-700 hover:bg-blue-800"
                      : "bg-blue-50 border-blue-200 hover:bg-blue-100"
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl mt-1">
{getNotificationIcon(notification.category?.name || '', notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-semibold ${notification.is_read ? '' : 'text-blue-600'}`}>
                        {getNotificationTitle(notification)}
                      </h3>
                      <span className="text-sm opacity-70">
                        {new Date(notification.created_at).toLocaleDateString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className={`
                      text-sm
                      ${theme === "dark" ? "text-gray-300" : "text-gray-600"}
                    `}>
                      {notification.message}
                    </p>
                    {!notification.is_read && (
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                          NOVA
                        </span>
                        <span className="text-xs opacity-70">Clique para ver</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dicas */}
        <div className={`
          mt-8 p-4 rounded-lg
          ${theme === "dark"
            ? "bg-gray-800 border border-gray-700"
            : "bg-gray-100 border border-gray-200"
          }
        `}>
          <h3 className="font-semibold mb-2">💡 Dicas de Notificações</h3>
          <ul className="text-sm space-y-1 opacity-70">
            <li>• <strong>Reservas:</strong> Alertas quando reservas estiverem perto de vencer</li>
            <li>• <strong>Promoções:</strong> Ofertas exclusivas em categorias favoritas</li>
            <li>• <strong>Novos Produtos:</strong> Saiba quando novos produtos chegam</li>
            <li>• <strong>Estoque:</strong> Produtos que voltaram a ficar disponíveis</li>
            <li>• Configure suas preferências no botão ⚙️ acima</li>
          </ul>
        </div>
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
