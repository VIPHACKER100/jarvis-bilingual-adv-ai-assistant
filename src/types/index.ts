// ==========================================================================
// JARVIS v4.0 — TypeScript Interfaces matching Pydantic models
// ==========================================================================

// ── Health ──
export interface HealthReport {
  status: string;
  version: string;
  uptime_seconds: number;
  timestamp: string;
  performance: {
    db_latency_ms: number;
    cpu_usage_percent: number;
    memory_usage_percent: number;
  };
  automation: {
    active_macros: number;
    scheduler_active: boolean;
  };
}

export interface ReadinessReport {
  status: 'ready' | 'not ready';
  database: 'connected' | 'disconnected';
}

export interface LivenessReport {
  status: 'alive';
}

// ── Auth ──
export interface ApiKeyStatusResponse {
  NVIDIA_API_KEY: boolean;
  OPENROUTER_API_KEY: boolean;
  BACKEND_API_KEY: boolean;
  [key: string]: boolean;
}

export interface ApiKeyUpdateRequest {
  nvidia_api_key?: string;
  openrouter_api_key?: string;
  gemini_api_key?: string;
  backend_api_key?: string;
}

// ── Commands ──
export interface CommandRequest {
  command: string;
  language?: 'en' | 'hi' | 'hinglish';
  session_id?: string;
}

export interface CommandResult {
  success: boolean;
  response: string | null;
  error: string | null;
  response_time: number;
  timestamp: string;
  version: string;
  action_type: string | null;
  command_key: string;
  language: string;
  macro_name: string | null;
  requires_confirmation: boolean;
  confirmation_id: string | null;
  suggestion: string | null;
  details: Record<string, unknown> | null;
  data: Record<string, unknown> | null;
}

export interface ConfirmationRequest {
  approved: boolean;
  details?: Record<string, unknown> | null;
}

export interface BaseResponse {
  success: boolean;
  response: string;
  error?: string;
  request_id?: string;
  timestamp?: string;
  requires_confirmation?: boolean;
  confirmation_id?: string | null;
}

// ── System ──
export interface SystemStatusResponse {
  success: boolean;
  error?: string;
  battery: {
    percent: number;
    is_charging: boolean;
  };
  cpu: {
    percent: number;
    cores: number;
    frequency: number;
  };
  memory: {
    percent: number;
    used_gb: number;
    total_gb: number;
  };
  disk: {
    percent: number;
    used_gb: number;
    total_gb: number;
  };
  network: {
    hostname: string;
    ip: string;
    interfaces: string[];
  };
  volume: number;
  platform: string;
  uptime: number;
  active_window: {
    title: string;
    process: string;
  } | null;
  context_suggestion: string | null;
  personality: {
    id: string;
    name: string;
    accent: string;
    primary?: string;
    secondary?: string;
  } | null;
  event_loop_lag: number;
}

export interface BatteryResponse {
  success: boolean;
  percent: number;
  is_charging: boolean;
}

export interface TimeResponse {
  success: boolean;
  time: string;
  formatted: string;
}

export interface DateResponse {
  success: boolean;
  date: string;
  formatted: string;
}

export interface VolumeResponse {
  success: boolean;
  volume: number;
}

export interface UptimeResponse {
  success: boolean;
  uptime_seconds: number;
  formatted: string;
}

export interface NetworkInfoResponse {
  success: boolean;
  hostname: string;
  ip: string;
  interfaces: string[];
}

export interface PerformanceEntry {
  timestamp: string;
  event_loop_lag: number;
  cpu_percent: number;
  memory_percent: number;
}

export interface PersonalityInfo {
  id: string;
  name: string;
  accent: string;
  primary?: string;
  secondary?: string;
}

export interface PersonalityConfig extends PersonalityInfo {
  voice_pitch: number;
  voice_rate: number;
  style: string;
  motto: string;
}

export interface SetPersonalityResponse {
  success: boolean;
  message: string;
  config: PersonalityConfig;
}

export interface CommandInsights {
  top_commands: Array<{ command: string; count: number }>;
  daily_activity: Array<{ date: string; count: number }>;
  peak_hour: { hour: number; count: number };
  failure_patterns: Array<{ pattern: string; count: number }>;
  period_days: number;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu_percent: number;
  memory_mb: number;
  status: string;
  threat_level: 'safe' | 'suspicious' | 'malicious';
}

export interface ConnectionInfo {
  pid: number;
  process: string;
  local_addr: string;
  remote_addr: string;
  status: string;
}

// ── Settings ──
export interface SettingsData {
  llm_provider: string;
  nvidia_model: string;
  openrouter_model: string;
  language: string;
  port: number;
  log_level: string;
  enable_dangerous_commands: boolean;
  confirmation_timeout: number;
  wake_word_enabled: boolean;
  wake_word_phrase: string;
}

export interface SettingsResponse {
  success: boolean;
  settings: SettingsData;
}

export interface SettingsUpdateRequest {
  llm_provider?: 'openrouter' | 'nvidia' | 'openai' | 'google' | 'ollama';
  enable_dangerous_commands?: boolean;
  confirmation_timeout?: number;
  wake_word_enabled?: boolean;
  wake_word_phrase?: string;
  language?: string;
}

// ── Agent ──
export interface AgentQuery {
  query: string;
  language?: 'en' | 'hi' | 'hinglish';
  stream?: boolean;
  use_rag?: boolean;
  session_id?: string | null;
}

export interface AgentChatResponse {
  success: boolean;
  response: string;
  provider: 'openrouter' | 'nvidia' | string;
  language: string;
}

export interface AgentHealthResponse {
  success: boolean;
  online: boolean;
  active_provider: string | null;
}

// ── SSE Stream Events ──
export type StreamEvent =
  | { type: 'meta'; provider: string; language: string }
  | { type: 'chunk'; text: string }
  | { type: 'done'; full_text: string }
  | { type: 'error'; error: string }
  | { type: 'partial_done'; full_text: string; truncated: boolean };

// ── WebSocket Message Types ──
export type WSMessage =
  | { type: 'system_status'; data: SystemStatusResponse; timestamp: string }
  | { type: 'notification'; data: { title: string; message: string; type: 'info' | 'warning' | 'error' | 'success'; duration: number } }
  | { type: 'proactive_suggestion'; data: { text: string; timestamp: string } }
  | { type: 'agent_thinking'; session_id: string; data?: { thought: string; session_id: string } }
  | { type: 'agent_resolved'; data: { full_response: string; session_id: string } }
  | { type: 'command_result'; data: Record<string, unknown> }
  | { type: 'pong' };

export type WSOutgoingMessage =
  | { type: 'command'; command: string; language: 'en' | 'hi' | 'hinglish'; params?: Record<string, unknown>; session_id?: string }
  | { type: 'confirmation'; data: { confirmation_id: string; approved: boolean } }
  | { type: 'ping' }
  | { type: 'get_status' };

// ── Conversation ──
export interface ConversationEntry {
  id: string;
  type: 'user' | 'jarvis';
  text: string;
  timestamp: string;
  action_type?: string | null;
}

// ── Notifications ──
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration: number;
}

// ── Pending Confirmation ──
export interface PendingConfirmation {
  id: string;
  command: string;
  details: string;
  timeout: number;
  expiresAt: number;
}

// ── API Error ──
export interface ApiError {
  status: number;
  message: string;
  detail?: string;
  request_id?: string;
}
