/* ==========================================================================
 * JARVIS API TypeScript Interfaces — core shapes used by apiClient
 * ========================================================================== */

export interface BaseResponse {
  success: boolean;
  response?: string;
  error?: string | null;
  response_time?: number | null;
  timestamp?: string;
  version?: string;
}

export type Language = 'en' | 'hi' | 'hinglish';
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';
export type AppMode = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING';
