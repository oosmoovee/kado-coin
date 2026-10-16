/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TWITTER_URL?: string
  readonly VITE_TELEGRAM_URL?: string
  readonly VITE_COMMUNITY_URL?: string
  readonly VITE_CONTRACT_ADDRESS?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
