/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API key de YouTube Data API v3. Opcional: sin ella, la app usa modo demo. */
  readonly VITE_YOUTUBE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
