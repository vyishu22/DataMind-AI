/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_APP_NAME?: string
  // add other VITE_ variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
