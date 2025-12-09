// 📄 src/hooks/useAuth.ts - VERSÃO ATUALIZADA COM VERIFICAÇÃO DE ID
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export interface User {
  id: string;
  email: string;
  nome?: string;
  type: 'cliente' | 'loja';
  role?: string;
  lojaId?: string;
}

export type SignUpData = {
  nome: string;
  [key: string]: unknown;
};

interface SignInReturn {
  user: User;
  store?: any;
  needsStoreSignup?: boolean;
}

interface SignUpReturn {
  user: User;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const supabaseUser = data.session?.user;

        if (supabaseUser) {
          const storedUser = localStorage.getItem('user');
          let userData: User;

          if (storedUser) {
            userData = JSON.parse(storedUser);
          } else {
            // ✅ CORREÇÃO: Buscar dados de forma mais segura
            const { data: lojaData } = await supabase
              .from('lojas')
              .select('id, nome')
              .eq('owner_id', supabaseUser.id)
              .maybeSingle(); // ✅ Usar maybeSingle para evitar erro se não encontrar

            if (lojaData) {
              userData = {
                id: supabaseUser.id,
                email: supabaseUser.email ?? '',
                nome: lojaData.nome,
                type: 'loja',
                lojaId: lojaData.id,
              };
            } else {
              const { data: clienteData } = await supabase
                .from('clientes')
                .select('nome')
                .eq('id', supabaseUser.id)
                .maybeSingle(); // ✅ Usar maybeSingle

              userData = {
                id: supabaseUser.id,
                email: supabaseUser.email ?? '',
                nome: clienteData?.nome,
                type: 'cliente',
              };
            }
          }

          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } catch (error) {
        console.error('❌ Erro ao carregar sessão inicial:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        const supabaseUser = session?.user;
        if (supabaseUser) {
          const storedUser = localStorage.getItem('user');
          let userData: User;

          if (storedUser) {
            userData = JSON.parse(storedUser);
            if (userData.lojaId && userData.lojaId.startsWith('loja-')) {
              userData.lojaId = userData.lojaId.replace('loja-', '');
              localStorage.setItem('user', JSON.stringify(userData));
            }
          } else {
            // ✅ CORREÇÃO: Determinar tipo baseado nas tabelas
            const { data: lojaData } = await supabase
              .from('lojas')
              .select('id')
              .eq('owner_id', supabaseUser.id)
              .maybeSingle();

            userData = {
              id: supabaseUser.id,
              email: supabaseUser.email ?? '',
              type: lojaData ? 'loja' : 'cliente',
              lojaId: lojaData?.id,
            };
          }

          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          setUser(null);
          localStorage.removeItem('user');
          localStorage.removeItem('selectedEmployee');
        }
      } catch (error) {
        console.error('❌ Erro na mudança de estado de autenticação:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, isStore = false): Promise<SignInReturn> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    const supabaseUser = data.user;
    if (!supabaseUser) throw new Error('Usuário não encontrado.');

    // ✅ CORREÇÃO: Buscar dados baseado no tipo de login
    if (isStore) {
      const { data: lojaData, error: lojaError } = await supabase
        .from('lojas')
        .select('id, nome')
        .eq('owner_id', supabaseUser.id)
        .maybeSingle();

      if (lojaError) throw new Error(lojaError.message);

      if (!lojaData) {
        // Loja não encontrada - precisa completar cadastro
        const userData: User = {
          id: supabaseUser.id,
          email: supabaseUser.email ?? '',
          type: 'loja',
        };

        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));

        return { user: userData, needsStoreSignup: true };
      }

      const userData: User = {
        id: supabaseUser.id,
        email: supabaseUser.email ?? '',
        nome: lojaData.nome,
        type: 'loja',
        lojaId: lojaData.id,
      };

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      return { user: userData, store: lojaData };
    } else {
      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .select('nome')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      if (clienteError) console.warn('Aviso ao buscar cliente:', clienteError.message);

      const userData: User = {
        id: supabaseUser.id,
        email: supabaseUser.email ?? '',
        nome: clienteData?.nome,
        type: 'cliente',
      };

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      return { user: userData };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userData: SignUpData,
    isStore = false
  ): Promise<SignUpReturn> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);

    const newUser = data.user;
    if (!newUser) throw new Error('Falha ao criar usuário.');

