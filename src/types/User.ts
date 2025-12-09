// loja-conect/src/types/User.ts
export interface User {
  id: string;
  email: string;
  nome?: string;
  foto_url?: string;
  avatar_url?: string;
  type: 'cliente' | 'loja';
  role?: string;
  lojaId?: string;
  preferred_categories?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  preferred_categories: string[];
  preferred_categories_active?: boolean;
  created_at: string;
  updated_at: string;
  foto_url?: string;
  nome: string;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    nome?: string;
    type?: 'cliente' | 'loja';
    foto_url?: string;
    avatar_url?: string;
  };
}

// ✅ NOVAS INTERFACES PARA O NOTIFICATION SYSTEM
export interface UserFromPreferences {
  id: string;
  nome: string;
  email: string;
  preferred_categories?: string[];
}

export interface UserPreferenceWithUser {
  id: string;
  user_id: string;
  preferred_categories: string[];
  preferred_categories_active: boolean;
  users: UserFromPreferences;
  nome: string;
}

export interface InterestedUser {
  id: string;
  nome: string;
  email: string;
  preferred_categories?: string[];
  preferences_id?: string;
}
