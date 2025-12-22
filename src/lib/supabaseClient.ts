// src/lib/supabaseClient.ts - VERSÃO CORRIGIDA
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

// =============================================
// VARIÁVEIS DE AMBIENTE (FRONTEND)
// =============================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (import.meta.env.DEV) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Variáveis do Supabase não configuradas')
    throw new Error(
      'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env'
    )
  }

  if (!supabaseUrl.startsWith('https://')) {
    console.warn('⚠️ VITE_SUPABASE_URL deve começar com https://')
  }
}

// =============================================
// CLIENTE SUPABASE TIPADO (FRONTEND)
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
})

// =============================================
// UPLOAD DE ARQUIVOS (FRONTEND)
// =============================================
export const uploadFile = async (
  bucket: string,
  file: File,
  path: string
) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) throw error
  return data
}

// =============================================
// TIPOS PARA PUSH NOTIFICATIONS (evitar conflito)
// =============================================
// Renomear para evitar conflito com o tipo do Database
export type PushSubscriptionType = {
  endpoint: string
  expirationTime?: number | null
  keys: {
    p256dh: string
    auth: string
  }
}

export type NotificationPayload = {
  title: string
  body: string
  icon?: string
  image?: string
  badge?: string
  tag?: string
  data?: Record<string, any>
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

// =============================================
// HELPERS SUPABASE
// =============================================
export const supabaseHelpers = {
  async getCurrentUserId(): Promise<string | null> {
    const { data } = await supabase.auth.getUser()
    return data.user?.id ?? null
  },

  async checkAuth() {
    const { data, error } = await supabase.auth.getSession()
    return {
      isAuthenticated: !!data.session,
      session: data.session,
      user: data.session?.user ?? null,
      error: error?.message ?? null
    }
  },

  // ✅ CORREÇÃO: Usar tipagem mais segura
  async safeSelect<T extends keyof Database['public']['Tables']>(
    table: T,
    columns = '*',
    filters: Record<string, any> = {}
  ) {
    try {
      let query = supabase.from(table as string).select(columns)

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })

      const { data, error } = await query

      if (error) {
        return { success: false, data: null, error: error.message }
      }

      return { success: true, data, error: null }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }
}

// =============================================
// RE-EXPORT DOS TIPOS DO PROJETO
// =============================================
export type {
  Categoria,
  Cliente,
  ClienteWithPreferences,
  Database,
  Loja,
  Produto,
  ProdutoWithCategoria,
  Promocao,
  PromocaoWithProduto,
  User,
  UserWithPreferences
} from '../types/supabase'

// =============================================
// EXPORT DEFAULT
// =============================================
export default supabase
