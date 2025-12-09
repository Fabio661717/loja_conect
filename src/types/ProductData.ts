  // src/types/ProductData.ts - VERSÃO COMPLETA E CORRIGIDA

export interface Parcelamento {
  habilitado: boolean;
  max_parcelas: number;
  juros: number;
  product: string;
}

  export interface Product {
    id: string;
    nome: string;
    name?: string;
    categoria?: string;
    category?: string;
    productImages?: string[];
    description?: string | null;
    categoria_id?: string;
    preco?: number;
    estoque: number;
    foto_url?: string;
    image?: string;
    imagem?: string;
    imagem_url?: string;
    image_url?: string;
    imagens?: string[];
    descricao?: string ;
    loja_id?: string;
    created_at?: string;
    updated_at?: string;
    fim_reserva?: string;
    cores?: string[];
    tamanhos?: string[];
    ativo?: boolean;
    parcelamento?: ParcelamentoOptions;
  }

  // Interface para criação de produto
  export interface CreateProductData {
    nome: string;
    descricao: string;
    preco: number;
    estoque: number;
    categoria_id: string;
    foto_url?: string;
    tamanhos?: string[];
    parcelamento?: ParcelamentoOptions;

  }

  // Mantenha ProductData para compatibilidade
  export interface ProductData extends Product {}

  export interface ProductComplete extends Product {}

  // ✅ INTERFACE PARA OPÇÕES DE PARCELAMENTO - CORRIGIDA COM PROPRIEDADE OBRIGATÓRIA
  export interface ParcelamentoOptions {
    habilitado: boolean;
    max_parcelas: number;
    juros: number;
    product: string; // ✅ CORREÇÃO: Propriedade OBRIGATÓRIA
  }

  // ✅ NOVOS TIPOS ADICIONADOS PARA RESOLVER OS ERROS DO PRODUCTFORM
  export interface UserFromPreferences {
    id: string;
    nome: string;
    email: string;
    preferred_categories?: string[];
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

  export interface InterestedUser {
    id: string;
    nome: string;
    email: string;
    preferred_categories?: string[];
  }

  export interface UserWithSubscriptions extends InterestedUser {
    push_subscriptions: PushSubscriptionData[];
  }

  export interface PushSubscriptionData {
    id: string;
    user_id: string;
    subscription: any;
    created_at: string;
    updated_at: string;
  }

  export interface NotificationData {
    product_name: string;
    category_name: string;
    category_id: string;
    store_id: string;
    price: number;
  }

  export interface DatabaseNotification {
    user_id: string;
    type: string;
    title: string;
    message: string;
    category: string;
    data: NotificationData;
    read: boolean;
    created_at: string;
  }

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

  export interface Categoria {
    id: string;
    nome: string;
    descricao?: string;
    loja_id: string;
    created_at: string;
    updated_at: string;
    is_active?: boolean;
    source?: string;
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

  export interface Reserva {
    id: string;
    loja_id: string;
    created_at: string;
  }

  export interface ProductFormData {
    id: string;
    nome: string;
    descricao: string;
    categoria_id: string;
    preco: number;
    estoque: number;
    sizes: string[];
    images: string[];
    parcelamento: ParcelamentoOptions;
  }

  // ✅ TIPOS PARA AS QUERIES COM JOINS
  export interface UserNotificationPreferenceWithUser {
    user_id: string;
    users: {
      id: string;
      nome: string;
      email: string;
      preferred_categories?: string[];
    };
  }

  export interface UserPreferenceWithUser {
    user_id: string;
    users: {
      id: string;
      nome: string;
      email: string;
      preferred_categories?: string[];
    };
  }

  export interface ClientPreferenceWithCliente {
    cliente_id: string;
    clientes: {
      id: string;
      nome: string;
      email: string;
      preferred_categories?: string[];
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

  // ✅ TIPOS BÁSICOS PARA USUÁRIOS E CLIENTES
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

  // ✅ TIPOS PARA O FORMULÁRIO DE PRODUTO
  export interface ProductFormState {
    id: string;
    nome: string;
    descricao: string;
    categoria_id: string;
    preco: number;
    estoque: number;
    sizes: string[];
    images: string[];
    parcelamento: ParcelamentoOptions;
  }

  // ✅ TIPOS PARA AS RESPOSTAS DAS QUERIES DO SUPABASE
  export interface SupabaseUserResponse {
    data: UserFromPreferences[] | null;
    error: any;
  }

  export interface SupabaseUsersFromPreferencesResponse {
    data: UsersFromPreferences[] | null;
    error: any;
  }

  export interface SupabaseUsersFromUserPrefsResponse {
    data: UsersFromUserPrefs[] | null;
    error: any;
  }

  export interface SupabaseClientsFromPrefsResponse {
    data: ClientsFromPrefs[] | null;
    error: any;
  }

  export interface SupabaseUsersFromCatPrefsResponse {
    data: UsersFromCatPrefs[] | null;
    error: any;
  }

  export interface SupabaseUsersFallbackResponse {
    data: User[] | null;
    error: any;
  }

  export interface SupabaseClientesFallbackResponse {
    data: Cliente[] | null;
    error: any;
  }

  // ✅ TIPOS PARA NOTIFICAÇÕES
  export interface NotificationPayload {
    title: string;
    body: string;
    icon: string;
    tag: string;
    data: {
      url: string;
      type: string;
      productName: string;
      categoryName: string;
      price: number;
    };
  }

  export interface PushNotificationMessage {
    type: string;
    data: {
      subscription: any;
      payload: NotificationPayload;
    };
  }

  // ✅ TIPOS PARA O SERVICE WORKER
  export interface ServiceWorkerMessage {
    type: 'SEND_PUSH_NOTIFICATION';
    data: {
      subscription: any;
      payload: NotificationPayload;
    };
  }

  // ✅ TIPOS ESPECÍFICOS PARA O NOTIFICATION SYSTEM
  export interface NotificationSystemPayload {
    title: string;
    body: string;
    data: {
      type: 'new_product' | 'promotion' | 'reservation_reminder' | 'reservation_ending';
      productId?: string;
      productName?: string;
      categoryId?: string;
      categoryName?: string;
      storeId?: string;
      storeName?: string;
      price?: number;
      originalPrice?: number;
      discount?: number;
      reservationId?: string;
      minutesRemaining?: number;
      url?: string;
      action?: string;
    };
  }

  export interface BulkNotificationData {
    user_id: string;
    type: string;
    title: string;
    message: string;
    category: string;
    data: any;
    read: boolean;
    created_at: string;
  }

  // ✅ TIPOS PARA PREFERÊNCIAS DE NOTIFICAÇÃO
  export interface NotificationPreference {
    id: string;
    user_id: string;
    category_id: string;
    is_enabled: boolean;
    created_at: string;
    updated_at: string;
  }

  export interface NotificationCategory {
    id: string;
    name: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }

  // ✅ TIPOS PARA AS QUERIES DO NOTIFICATION SYSTEM
  export interface NotificationPreferenceWithUser {
    user_id: string;
    is_enabled: boolean;
    users: {
      id: string;
      nome: string;
      email: string;
      preferred_categories?: string[];
    };
  }

  export interface UserWithPreferences {
    id: string;
    nome: string;
    email: string;
    preferred_categories?: string[];
    notification_preferences?: NotificationPreference[];
  }

  // src/types/ProductData.ts - ADIÇÕES PARA COMPATIBILIDADE

// ✅ ADICIONE ESTAS INTERFACES AO ARQUIVO EXISTENTE
export interface UserPreferenceWithUser {
  id: string;
  user_id: string;
  preferred_categories: string[];
  preferred_categories_active: boolean;
  user: {
    id: string;
    nome: string;
    email: string;
  };
}

export interface InterestedUser {
  id: string;
  nome: string;
  email: string;
  preferred_categories?: string[];
  preferences_id?: string;
}
  // ✅ TIPOS PARA RESPOSTAS DE ARRAYS CORRETOS
  export interface UsersArrayResponse {
    data: Array<{
      id: string;
      nome: string;
      email: string;
      preferred_categories?: string[];
    }> | null;
    error: any;
  }

  export interface PreferencesArrayResponse {
    data: Array<{
      user_id: string;
      users: {
        id: string;
        nome: string;
        email: string;
        preferred_categories?: string[];
      };
    }> | null;
    error: any;
  }

  // ✅ TIPOS PARA VALORES PADRÃO
  export const DEFAULT_PARCELAMENTO: ParcelamentoOptions = {
    habilitado: false,
    max_parcelas: 1,
    juros: 0,
    product: "" // ✅ Valor padrão para a propriedade obrigatória
  };

  export const DEFAULT_PRODUCT: Product = {
    id: "",
    nome: "",
    preco: 0,
    estoque: 0,
    descricao: "",
    categoria_id: "",
    loja_id: "",
    foto_url: "",
    tamanhos: [],
    parcelamento: DEFAULT_PARCELAMENTO
  };

  // ✅ TIPOS UTILITÁRIOS
  export type ProductField = keyof Product;
  export type CreateProductField = keyof CreateProductData;
  export type ParcelamentoField = keyof ParcelamentoOptions;

  // ✅ ENUMS PARA VALORES PRÉ-DEFINIDOS
  export enum ProductStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    OUT_OF_STOCK = 'out_of_stock'
  }

  export enum NotificationType {
    NEW_PRODUCT = 'new_product',
    PROMOTION = 'promotion',
    RESERVATION_REMINDER = 'reservation_reminder',
    RESERVATION_ENDING = 'reservation_ending',
    SYSTEM = 'system'
  }

  export enum ParcelamentoStatus {
    ENABLED = 'enabled',
    DISABLED = 'disabled'
  }
