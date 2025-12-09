// src/types/notification.ts - TIPOS UNIFICADOS E CORRIGIDOS

// ===============================================================
// CATEGORIAS DE NOTIFICAÇÃO
// ===============================================================

export interface NotificationCategory {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  is_active: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at?: string;
  loja_id?: string | null;
  source?: 'store' | 'system';
}

// ===============================================================
// PREFERÊNCIAS DO USUÁRIO
// ===============================================================

export interface UserNotificationPreference {
  id: string;
  user_id: string;
  category_id: string;
  is_enabled: boolean;
  created_at?: string;
  updated_at?: string;
  category?: NotificationCategory;
}

// ===============================================================
// NOTIFICAÇÕES DO USUÁRIO
// ===============================================================

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  category_id?: string;
  loja_id?: string;
  source: string;
  user_id: string;
  type: 'success' | 'error' | 'warning' | 'info' | string;
  category?: NotificationCategory;
}

export interface UINotification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

// ===============================================================
// NOTIFICAÇÕES PUSH
// ===============================================================

export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  url: string;
  tag?: string;
  categoryId?: string;
  productId?: string;
  timestamp?: number;
  data?: {
    categoryId: string;
    productId: string;
    [key: string]: any;
  };
}

// Status do envio de notificação
export enum NotificationStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  PENDING = 'pending'
}

// Log de notificação enviada
export interface SentNotification {
  id: string;
  user_id: string;
  subscription_id?: string;
  product_id?: string;
  category_id?: string;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  url?: string;
  platform?: string;
  status: NotificationStatus;
  error_message?: string;
  opened_at?: string;
  created_at: string;
}

// ===============================================================
// USUÁRIOS E CLIENTES
// ===============================================================

export interface User {
  id: string;
  nome: string;
  email: string;
  preferred_categories?: string[];
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  preferred_categories?: string[];
  created_at: string;
  updated_at: string;
}

// ✅ TIPO PARA O ARRAY DE USUÁRIOS INTERESSADOS
export interface InterestedUser {
  id: string;
  nome: string;
  email: string;
  preferred_categories?: string[];
}

// ===============================================================
// RELACIONAMENTOS PARA QUERIES
// ===============================================================

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

// ✅ TIPOS PARA AS QUERIES DO PRODUCTFORM
export interface UserFromPreferences {
  id: string;
  nome: string;
  email: string;
}

export interface UsersFromPreferences {
  user_id: string;
  users: UserFromPreferences;
}

export interface UsersFromUserPrefs {
  user_id: string;
  users: UserFromPreferences;
}

export interface ClientsFromPrefs {
  cliente_id: string;
  clientes: {
    id: string;
    nome: string;
    email: string;
  };
}

export interface UsersFromCatPrefs {
  user_id: string;
  users: UserFromPreferences;
}

// ===============================================================
// PUSH NOTIFICATIONS
// ===============================================================

export interface PushSubscriptionData {
  id: string;
  user_id: string;
  subscription: any;
  endpoint?: string;
  p256dh_key?: string;
  auth_key?: string;
  platform?: string;
  category?: string;
  active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserWithSubscriptions extends InterestedUser {
  push_subscriptions: PushSubscriptionData[];
}

// ===============================================================
// NOTIFICAÇÕES DO BANCO
// ===============================================================

export interface NotificationData {
  product_name: string;
  category_name: string;
  category_id: string;
  store_id: string;
  price: number;
}

export interface DatabaseNotification {
  id?: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  category?: string;
  data?: NotificationData;
  read: boolean;
  created_at: string;
}

// ===============================================================
// PREFERÊNCIAS
// ===============================================================

export interface UserPreference {
  id: string;
  user_id: string;
  preferred_categories: string[];
  created_at: string;
  updated_at: string;
}

export interface ClientPreference {
  id: string;
  cliente_id: string;
  preferred_categories: string[];
  created_at: string;
  updated_at: string;
}

export interface PreferenciaCategoria {
  id: string;
  user_id: string;
  categoria_nome: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// ===============================================================
// PRODUTOS E CATEGORIAS
// ===============================================================

export interface ProductCategory {
  id: string;
  nome: string;
  descricao?: string;
  loja_id: string;
  created_at: string;
  is_active: boolean;
}

export interface Categoria {
  id: string;
  nome: string;
  descricao?: string;
  loja_id: string;
  created_at: string;
  is_active: boolean;
  updated_at?: string;
}

export interface Produto {
  id: string;
  nome: string;
  categoria_id: string;
  preco: number;
  estoque: number;
  foto_url?: string;
  descricao?: string;
  loja_id: string;
  created_at: string;
  categorias?: {
    nome: string;
    id: string;
  };
}

// Tipo para categorias de produtos da loja
export interface ProductCategory {
  id: string;
  nome: string;
  descricao?: string;
  loja_id: string;
  created_at: string;
  is_active: boolean;
}

// ===============================================================
// PROMOÇÕES
// ===============================================================

export interface Promotion {
  id: string;
  nome: string;
  descricao: string;
  categoria_id: string;
  loja_id: string;
  data_inicio: string;
  data_fim: string;
  ativa: boolean;
  created_at: string;
}

export interface Promocao {
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
  produtos?: {
    nome: string;
    preco: number;
    categorias?: {
      nome: string;
    };
  };
}

// ===============================================================
// RESERVAS
// ===============================================================

export interface Reserva {
  id: string;
  loja_id: string;
  created_at: string;
}

// ===============================================================
// FORMULÁRIOS
// ===============================================================

export interface ProductFormData {
  id: string;
  nome: string;
  descricao: string;
  categoria_id: string;
  preco: number;
  estoque: number;
  sizes: string[];
  images: string[];
  parcelamento: {
    habilitado: boolean;
    max_parcelas: number;
    juros: number;
    product: string;
  };
}

// ===============================================================
// TIPOS PARA RESPONSES DE API
// ===============================================================

export interface NotificationResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export interface PushSubscriptionResponse {
  success: boolean;
  subscription?: PushSubscriptionData;
  error?: string;
}
