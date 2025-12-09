// src/routes/AppRoutes.tsx - VERSÃO CORRIGIDA COM CATEGORY PREFERENCES UNIFICADO
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import CategoryPreferences from '../components/CategoryPreferences'; // ✅ CORREÇÃO: Import do componente unificado
import { NotificationPreferences } from '../components/NotificationPreferences'; // ✅ CORREÇÃO: Import named export
import { ClienteProdutos } from '../pages/Cliente/ClienteProdutos';
import { ClientePromocoes } from '../pages/Cliente/ClientePromocoes';
import { ClienteScanear } from '../pages/Cliente/ClienteScanear';
import { DashboardScreen } from '../screens/DashboardScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Suas rotas existentes */}
      <Route path="/dashboard" element={<DashboardScreen />} />
      <Route path="/notificacoes" element={<NotificationsScreen />} />

      {/* ✅ ROTA CORRIGIDA: Usando CategoryPreferences unificado */}
      <Route
        path="/cliente/categorias-preferidas"
        element={
          <CategoryPreferences
            mode="screen"
            context="cliente"
            showHeader={true}
            showBackButton={true}
          />
        } // ✅ CORREÇÃO: Componente unificado com props
      />

      {/* ✅ CORREÇÃO: Usando named export corretamente */}
      <Route
        path="/configuracoes/notificacoes"
        element={<NotificationPreferences
          categories={[]}
          userPreferences={[]}
          onPreferenceChange={() => {}}
        />} // ✅ CORREÇÃO: Props obrigatórias fornecidas
      />

      {/* Outras rotas existentes... */}
      <Route path="/cliente/scanear" element={<ClienteScanear />} />
      <Route path="/cliente/promocoes" element={<ClientePromocoes />} />
      <Route path="/cliente/produtos" element={<ClienteProdutos />} />

      {/* Rota padrão */}
      <Route path="/" element={<DashboardScreen />} />
    </Routes>
  );
};
