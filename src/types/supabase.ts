// src/types/supabase.ts
export interface Database {
  public: {
    Tables: {
      produtos: {
        Row: {
          id: string;
          nome: string;
          categoria?: string;
          preco?: number;
          estoque: number;
          foto_url?: string;
          descricao?: string;
          loja_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          categoria?: string;
          preco?: number;
          estoque?: number;
          foto_url?: string;
          descricao?: string;
          loja_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          categoria?: string;
          preco?: number;
          estoque?: number;
          foto_url?: string;
          descricao?: string;
          loja_id?: string;
          created_at?: string;
        };
      };
      funcionarios: {
        Row: {
          id: string;
          nome: string;
          whatsapp: string;
          foto_url?: string;
          loja_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          whatsapp: string;
          foto_url?: string;
          loja_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          whatsapp?: string;
          foto_url?: string;
          loja_id?: string;
          created_at?: string;
        };
      };
      // ✅ TABELAS ADICIONADAS PARA RESOLVER OS ERROS
      users: {
        Row: {
          id: string;
          nome: string;
          email: string;
          preferred_categories?: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          email: string;
          preferred_categories?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          email?: string;
          preferred_categories?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      clientes: {
        Row: {
          id: string;
          nome: string;
          email: string;
          preferred_categories?: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          email: string;
          preferred_categories?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          email?: string;
          preferred_categories?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      user_notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          is_enabled: boolean;
          created_at: string;
          updated_at: string;
          nome: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          is_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          is_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          preferred_categories: string[];
          created_at: string;
          updated_at: string;
          nome: string;
          preferred_categories_active: boolean;
          // ✅ CORREÇÃO: Removido o array incorreto
          users?: { id: string; nome: string; email: string }; // Agora é um objeto único
        };
        Insert: {
          id?: string;
          user_id: string;
          preferred_categories?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          preferred_categories?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      client_preferences: {
        Row: {
          id: string;
          cliente_id: string;
          preferred_categories: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cliente_id: string;
          preferred_categories?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cliente_id?: string;
          preferred_categories?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      preferencias_categorias: {
        Row: {
          id: string;
          user_id: string;
          categoria_nome: string;
          ativo: boolean;
          created_at: string;
          updated_at: string;
          nome: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          categoria_nome: string;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          categoria_nome?: string;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      notificacoes: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          category: string;
          data: any;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          category: string;
          data?: any;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string;
          category?: string;
          data?: any;
          read?: boolean;
          created_at?: string;
        };
      };
      notificacoes_cliente: {
        Row: {
          id: string;
          cliente_id: string;
          titulo: string;
          mensagem: string;
          tipo: string;
          produto_id?: string;
          loja_id: string;
          lida: boolean;
          data: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          cliente_id: string;
          titulo: string;
          mensagem: string;
          tipo: string;
          produto_id?: string;
          loja_id: string;
          lida?: boolean;
          data?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          cliente_id?: string;
          titulo?: string;
          mensagem?: string;
          tipo?: string;
          produto_id?: string;
          loja_id?: string;
          lida?: boolean;
          data?: any;
          created_at?: string;
        };
      };
      // ✅ ATUALIZAÇÃO APLICADA: Tabela push_subscriptions corrigida
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          expiration_time: string | null;
          user_agent: string | null;
          device_info: any | null;
          platform: string | null;
          created_at: string | null;
          updated_at: string | null;
          is_active: boolean | null;
          category: string | null;
          // ✅ Campo adicional para compatibilidade com código anterior
          subscription?: any;
          p256dh_key?: string;
          auth_key?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          expiration_time?: string | null;
          user_agent?: string | null;
          device_info?: any | null;
          platform?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          is_active?: boolean | null;
          category?: string | null;
          // ✅ Campos adicionais para compatibilidade
          subscription?: any;
          p256dh_key?: string;
          auth_key?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          expiration_time?: string | null;
          user_agent?: string | null;
          device_info?: any | null;
          platform?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          is_active?: boolean | null;
          category?: string | null;
          // ✅ Campos adicionais para compatibilidade
          subscription?: any;
          p256dh_key?: string;
          auth_key?: string;
        };
      };
      categorias: {
        Row: {
          id: string;
          nome: string;
          descricao?: string;
          loja_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          descricao?: string;
          loja_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          descricao?: string;
          loja_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      promocoes: {
        Row: {
          id: string;
          product_id: string;
          preco_original: number;
          preco_promocional: number;
          parcelas: number;
          categoria_id: string;
          data_inicio: string;
          data_fim: string;
          enviar_notificacao: boolean;
          loja_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          preco_original: number;
          preco_promocional: number;
          parcelas?: number;
          categoria_id: string;
          data_inicio: string;
          data_fim: string;
          enviar_notificacao?: boolean;
          loja_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          preco_original?: number;
          preco_promocional?: number;
          parcelas?: number;
          categoria_id?: string;
          data_inicio?: string;
          data_fim?: string;
          enviar_notificacao?: boolean;
          loja_id?: string;
          created_at?: string;
        };
      };
      reservas: {
        Row: {
          id: string;
          produto_id: string;
          cliente_id: string;
          quantidade: number;
          data_reserva: string;
          data_expiracao: string;
          status: string;
          loja_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          produto_id: string;
          cliente_id: string;
          quantidade?: number;
          data_reserva?: string;
          data_expiracao: string;
          status?: string;
          loja_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          produto_id?: string;
          cliente_id?: string;
          quantidade?: number;
          data_reserva?: string;
          data_expiracao?: string;
          status?: string;
          loja_id?: string;
          created_at?: string;
        };
      };
      lojas: {
        Row: {
          id: string;
          nome: string;
          descricao?: string;
          endereco?: string;
          telefone?: string;
          email?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          descricao?: string;
          endereco?: string;
          telefone?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          descricao?: string;
          endereco?: string;
          telefone?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      notification_categories: {
        Row: {
          id: string;
          name: string;
          description?: string;
          is_active: boolean;
          created_by?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          is_active?: boolean;
          created_by?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          is_active?: boolean;
          created_by?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// ✅ TIPOS AUXILIARES PARA FACILITAR O USO
export type User = Database['public']['Tables']['users']['Row'];
export type Cliente = Database['public']['Tables']['clientes']['Row'];
export type Produto = Database['public']['Tables']['produtos']['Row'];
export type Categoria = Database['public']['Tables']['categorias']['Row'];
export type Promocao = Database['public']['Tables']['promocoes']['Row'];
export type Reserva = Database['public']['Tables']['reservas']['Row'];
export type Loja = Database['public']['Tables']['lojas']['Row'];
export type Notificacao = Database['public']['Tables']['notificacoes']['Row'];
export type NotificacaoCliente = Database['public']['Tables']['notificacoes_cliente']['Row'];
export type PushSubscription = Database['public']['Tables']['push_subscriptions']['Row'];
export type UserNotificationPreference = Database['public']['Tables']['user_notification_preferences']['Row'];
export type UserPreference = Database['public']['Tables']['user_preferences']['Row'];
export type ClientPreference = Database['public']['Tables']['client_preferences']['Row'];
export type PreferenciaCategoria = Database['public']['Tables']['preferencias_categorias']['Row'];
export type NotificationCategory = Database['public']['Tables']['notification_categories']['Row'];

// ✅ INTERFACES PARA AS QUERIES COM JOINS
export interface UserWithPreferences extends User {
  user_notification_preferences?: UserNotificationPreference[];
  user_preferences?: UserPreference[];
  preferencias_categorias?: PreferenciaCategoria[];
}

export interface ClienteWithPreferences extends Cliente {
  client_preferences?: ClientPreference[];
}

export interface ProdutoWithCategoria extends Produto {
  categorias?: Categoria;
}

export interface PromocaoWithProduto extends Promocao {
  produtos?: ProdutoWithCategoria;
}

// ✅ TIPOS PARA AS RESPOSTAS DAS QUERIES
export interface UserNotificationPreferenceWithUser {
  user_id: string;
  users: {
    id: string;
    nome: string;
    email: string;
  };
}

export interface UserPreferenceWithUser {
  user_id: string;
  users: {
    id: string;
    nome: string;
    email: string;
  };
}

export interface ClientPreferenceWithCliente {
  cliente_id: string;
  clientes: {
    id: string;
    nome: string;
    email: string;
  };
}

export interface PreferenciaCategoriaWithUser {
  user_id: string;
  users: {
    id: string;
    nome: string;
    email: string;
  };
}

// ✅ TIPOS ESPECÍFICOS PARA PUSH NOTIFICATIONS
export interface PushSubscriptionWithUser extends PushSubscription {
  users?: User;
  clientes?: Cliente;
}

// ✅ TIPO PARA ENVIO DE NOTIFICAÇÕES
export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  url?: string;
  tag?: string;
  data?: {
    categoryId?: string;
    productId?: string;
    userId?: string;
    [key: string]: any;
  };
}

// ✅ TIPO PARA RESULTADO DE ENVIO DE NOTIFICAÇÃO
export interface NotificationResult {
  success: boolean;
  userId?: string;
  endpoint?: string;
  error?: string;
  code?: number;
}

// ✅ TIPO PARA PREFERÊNCIAS DE NOTIFICAÇÃO
export interface NotificationPreferences {
  user_id: string;
  preferred_categories: string[];
  notifications_enabled: boolean;
  push_notifications_enabled: boolean;
}
