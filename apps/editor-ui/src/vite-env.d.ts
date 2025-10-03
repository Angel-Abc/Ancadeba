/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EDITOR_SERVER_PORT?: string
  readonly VITE_EDITOR_SERVER_HOST?: string
  readonly VITE_EDITOR_SERVER_PROTOCOL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
