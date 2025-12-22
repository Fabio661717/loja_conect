// src/types/supabase.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      produtos: {
        Row: {
          id: string
          nome: string
          categoria?: string
          preco?: number
          estoque: number
          foto_url?: string
          descricao?: string
          loja_id: string
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          categoria?: string
          preco?: number
          estoque?: number
          foto_url?: string
          descricao?: string
          loja_id: string
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          categoria?: string
          preco?: number
          estoque?: number
          foto_url?: string
          descricao?: string
          loja_id?: string
          created_at?: string
        }
      }
      funcionarios: {
        Row: {
          id: string
          nome: string
          whatsapp: string
          foto_url?: string
          loja_id: string
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          whatsapp: string
          foto_url?: string
          loja_id: string
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          whatsapp?: string
          foto_url?: string
          loja_id?: string
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          nome: string
          email: string
          preferred_categories?: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          email: string
          preferred_categories?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          preferred_categories?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      clientes: {
        Row: {
          id: string
          nome: string
          email: string
          preferred_categories?: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          email: string
          preferred_categories?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          preferred_categories?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      user_notification_preferences: {
        Row: {
          id: string
          user_id: string
          category_id: string
          is_enabled: boolean
          created_at: string
          updated_at: string
          nome: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          preferred_categories: string[]
          created_at: string
          updated_at: string
          nome: string
          preferred_categories_active: boolean
          users?: { id: string; nome: string; email: string }
        }
        Insert: {
          id?: string
          user_id: string
          preferred_categories?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          preferred_categories?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      client_preferences: {
        Row: {
          id: string
          cliente_id: string
          preferred_categories: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cliente_id: string
          preferred_categories?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cliente_id?: string
          preferred_categories?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      preferencias_categorias: {
        Row: {
          id: string
          user_id: string
          categoria_nome: string
          ativo: boolean
          created_at: string
          updated_at: string
          nome: string
        }
        Insert: {
          id?: string
          user_id: string
          categoria_nome: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          categoria_nome?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      notificacoes: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          category: string
          data: Json
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          category: string
          data?: Json
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          category?: string
          data?: Json
          read?: boolean
          created_at?: string
        }
      }
      notificacoes_cliente: {
        Row: {
          id: string
          cliente_id: string
          titulo: string
          mensagem: string
          tipo: string
          produto_id?: string
          loja_id: string
          lida: boolean
          data: Json
          created_at: string
        }
        Insert: {
          id?: string
          cliente_id: string
          titulo: string
          mensagem: string
          tipo: string
          produto_id?: string
          loja_id: string
          lida?: boolean
          data?: Json
          created_at?: string
        }
        Update: {
          id?: string
          cliente_id?: string
          titulo?: string
          mensagem?: string
          tipo?: string
          produto_id?: string
          loja_id?: string
          lida?: boolean
          data?: Json
          created_at?: string
        }
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          expiration_time: string | null
          user_agent: string | null
          device_info: Json | null
          platform: string | null
          created_at: string
          updated_at: string
          is_active: boolean
          category: string | null
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          expiration_time?: string | null
          user_agent?: string | null
          device_info?: Json | null
          platform?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
          category?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          expiration_time?: string | null
          user_agent?: string | null
          device_info?: Json | null
          platform?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
          category?: string | null
        }
      }
      categorias: {
        Row: {
          id: string
          nome: string
          descricao?: string
          loja_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string
          loja_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string
          loja_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      promocoes: {
        Row: {
          id: string
          product_id: string
          preco_original: number
          preco_promocional: number
          parcelas: number
          categoria_id: string
          data_inicio: string
          data_fim: string
          enviar_notificacao: boolean
          loja_id: string
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          preco_original: number
          preco_promocional: number
          parcelas?: number
          categoria_id: string
          data_inicio: string
          data_fim: string
          enviar_notificacao?: boolean
          loja_id: string
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          preco_original?: number
          preco_promocional?: number
          parcelas?: number
          categoria_id?: string
          data_inicio?: string
          data_fim?: string
          enviar_notificacao?: boolean
          loja_id?: string
          created_at?: string
        }
      }
      reservas: {
        Row: {
          id: string
          produto_id: string
          cliente_id: string
          quantidade: number
          data_reserva: string
          data_expiracao: string
          status: string
          loja_id: string
          created_at: string
        }
        Insert: {
          id?: string
          produto_id: string
          cliente_id: string
          quantidade?: number
          data_reserva?: string
          data_expiracao: string
          status?: string
          loja_id: string
          created_at?: string
        }
        Update: {
          id?: string
          produto_id?: string
          cliente_id?: string
          quantidade?: number
          data_reserva?: string
          data_expiracao?: string
          status?: string
          loja_id?: string
          created_at?: string
        }
      }
      lojas: {
        Row: {
          id: string
          nome: string
          descricao?: string
          endereco?: string
          telefone?: string
          email?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string
          endereco?: string
          telefone?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string
          endereco?: string
          telefone?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      notification_categories: {
        Row: {
          id: string
          name: string
          description?: string
          is_active: boolean
          created_by?: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          is_active?: boolean
          created_by?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          is_active?: boolean
          created_by?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Tipos auxiliares para facilitar o uso
export type Produto = Database['public']['Tables']['produtos']['Row']
export type Funcionario = Database['public']['Tables']['funcionarios']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Cliente = Database['public']['Tables']['clientes']['Row']
export type UserNotificationPreference = Database['public']['Tables']['user_notification_preferences']['Row']
export type UserPreference = Database['public']['Tables']['user_preferences']['Row']
export type ClientPreference = Database['public']['Tables']['client_preferences']['Row']
export type PreferenciaCategoria = Database['public']['Tables']['preferencias_categorias']['Row']
export type Notificacao = Database['public']['Tables']['notificacoes']['Row']
export type NotificacaoCliente = Database['public']['Tables']['notificacoes_cliente']['Row']
export type PushSubscription = Database['public']['Tables']['push_subscriptions']['Row']
export type Categoria = Database['public']['Tables']['categorias']['Row']
export type Promocao = Database['public']['Tables']['promocoes']['Row']
export type Reserva = Database['public']['Tables']['reservas']['Row']
export type Loja = Database['public']['Tables']['lojas']['Row']
export type NotificationCategory = Database['public']['Tables']['notification_categories']['Row']

// Interfaces para queries com JOIN
export interface UserWithPreferences extends User {
  user_notification_preferences?: UserNotificationPreference[]
  user_preferences?: UserPreference[]
  preferencias_categorias?: PreferenciaCategoria[]
}

export interface ClienteWithPreferences extends Cliente {
  client_preferences?: ClientPreference[]
}

export interface ProdutoWithCategoria extends Produto {
  categorias?: Categoria
}

export interface PromocaoWithProduto extends Promocao {
  produtos?: ProdutoWithCategoria
}
