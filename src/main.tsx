// src/main.tsx - VERSÃO CORRIGIDA
import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/globals.css";

const RootComponent: React.FC = () => {
  useEffect(() => {
    console.log("🚀 Aplicação inicializando...");

    const timer = setTimeout(() => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        // ✅ CORREÇÃO: Importar do caminho correto
        import("./services/pushSubscription")
          .then(({ pushSubscriptionService }) => {
            console.log("🔔 Inicializando push notifications...");
            return pushSubscriptionService.initialize();
          })
          .then(success => {
            if (success) {
              console.log("✅ Push notifications inicializadas com sucesso");
            } else {
              console.warn("⚠️ Push notifications não puderam ser inicializadas");
            }
          })
          .catch((error) => {
            console.warn("⚠️ Push notifications não disponíveis:", error.message);
          });
      } else {
        console.log("ℹ️ Push notifications não suportadas neste navegador");
      }
    }, 3000); // ✅ Aumentei para 3s para dar tempo do app carregar

    return () => clearTimeout(timer);
  }, []);

  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// ✅ VERIFICAÇÃO DO TAILWIND
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Elemento root não encontrado!");
}

const root = ReactDOM.createRoot(rootElement);
root.render(<RootComponent />);

console.log("🎨 Tailwind CSS carregado");
