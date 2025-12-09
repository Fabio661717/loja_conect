// NotificationRelLtx.tsx
import React from 'react';
import { useNotification } from '../context/NotificationContextLtx';

const NotificationRelLtx: React.FC = () => {
  const { uiNotifications, removeUINotification } = useNotification();

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'info':
      default:
        return 'bg-blue-500 text-white';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
      {uiNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`relative flex items-center justify-between p-4 rounded-lg shadow-lg min-w-80 max-w-md ${getNotificationStyles(
            notification.type
          )} transition-all duration-300 transform hover:scale-105 animate-in slide-in-from-right-full`}
        >
          <span className="flex-1">{notification.message}</span>
          <button
            onClick={() => removeUINotification(notification.id)}
            className="ml-4 text-white hover:text-gray-200 transition-colors"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationRelLtx;
