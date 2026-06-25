export interface SystemStatus {
  cpu_percent: number;
  memory_percent: number;
  disk_percent: number;
  battery_percent: number | null;
  is_charging: boolean | null;
  event_loop_lag: number;
}

export interface CommandResult {
  command: string;
  response: string;
  language: string;
  success: boolean;
  requires_confirmation?: boolean;
  confirmation_id?: string;
  error?: string;
}

export interface PendingConfirmationInfo {
  confirmation_id: string;
  command_key: string;
  command_text: string;
  language: string;
  response: string;
  timeout: number;
  created_at: string;
}

export interface SettingsResponse {
  llm_provider: string;
  wake_word_enabled: boolean;
  dangerous_commands_enabled: boolean;
  language: string;
}

export interface HealthCheckResponse {
  status: string;
  version: string;
}

export interface BaseResponse {
  success: boolean;
  error?: string;
  detail?: string;
}

export type AppMode = "IDLE" | "LISTENING" | "PROCESSING" | "SPEAKING";

export interface PerformancePoint {
  timestamp: string;
  cpu: number;
  memory: number;
}

export type ConnectionStatus = "connected" | "disconnected" | "connecting";
