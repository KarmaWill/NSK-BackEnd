/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_CLINGO_ADMIN_API_BASE_URL?: string;
  readonly VITE_CLINGO_ADMIN_PATH_PREFIX?: string;
  readonly VITE_CLINGO_EXAM_API_BASE_URL?: string;
  readonly VITE_CLINGO_EXAM_PATH_PREFIX?: string;
  readonly VITE_CLINGO_AUTH_HEADER?: string;
  readonly VITE_CLINGO_DEV_KEY?: string;
  readonly VITE_AUTH_MODE?: 'login' | 'trusted-network';
  readonly VITE_DEV_SKIP_AUTH?: string;
  readonly VITE_NEWS_AI_FORMAT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
