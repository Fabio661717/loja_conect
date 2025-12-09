/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_APP_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_GA_TRACKING_ID?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_ENABLE_ANALYTICS?: string;
  readonly VITE_ENABLE_DEBUG?: string;
  readonly VITE_VAPID_PUBLIC_KEY: string;
  readonly VITE_VAPID_PRIVATE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
