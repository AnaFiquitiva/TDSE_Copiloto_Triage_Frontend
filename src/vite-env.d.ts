/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL pública de la API FastAPI (p. ej. https://<app>.azurewebsites.net). */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