    // ✅ CORREÇÃO: Verificar duplicação antes de inserir
    if (isStore) {
      const { data: existingStore } = await supabase
        .from('lojas')
        .select('id')
        .eq('owner_id', newUser.id)
        .maybeSingle();

      if (!existingStore) {
        const { error: storeError } = await supabase.from('lojas').insert([
          {
            id: newUser.id,
            owner_id: newUser.id,
            owner_email: email,
            nome: userData.nome,
            wait_time: 6
          },
        ]);
        if (storeError) throw new Error(storeError.message);
      }
    } else {
      const { data: existingClient } = await supabase
        .from('clientes')
        .select('id')
        .eq('id', newUser.id)
        .maybeSingle();

      if (!existingClient) {
        const { error: clientError } = await supabase.from('clientes').insert([
          {
            id: newUser.id,
            email,
            nome: userData.nome,
            selected_employee: null
          },
        ]);
        if (clientError) throw new Error(clientError.message);
      }
    }

    const finalUser: User = {
      id: newUser.id,
      email: newUser.email ?? '',
      nome: userData.nome,
      type: isStore ? 'loja' : 'cliente',
      lojaId: isStore ? newUser.id : undefined,
    };

    setUser(finalUser);
    localStorage.setItem('user', JSON.stringify(finalUser));

    return { user: finalUser };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('selectedEmployee');
  };

  const getSelectedEmployee = async (): Promise<string | null> => {
    if (!user || user.type !== 'cliente') return null;

    const localEmployee = localStorage.getItem('selectedEmployee');
    if (localEmployee) return localEmployee;

    const { data } = await supabase
      .from('clientes')
      .select('selected_employee')
      .eq('id', user.id)
      .maybeSingle();

    const employeeId = data?.selected_employee;
    if (employeeId) {
      localStorage.setItem('selectedEmployee', employeeId);
    }

    return employeeId || null;
  };

  const setSelectedEmployee = async (employeeId: string | null) => {
    if (!user || user.type !== 'cliente') return;

    const { error } = await supabase
      .from('clientes')
      .update({ selected_employee: employeeId })
      .eq('id', user.id);

    if (error) {
      console.error('Erro ao salvar funcionário selecionado:', error.message);
      return;
    }

    if (employeeId) {
      localStorage.setItem('selectedEmployee', employeeId);
    } else {
      localStorage.removeItem('selectedEmployee');
    }
  };

  const login = (userData: User) => {
    if (userData.type === 'loja' && userData.lojaId && userData.lojaId.startsWith('loja-')) {
      userData.lojaId = userData.lojaId.replace('loja-', '');
    }

    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('selectedEmployee');
  };

  // ✅ VERIFICAÇÃO ADICIONADA: Função para debug dos IDs
  const getUserIds = () => {
    if (!user) return null;

    return {
      // ID principal do usuário (deve ser usado para autenticação)
      userId: user.id,

      // ID da loja (se for usuário do tipo loja)
      lojaId: user.lojaId,

      // Metadados do usuário (se disponíveis)
      userMetadata: user,

      // IDs do localStorage para comparação
      localStorageUserId: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : null,
      localStorageLojaId: localStorage.getItem('loja_id'),

      // Debug info
      isLoja: user.type === 'loja',
      hasLojaId: !!user.lojaId,
    };
  };

  // ✅ VERIFICAÇÃO ADICIONADA: Função para obter o ID correto para uso
  const getCorrectLojaId = (): string | null => {
    if (!user) return null;

    // Prioridade 1: lojaId do user object
    if (user.lojaId) {
      console.log('✅ Usando lojaId do user object:', user.lojaId);
      return user.lojaId;
    }

    // Prioridade 2: ID do usuário (para lojas onde loja_id = owner_id)
    if (user.type === 'loja') {
      console.log('✅ Usando user.id como lojaId:', user.id);
      return user.id;
    }

    // Prioridade 3: localStorage
    const localStorageLojaId = localStorage.getItem('loja_id');
    if (localStorageLojaId) {
      console.log('⚠️ Usando loja_id do localStorage:', localStorageLojaId);
      return localStorageLojaId;
    }

    console.log('❌ Nenhum lojaId encontrado');
    return null;
  };

  return {
    // Estado principal
    user,
    loading,

    // Ações de autenticação
    signIn,
    signUp,
    signOut,
    login,
    logout,

    // Gerenciamento de funcionários selecionados
    getSelectedEmployee,
    setSelectedEmployee,

    // ✅ VERIFICAÇÕES ADICIONADAS: Funções para debug e identificação correta
    getUserIds,
    getCorrectLojaId,

    // ✅ COMPATIBILIDADE: Retorno direto dos IDs para uso em outros hooks
    userId: user?.id,
    lojaId: user?.lojaId || (user?.type === 'loja' ? user.id : null),
  };
}
