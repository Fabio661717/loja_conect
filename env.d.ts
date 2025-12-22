// env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Frontend - Públicas
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SUPABASE_FUNCTIONS_URL: string
  readonly VITE_VAPID_PUBLIC_KEY: string
  readonly VITE_APP_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_ENV: 'development' | 'production' | 'test'
  readonly VITE_DEBUG: string
  readonly VITE_SUPABASE_STORAGE_BUCKET: string
  readonly VITE_MAX_UPLOAD_SIZE: string

  // Backend - NUNCA devem aparecer aqui
  // readonly VITE_SUPABASE_SERVICE_ROLE_KEY: string ❌ NUNCA!
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Para Node.js/Backend
declare namespace NodeJS {
  interface ProcessEnv {
    // Backend - Privadas
    SUPABASE_SERVICE_ROLE_KEY: string
    SUPABASE_URL: string
    SMTP_PASSWORD: string
    SMTP_USER: string
    ENCRYPTION_KEY: string
    JWT_SECRET: string

    // Frontend via Vite - NUNCA devem aparecer aqui
    // VITE_SUPABASE_ANON_KEY: string ❌ NUNCA!
  }
}
