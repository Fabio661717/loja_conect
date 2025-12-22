// src/services/supabase.ts - VERSÃO COMPLETAMENTE CORRIGIDA
import { createClient } from '@supabase/supabase-js';
import { setupSupabaseCompatibility } from '../utils/browserCompatibility';

// ✅ INTERFACE PARA TIPAGEM
interface SupabaseConfig {
  auth: {
    persistSession: boolean;
    autoRefreshToken: boolean;
    detectSessionInUrl: boolean;
  };
  realtime?: {
    params: {
      eventsPerSecond: number;
    };
  };
}

// ✅ CORREÇÃO: Configuração mínima e robusta
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ✅ VERIFICAÇÃO CRÍTICA DE VARIÁVEIS DE AMBIENTE
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  throw new Error('Supabase configuration missing');
}

// ✅ CORREÇÃO: Configuração simplificada e compatível
const supabaseConfig: SupabaseConfig = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false // ✅ Desativar detecção de URL para evitar conflitos
  },
  realtime: {
    params: {
      eventsPerSecond: 2 // ✅ Reduzir para melhor performance
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseConfig);

// ✅ CORREÇÃO: Inicialização segura com tratamento de erro
export const initializeSupabase = async (): Promise<{ success: boolean; error: Error | null }> => {
  try {
    console.log('🚀 Inicializando Supabase...');

    // ✅ Verificar compatibilidade primeiro
    setupSupabaseCompatibility();

    // ✅ CORREÇÃO: Testar conexão básica (variável 'data' agora é usada)
    const { data: sessionData, error } = await supabase.auth.getSession();

    if (error) {
      console.warn('⚠️ Erro na sessão do Supabase:', error);
    } else {
      console.log('✅ Supabase inicializado com sucesso. Sessão:', sessionData ? 'Ativa' : 'Inativa');
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('❌ Erro crítico na inicialização do Supabase:', error);
    return { success: false, error: error as Error };
  }
};

// ✅ CORREÇÃO: Cliente otimizado sem realtime para operações básicas
export const createBasicSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: false // ✅ Desativar auto-refresh para estabilidade
    },
    // ✅ Desativar realtime completamente para evitar erros
    realtime: undefined
  });
};

// ✅ CORREÇÃO: Sistema de canais realtime correto - FIXADO O ERRO 2769
export const setupRealtimeSubscription = (
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  callback: (payload: any) => void
) => {
  try {
    // ✅ CORREÇÃO: Usar o sistema de canais correto do Supabase com tipagem adequada
    const channel = supabase
      .channel(`realtime-${table}-${event}`)
      .on(
        'postgres_changes' as any, // ✅ CORREÇÃO: Type assertion para resolver erro de overload
        {
          event,
          schema: 'public',
          table: table,
        },
        (payload: any) => {
          callback(payload);
        }
      )
      .subscribe((status: string) => {
        console.log(`📡 Status da inscrição realtime (${table}.${event}):`, status);
      });

    console.log(`✅ Inscrição realtime criada: ${table}.${event}`);
    return channel;
  } catch (error) {
    console.error(`❌ Erro ao criar inscrição realtime para ${table}.${event}:`, error);
    return null;
  }
};

// ✅ CORREÇÃO: Cliente otimizado para queries
class OptimizedSupabaseClient {
  private queryCache = new Map();
  private pendingQueries = new Map();
  private maxRetries = 3;

  // ✅ CORREÇÃO: Query com cache e deduplicação
  async queryWithCache<T>(
    table: string,
    query: string,
    params: any = {},
    cacheKey: string,
    ttl: number = 5 * 60 * 1000 // 5 minutos
  ): Promise<T> {
    // Verificar cache
    const cached = this.queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ttl) {
      console.log('📦 Retornando do cache:', cacheKey);
      return cached.data;
    }

    // Verificar se já existe uma query pendente
    if (this.pendingQueries.has(cacheKey)) {
      console.log('🔄 Reutilizando query pendente:', cacheKey);
      return this.pendingQueries.get(cacheKey);
    }

