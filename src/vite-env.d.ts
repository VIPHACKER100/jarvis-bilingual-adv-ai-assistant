/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_WS_URL?: string;
  readonly VITE_JARVIS_API_KEY?: string;
  readonly DISABLE_HMR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
