// src/context/ReservationContext.tsx - VERSÃO COMPLETA COM ATUALIZAÇÃO
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { Employee } from '../types/Employee';

interface ReservationContextType {
  selectedEmployee: Employee | null;
  setSelectedEmployee: (employee: Employee) => void;
  clearSelectedEmployee: () => void;
  isFirstReservation: boolean;
  completeReservation: () => void;
  resetReservation: () => void;
  // ✅ ATUALIZAÇÃO: NOVAS FUNCIONALIDADES ADICIONADAS
  createReservation: (reservationData: any) => Promise<any>;
  getUserReservations: () => Promise<any[]>;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export function ReservationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [selectedEmployee, setSelectedEmployeeState] = useState<Employee | null>(null);
  const [isFirstReservation, setIsFirstReservation] = useState(true);

  // ✅ CARREGAR DADOS DO LOCALSTORAGE AO INICIAR
  useEffect(() => {
    const loadSavedData = () => {
      try {
        // Carregar funcionário selecionado
        const savedEmployee = localStorage.getItem('selectedEmployee');
        if (savedEmployee) {
          const employeeData = JSON.parse(savedEmployee);
          setSelectedEmployeeState(employeeData);
          console.log('✅ Funcionário carregado do localStorage:', employeeData.nome);
        }

        // Carregar status da primeira reserva
        const firstReservation = localStorage.getItem('isFirstReservation');
        if (firstReservation !== null) {
          setIsFirstReservation(JSON.parse(firstReservation));
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados do localStorage:', error);
      }
    };

    loadSavedData();
  }, []);

  // ✅ VERIFICAR SE É PRIMEIRA RESERVA NO BANCO DE DADOS
  useEffect(() => {
    const checkFirstReservationFromDB = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('reservas')
          .select('id')
          .eq('usuario_id', user.id)
          .limit(1);

        if (!error && data && data.length > 0) {
          setIsFirstReservation(false);
          localStorage.setItem('isFirstReservation', JSON.stringify(false));
        }
      } catch (error) {
        console.error('❌ Erro ao verificar primeira reserva no banco:', error);
      }
    };

    checkFirstReservationFromDB();
  }, [user]);

  // ✅ DEFINIR FUNCIONÁRIO SELECIONADO (SALVA NO LOCALSTORAGE)
  const setSelectedEmployee = (employee: Employee) => {
    try {
      setSelectedEmployeeState(employee);
      localStorage.setItem('selectedEmployee', JSON.stringify(employee));
      console.log('✅ Funcionário salvo no localStorage:', employee.nome);
    } catch (error) {
      console.error('❌ Erro ao salvar funcionário no localStorage:', error);
    }
  };

  // ✅ LIMPAR FUNCIONÁRIO SELECIONADO
  const clearSelectedEmployee = () => {
    setSelectedEmployeeState(null);
    localStorage.removeItem('selectedEmployee');
    console.log('🗑️ Funcionário removido do localStorage');
  };

  // ✅ COMPLETAR PRIMEIRA RESERVA
  const completeReservation = () => {
    setIsFirstReservation(false);
    localStorage.setItem('isFirstReservation', JSON.stringify(false));
    localStorage.setItem('user_has_reservation', 'true');
    console.log('✅ Primeira reserva completada');
  };

  // ✅ RESETAR RESERVA (para testes)
  const resetReservation = () => {
    setIsFirstReservation(true);
    setSelectedEmployeeState(null);
    localStorage.removeItem('selectedEmployee');
    localStorage.setItem('isFirstReservation', JSON.stringify(true));
    localStorage.removeItem('user_has_reservation');
    console.log('🔄 Estado da reserva resetado');
  };

  // ✅ ATUALIZAÇÃO: CRIAR RESERVA NO BANCO DE DADOS
  const createReservation = async (reservationData: any) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      const reservation = {
        ...reservationData,
        usuario_id: user.id,
        status: 'pendente',
        data_reserva: new Date().toISOString(),
        data_expiracao: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('reservas')
        .insert([reservation])
        .select()
        .single();

      if (error) throw error;

      // ✅ ENVIAR NOTIFICAÇÃO DE RESERVA
      await sendReservationNotification(data);

      // ✅ ATUALIZAR ESTADO DA PRIMEIRA RESERVA
      completeReservation();

      return data;
    } catch (error) {
      console.error('❌ Erro ao criar reserva:', error);
      throw error;
    }
  };

  // ✅ ATUALIZAÇÃO: ENVIAR NOTIFICAÇÃO DE RESERVA
  const sendReservationNotification = async (reservation: any) => {
    try {
      const notification = {
        user_id: user?.id,
        type: 'reserva' as const,
        title: '✅ Reserva Confirmada!',
        message: `Sua reserva do produto foi realizada com sucesso! Código: RES${reservation.id.slice(-6)}`,
        category: 'reservas',
        data: {
          reservation_id: reservation.id,
          product_name: reservation.product_name,
          employee_name: reservation.funcionario_nome,
          expiration: reservation.data_expiracao
        },
        read: false,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('notificacoes')
        .insert([notification]);

      if (!error) {
        console.log('✅ Notificação de reserva enviada');
      }
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de reserva:', error);
    }
  };

  // ✅ ATUALIZAÇÃO: BUSCAR RESERVAS DO USUÁRIO
  const getUserReservations = async (): Promise<any[]> => {
    try {
      if (!user) return [];

      const { data, error } = await supabase
        .from('reservas')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar reservas:', error);
      return [];
    }
  };

  const value: ReservationContextType = {
    selectedEmployee,
    setSelectedEmployee,
    clearSelectedEmployee,
    isFirstReservation,
    completeReservation,
    resetReservation,
    // ✅ ATUALIZAÇÃO: NOVAS FUNCIONALIDADES ADICIONADAS
    createReservation,
    getUserReservations
  };

  return (
    <ReservationContext.Provider value={value}>
      {children}
    </ReservationContext.Provider>
  );
}

export function useReservation() {
  const context = useContext(ReservationContext);
  if (context === undefined) {
    throw new Error('useReservation must be used within a ReservationProvider');
  }
  return context;
}
