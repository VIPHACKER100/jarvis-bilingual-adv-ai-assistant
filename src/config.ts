/** JARVIS Frontend Configuration — single source of truth for all URLs and constants */

export const API_BASE_URL: string =
  (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? 'http://localhost:8000';

export const WS_BASE_URL: string = API_BASE_URL.replace(/^http/, 'ws') + '/ws';

export const AUDIO_WS_URL: string =
  API_BASE_URL.replace(/^http/, 'ws') + '/api/v1/audio/ws/audio';

export const API_KEY: string =
  (import.meta.env.VITE_JARVIS_API_KEY as string | undefined) ?? '';

/** Supported languages as a const tuple */
export const LANGUAGES = ['en', 'hi', 'hinglish'] as const;

export type Language = (typeof LANGUAGES)[number];

/** Connection states */
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

/** Application modes */
export type AppMode = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING';

/** WS reconnection constants */
export const WS_MAX_RECONNECT_ATTEMPTS = 10;
export const WS_BASE_RECONNECT_DELAY = 1000; // ms
export const WS_MAX_RECONNECT_DELAY = 30000; // ms
export const WS_PING_INTERVAL = 30000; // ms
export const WS_PONG_TIMEOUT = 10000; // ms

/** SSE stream timeout */
export const SSE_TIMEOUT = 30000; // ms

/** Audio max size */
export const AUDIO_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/** Default stale times for TanStack Query */
export const STALE_TIMES = {
  systemStatus: 5000,
  windows: 10000,
  apps: 10000,
  processes: 5000,
  conversations: 30000,
  settings: 60000,
  suggestion: 30000,
  health: 10000,
} as const;
