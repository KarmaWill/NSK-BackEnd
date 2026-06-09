/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_DEV_SKIP_AUTH?: string;
  readonly VITE_NEWS_AI_FORMAT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
