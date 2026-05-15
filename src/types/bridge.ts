// Types for JARVIS Backend API

export interface SystemStatus {
  success: boolean;
  battery: {
    percent: number | null;
    is_charging: boolean | null;
    secs_left: number | null;
  };
  cpu: {
    percent: number;
    count: number;
  };
  memory: {
    total: number;
    used: number;
    percent: number;
    available: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percent: number;
  };
  network: {
    bytes_sent: number;
    bytes_recv: number;
    packets_sent: number;
    packets_recv: number;
  };
  uptime: number;
  volume: number;
  platform: string;
  timestamp: string;
  error?: string;
  // v3.4.0 — contextual intelligence fields
  active_window?: {
    title: string;
    process: string;
  } | string | null;
  context_suggestion?: string | null;
  event_loop_lag?: number;
  personality?: {
    id: string;
    name: string;
    accent: string;
    primary: string;
    style: string;
  };
}

export interface CommandRequest {
  id: string;
  command: string;
  language: 'en' | 'hi' | 'hinglish';
  timestamp: number;
}

export interface CommandResponse {
  success: boolean;
  action_type?: string;
  command_key: string;
  language: 'en' | 'hi' | 'hinglish';
  response: string;
  requires_confirmation?: boolean;
  confirmation_id?: string;
  data?: Record<string, any>;
  error?: string;
  volume?: number;
  macro_name?: string;
  suggestion?: string;
  timestamp: string;
}

export interface ConfirmationRequest {
  confirmation_id: string;
  command_key: string;
  command_text: string;
  language: 'en' | 'hi' | 'hinglish';
  response: string;
  timeout: number;
}

export interface WebSocketMessage {
  type: 'command_response' | 'system_status' | 'confirmation_request' | 'error' | 'pong' | 'notification' | 'macro_update' | 'proactive_suggestion';
  data?: any;
  message?: string;
  timestamp?: string;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';
