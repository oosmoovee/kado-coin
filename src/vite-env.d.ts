/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TWITTER_URL?: string
  readonly VITE_TELEGRAM_URL?: string
  readonly VITE_COMMUNITY_URL?: string
  readonly VITE_CONTRACT_ADDRESS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
