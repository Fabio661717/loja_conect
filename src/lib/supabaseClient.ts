// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// =============================================
// VALIDAÇÃO DAS VARIÁVEIS DE AMBIENTE
// =============================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificação em desenvolvimento
if (import.meta.env.DEV) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ ERRO: Variáveis do Supabase não configuradas para frontend');
    console.log('🔍 Verifique seu arquivo .env:');
    console.log('   VITE_SUPABASE_URL:', supabaseUrl ? '✅ Configurado' : '❌ Faltando');
    console.log('   VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Configurado' : '❌ Faltando');

    if (supabaseAnonKey?.includes('publishable')) {
      console.log('   📝 Nota: A chave parece ser uma "publishable key" - isso está correto para o frontend');
    }

    throw new Error(
      'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env\n' +
      'Obtenha essas chaves em: Supabase Dashboard → Settings → API'
    );
  }

  // Validação básica do formato
  if (!supabaseUrl.startsWith('https://')) {
    console.warn('⚠️  Aviso: VITE_SUPABASE_URL deve começar com https://');
  }
}

// =============================================
// CLIENTE SUPABASE TIPADO
// =============================================
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'loja-conect-frontend',
      'Content-Type': 'application/json'
    }
  }
});

// =============================================
// LOG DE INICIALIZAÇÃO (APENAS DEV)
// =============================================
if (import.meta.env.DEV) {
  console.log('✅ Supabase Client TIPADO inicializado para frontend');
  console.log('   URL:', supabaseUrl);
  console.log('   Tipo de Chave:', supabaseAnonKey?.includes('publishable') ? 'Publishable Key' : 'JWT Key');

  // Teste de conexão assíncrono
  setTimeout(async () => {
    try {
      const { data, error } = await supabase.from('produtos').select('count').limit(1);
      if (error) {
        if (error.code === '42P01') {
          console.log('   Tabela produtos: ⚠️  Não encontrada (pode ser normal)');
        } else {
          console.warn('   Conexão: ⚠️  ' + error.message);
        }
      } else {
        console.log('   Conexão: ✅ Online');
      }
    } catch (err) {
      // Ignora erros no teste
    }
  }, 500);
}

// =============================================
// TIPOS PARA PUSH NOTIFICATIONS
// =============================================
export type PushSubscription = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type NotificationPayload = {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  dir?: 'auto' | 'ltr' | 'rtl';
  lang?: string;
  tag?: string;
  renotify?: boolean;
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
  vibrate?: number[];
  data?: {
    url?: string;
    categoryId?: string;
    productId?: string;
    userId?: string;
    [key: string]: any;
  };
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
};

// =============================================
// HELPER FUNCTIONS
// =============================================
export const supabaseHelpers = {
  // Verifica se o usuário está autenticado
  async checkAuth() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Erro ao verificar autenticação:', error);
        return {
          isAuthenticated: false,
          user: null,
          session: null,
          error: error.message
        };
      }

      return {
        isAuthenticated: !!session,
        user: session?.user || null,
        session: session,
        error: null
      };
    } catch (error: any) {
      console.error('Exceção ao verificar autenticação:', error);
      return {
        isAuthenticated: false,
        user: null,
        session: null,
        error: error.message
      };
    }
  },

  // Obtém o ID do usuário atual
  async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    } catch (error) {
      console.error('Erro ao obter ID do usuário:', error);
      return null;
    }
  },

  // Obtém o usuário atual completo
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Erro ao obter usuário:', error);
      return null;
    }
  },

  // Safe select com tratamento de erro e tipos
  async safeSelect<T extends keyof Database['public']['Tables']>(
    table: T,
    columns = '*' as any,
    filters: Partial<Database['public']['Tables'][T]['Row']> = {},
    options: { limit?: number; orderBy?: { column: string; ascending?: boolean } } = {}
  ) {
    try {
      let query = supabase.from(table).select(columns);

      // Aplica filtros dinamicamente
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key as any, value);
        }
      });

      // Aplica opções
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true
        });
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data as Database['public']['Tables'][T]['Row'][],
        count: count || data?.length || 0,
        error: null
      };
    } catch (error: any) {
      console.error(`Erro ao buscar de ${String(table)}:`, error);
      return {
        success: false,
        data: null,
        count: 0,
        error: error.message
      };
    }
  },

  // Método específico para push_subscriptions
  async getPushSubscriptions(userId?: string, category?: string) {
    try {
      let query = supabase
        .from('push_subscriptions')
        .select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (category) {
        query = query.eq('category', category);
      }

      query = query.eq('is_active', true);

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data as Database['public']['Tables']['push_subscriptions']['Row'][],
        error: null
      };
    } catch (error: any) {
      console.error('Erro ao buscar push subscriptions:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  },

  // Método para user_notification_preferences
  async getUserNotificationPreferences(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select(`
          *,
          notification_categories:category_id (*)
        `)
        .eq('user_id', userId)
        .eq('is_enabled', true);

      if (error) throw error;

      return {
        success: true,
        data: data as (Database['public']['Tables']['user_notification_preferences']['Row'] & {
          notification_categories: Database['public']['Tables']['notification_categories']['Row']
        })[],
        error: null
      };
    } catch (error: any) {
      console.error('Erro ao buscar preferências:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  },

  // Método para salvar push subscription
  async savePushSubscription(
    userId: string,
    subscriptionData: {
      endpoint: string;
      p256dh: string;
      auth: string;
      platform?: string;
      category?: string;
      user_agent?: string;
    }
  ) {
    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint: subscriptionData.endpoint,
          p256dh: subscriptionData.p256dh,
          auth: subscriptionData.auth,
          platform: subscriptionData.platform || 'web',
          category: subscriptionData.category || null,
          user_agent: subscriptionData.user_agent || navigator.userAgent,
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'endpoint',
          ignoreDuplicates: false
        })
        .select();

      if (error) throw error;

      return {
        success: true,
        data: data as Database['public']['Tables']['push_subscriptions']['Row'][],
        error: null
      };
    } catch (error: any) {
      console.error('Erro ao salvar subscription:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  },

  // Verificar se usuário tem subscription ativa
  async hasActivePushSubscription(userId: string, category?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.limit(1);

      if (error && error.code !== 'PGRST116') { // Ignora "nenhum resultado"
        console.error('Erro ao verificar subscription:', error);
      }

      return !!data && data.length > 0;
    } catch (error) {
      console.error('Erro ao verificar subscription:', error);
      return false;
    }
  }
};

// =============================================
// RE-EXPORT DOS TIPOS DO SEU ARQUIVO
// =============================================
export type {
  Categoria, Cliente, ClienteWithPreferences, ClientPreference, Database, PushSubscription as DBPushSubscription, Loja,
  Notificacao,
  NotificacaoCliente, NotificationCategory, NotificationPreferences, PreferenciaCategoria, Produto, ProdutoWithCategoria, Promocao, PromocaoWithProduto,
  PushSubscriptionWithUser, Reserva, User, UserNotificationPreference,
  UserPreference, UserWithPreferences
} from '../types/supabase';

// Alias para evitar conflito de nomes
export type DBNotificationPayload = import('../types/supabase').NotificationPayload;
export type DBNotificationResult = import('../types/supabase').NotificationResult;

// =============================================
// EXPORT DEFAULT
// =============================================
export default supabase;
