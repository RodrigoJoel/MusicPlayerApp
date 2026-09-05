/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API key de YouTube Data API v3. Opcional: sin ella, la app usa modo demo. */
  readonly VITE_YOUTUBE_API_KEY?: string;
  /** URL base del backend que resuelve y sirve el audio (ver carpeta server/). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
