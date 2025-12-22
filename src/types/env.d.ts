// src/types/env.d.ts - para TypeScript reconhecer variáveis VITE_
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_APP_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_VAPID_PUBLIC_KEY: string
  readonly VITE_TWILIO_SID: string
  readonly VITE_TWILIO_NUMBER: string
  readonly VITE_TWILIO_CHAT_SERVICE_SID: string
  // Adicione outras variáveis conforme necessário
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