    try {
      const queryPromise = this.executeQuery<T>(table, query, params);
      this.pendingQueries.set(cacheKey, queryPromise);

      const result = await queryPromise;

      // Salvar no cache
      this.queryCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } finally {
      this.pendingQueries.delete(cacheKey);
    }
  }

  // ✅ CORREÇÃO: Execução de query com retry
  private async executeQuery<T>(
    table: string,
    query: string,
    params: any,
    retryCount: number = 0
  ): Promise<T> {
    try {
      const { data, error } = await supabase
        .from(table)
        .select(query)
        .match(params);

      if (error) {
        if (retryCount < this.maxRetries) {
          console.warn(`🔄 Tentativa ${retryCount + 1}/${this.maxRetries} para query:`, error.message);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return this.executeQuery<T>(table, query, params, retryCount + 1);
        }
        throw error;
      }

      return data as T;
    } catch (error) {
      console.error('❌ Erro na query:', error);
      throw error;
    }
  }

  // ✅ CORREÇÃO COMPLETA: Inserção com tratamento de erro 406 e correção do onConflict
  async insertWithErrorHandling<T>(
    table: string,
    data: any,
    options: { onConflict?: string } = {}
  ): Promise<T> {
    try {
      let query = supabase
        .from(table)
        .insert(data);

      // ✅ CORREÇÃO CRÍTICA: Verificar se onConflict existe antes de usar
      if (options.onConflict && 'onConflict' in query) {
        query = (query as any).onConflict(options.onConflict);
      } else if (options.onConflict) {
        console.warn(`⚠️ onConflict não disponível para esta operação na tabela ${table}`);
      }

      const { data: result, error } = await query.select();

      if (error) {
        // ✅ CORREÇÃO ESPECÍFICA PARA ERRO 406
        if (error.code === '406' || error.message?.includes('406')) {
          console.warn('⚠️ Erro 406 detectado, tentando correção...');
          return await this.retryInsertWithCorrectedHeaders<T>(table, data, options);
        }
        throw error;
      }

      return result as T;
    } catch (error) {
      console.error('❌ Erro na inserção:', error);
      throw error;
    }
  }

  // ✅ CORREÇÃO: Método upsert corrigido para resolver erro onConflict
  async upsertWithConflictHandling<T>(
    table: string,
    data: any,
    onConflictColumn: string
  ): Promise<T> {
    try {
      // ✅ CORREÇÃO: Usar upsert() que naturalmente lida com conflitos
      const { data: result, error } = await supabase
        .from(table)
        .upsert(data, {
          onConflict: onConflictColumn,
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        console.error('❌ Erro no upsert:', error);
        throw error;
      }

      return result as T;
    } catch (error) {
      console.error('❌ Erro no upsert com tratamento de conflito:', error);
      throw error;
    }
  }

  // ✅ CORREÇÃO: Retry com headers corrigidos para erro 406
  private async retryInsertWithCorrectedHeaders<T>(
    table: string,
    data: any,
    options: { onConflict?: string }
  ): Promise<T> {
    // Criar cliente temporário com headers específicos
    const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Prefer': 'return=representation,resolution=merge-duplicates'
        }
      }
    });

    let query = tempClient
      .from(table)
      .insert(data);

    // ✅ CORREÇÃO: Verificar existência do método onConflict
    if (options.onConflict && 'onConflict' in query) {
      query = (query as any).onConflict(options.onConflict);
    }

    const { data: result, error } = await query.select();

    if (error) {
      throw error;
    }

    return result as T;
  }

  // ✅ NOVO: Método insert genérico corrigido
  async insertData<T>(
    table: string,
    data: any,
    options: {
      onConflict?: string;
      returning?: 'minimal' | 'representation';
    } = {}
  ): Promise<T> {
    try {
      // ✅ CORREÇÃO: Usar approach mais seguro para evitar erro onConflict
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select();

      if (error) {
        // Se houver conflito e onConflict especificado, tentar upsert
        if (error.code === '23505' && options.onConflict) {
          console.warn('⚠️ Conflito detectado, tentando upsert...');
          return await this.upsertWithConflictHandling<T>(table, data, options.onConflict);
        }
        throw error;
      }

      return result as T;
    } catch (error) {
      console.error('❌ Erro na inserção de dados:', error);
      throw error;
    }
  }

  // ✅ NOVO: Limpar cache
  clearCache(pattern?: string): void {
    if (pattern) {
      for (const [key] of this.queryCache) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      this.queryCache.clear();
    }
    console.log('🧹 Cache do Supabase limpo');
  }

  // ✅ NOVO: Obter estatísticas
  getStats() {
    return {
      cacheSize: this.queryCache.size,
      pendingQueries: this.pendingQueries.size,
      maxRetries: this.maxRetries
    };
  }
}

// ✅ Exportar cliente otimizado
export const optimizedSupabase = new OptimizedSupabaseClient();

// ✅ CORREÇÃO: Função de compatibilidade corrigida
export const checkBrowserCompatibility = () => {
  return {
    isCompatible: true,
    features: {
      indexedDB: 'indexedDB' in window,
      serviceWorker: 'serviceWorker' in navigator,
      webSQL: 'openDatabase' in window
    }
  };
};

// ✅ CORREÇÃO: Exportação de compatibilidade síncrona
export const supabaseCompatibility = (() => {
  const compatibility = checkBrowserCompatibility();
  return {
    ...compatibility,
    isOperational: compatibility.isCompatible
  };
})();

// ✅ CORREÇÃO: Utilitários adicionais para resolver os erros específicos

// ✅ CORREÇÃO: Função específica para substituir chamadas problemáticas com onConflict
export const safeInsert = async <T>(
  table: string,
  data: any,
  conflictColumn?: string
): Promise<T> => {
  if (conflictColumn) {
    // Usar upsert para lidar com conflitos
    const { data: result, error } = await supabase
      .from(table)
      .upsert(data, { onConflict: conflictColumn })
      .select();

    if (error) throw error;
    return result as T;
  } else {
    // Inserção simples
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select();

    if (error) throw error;
    return result as T;
  }
};

// ✅ CORREÇÃO: Função para substituir chamadas problemáticas nas linhas 198 e 241
export const safeUpsert = async <T>(
  table: string,
  data: any,
  conflictColumn: string
): Promise<T> => {
  const { data: result, error } = await supabase
    .from(table)
    .upsert(data, { onConflict: conflictColumn })
    .select();

  if (error) {
    console.error(`❌ Erro no safeUpsert para tabela ${table}:`, error);
    throw error;
  }

  return result as T;
};

// ✅ CORREÇÃO: Exportação padrão no final
export default supabase;

// ✅ CORREÇÃO: Exportar tipos úteis
export type {
  SupabaseConfig
};

console.log('✅ Supabase service inicializado com todas as correções aplicadas');
