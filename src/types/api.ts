/**
 * JARVIS v3.8.0 — Centralized API Response Types
 * 
 * These types mirror the backend Pydantic models in models.py
 * and replace all `any` usage in apiClient.ts.
 */

// ─── Generic Response Envelope ───────────────────────────────────────────────

export interface ApiSuccess<T = void> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  status?: number;
}

export type ApiResult<T = void> = ApiSuccess<T> | ApiError;

// ─── System Status ───────────────────────────────────────────────────────────

export interface BatteryInfo {
  percent: number | null;
  is_charging: boolean | null;
  secs_left: number | null;
}

export interface CPUInfo {
  percent: number;
  count: number;
}

export interface MemoryInfo {
  total: number;
  used: number;
  percent: number;
  available: number;
}

export interface DiskInfo {
  total: number;
  used: number;
  free: number;
  percent: number;
}

export interface NetworkIOInfo {
  bytes_sent: number;
  bytes_recv: number;
  packets_sent: number;
  packets_recv: number;
}

export interface PersonalityInfo {
  id: string;
  name: string;
  accent: string;
  primary: string;
  style: string;
  voice_pitch?: number;
  voice_rate?: number;
}

export interface ActiveWindowInfo {
  title: string;
  process: string;
}

// ─── Performance Metrics ─────────────────────────────────────────────────────

// ─── Health Check ────────────────────────────────────────────────────────────

export interface HealthCheckResponse {
  status: string;
  name: string;
  version: string;
}

// ─── Conversations ───────────────────────────────────────────────────────────

export interface ConversationEntry {
  id: number | null;
  user_input: string;
  jarvis_response: string;
  command_type: string;
  success: boolean;
  language: string;
  session_id: string;
  timestamp: string;
}

export interface ConversationListResponse {
  success: boolean;
  conversations: ConversationEntry[];
  count: number;
}

export interface ConversationSaveResponse {
  success: boolean;
  id: number;
}

// ─── Memory Stats ────────────────────────────────────────────────────────────

export interface MemoryStats {
  total_conversations: number;
  successful_commands: number;
  success_rate: number;
  command_types: Record<string, number>;
  languages: Record<string, number>;
  period_days: number;
}

export interface MemoryStatsResponse {
  success: boolean;
  stats: MemoryStats;
}

// ─── Memory Facts ────────────────────────────────────────────────────────────

export interface MemoryFact {
  id: number | null;
  key: string;
  value: string;
  category: string;
  source: string;
  timestamp: string;
}

export interface FactListResponse {
  success: boolean;
  facts: MemoryFact[];
  count: number;
}

export interface FactCreateResponse {
  success: boolean;
  id: number;
}

export interface FactUpdateResponse {
  success: boolean;
}

export interface FactDeleteResponse {
  success: boolean;
}

// ─── Neural Memory Nodes ─────────────────────────────────────────────────────

export interface MemoryNodeInfo {
  name: string;
  path: string;
  size: number;
  updated_at: string;
  is_core: boolean;
}

export interface MemoryNodeListResponse {
  success: boolean;
  nodes: MemoryNodeInfo[];
  count: number;
}

export interface MemoryNodeContentResponse {
  success: boolean;
  name: string;
  content: string;
}

export interface MemoryNodeUpdateResponse {
  success: boolean;
  response: string;
}

// ─── Automation ──────────────────────────────────────────────────────────────

export interface AutomationTask {
  id: string;
  name: string;
  command: string;
  description?: string;
  schedule_type: 'interval' | 'cron' | 'once';
  schedule_time?: string;
  days?: string[];
  interval_seconds: number | null;
  cron_expression: string | null;
  enabled: boolean;
  run_count?: number;
  last_run: string | null;
  next_run: string | null;
}

export interface MacroStep {
  command: string;
  delay: number;
  parameters?: Record<string, unknown>;
}

export interface AutomationMacro {
  id: string;
  name: string;
  description?: string;
  commands: MacroStep[];
  trigger?: string;
  trigger_phrase: string | null;
  enabled: boolean;
  run_count?: number;
}

export interface TaskCreatePayload {
  name: string;
  command: string;
  description?: string;
  schedule_type: 'interval' | 'cron' | 'once';
  schedule_time?: string;
}

export interface MacroCreatePayload {
  name: string;
  description?: string;
  commands: MacroStep[];
  trigger?: string;
  trigger_phrase?: string;
}

export interface AutomationStatusResponse {
  success: boolean;
  status: {
    scheduler_running: boolean;
    running: boolean; // Alias for scheduler_running used in UI
    active_tasks: number;
    enabled_tasks: number;
    total_tasks: number;
    enabled_macros: number;
    total_macros: number;
    scheduled_jobs: number;
  };
}

export interface TaskListResponse {
  success: boolean;
  tasks: AutomationTask[];
}

export interface TaskCreateResponse {
  success: boolean;
  task: AutomationTask;
}

export interface MacroListResponse {
  success: boolean;
  macros: AutomationMacro[];
}

export interface MacroCreateResponse {
  success: boolean;
  macro: AutomationMacro;
}

// ─── WhatsApp ────────────────────────────────────────────────────────────────

export interface WhatsAppContact {
  alias: string;
  name: string;
  phone: string;
}

export interface WhatsAppStatusResponse {
  success: boolean;
  desktop_installed: boolean;
  is_running: boolean;
  response: string;
}

export interface WhatsAppSendResponse {
  success: boolean;
  response: string;
}

export interface WhatsAppDraftResponse {
  success: boolean;
  draft?: string;
  copied_to_clipboard: boolean;
  response: string;
}

export interface WhatsAppContactsResponse {
  success: boolean;
  contacts: WhatsAppContact[];
  count: number;
}

// ─── Security ────────────────────────────────────────────────────────────────

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu_percent: number;
  memory_mb: number;
  status: string;
  threat_level: 'safe' | 'suspicious' | 'critical';
}

export interface ProcessListResponse {
  success: boolean;
  processes: ProcessInfo[];
  count: number;
}

export interface NetworkConnection {
  pid: number;
  name: string;
  local_address: string;
  remote_address: string;
  status: string;
  type: string;
}

export interface NetworkScanResponse {
  success: boolean;
  connections: NetworkConnection[];
  count: number;
}

export interface QuarantineResponse {
  success: boolean;
  response: string;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export interface BroadcastNotificationResponse {
  success: boolean;
  clients_notified: number;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface JarvisSettings {
  llm_provider: string;
  nvidia_model?: string;
  openrouter_model?: string;
  ollama_url?: string;
  ollama_model?: string;
  enable_dangerous_commands: boolean;
  confirmation_timeout: number;
  wake_word_enabled: boolean;
  wake_word_phrase: string;
  proactive_enabled: boolean;
  tts_enabled: boolean;
  language: string;
  log_level?: string;
}

export interface SettingsResponse {
  success: boolean;
  settings: JarvisSettings;
}

export interface SettingsUpdateResponse {
  success: boolean;
  updated: string[];
  settings: JarvisSettings;
}

export interface ApiKeyStatus {
  NVIDIA_API_KEY: string | null;
  OPENROUTER_API_KEY: string | null;
  BACKEND_API_KEY: string | null;
}

export interface ApiKeyUpdatePayload {
  nvidia_api_key?: string;
  openrouter_api_key?: string;
  gemini_api_key?: string;
  backend_api_key?: string;
}

export interface ApiKeyUpdateResponse {
  success: boolean;
  message: string;
}

// ─── Device Sync ─────────────────────────────────────────────────────────────

export interface PairedDevice {
  id: string;
  name: string;
  type: string;
  paired_at: string;
  last_seen: string;
}

export interface SyncStatusResponse {
  success: boolean;
  device_name: string;
  paired_devices_count: number;
  system_status: Record<string, unknown>;
  last_updated: string;
}

export interface PairedDevicesResponse {
  success: boolean;
  devices: PairedDevice[];
  count: number;
}

// ─── Context & Suggestions ───────────────────────────────────────────────────

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  command: string;
  color?: string;
}

export interface QuickActionListResponse {
  success: boolean;
  actions: QuickAction[];
}

export interface SuccessResponse {
  success: boolean;
  message?: string;
}

export interface SuggestionResponse {
  success: boolean;
  suggestion: string;
  topic?: string;
  mood?: string;
}

// ─── Neural Logs & Timeline ──────────────────────────────────────────────────

export type LogLevel = 'STABLE' | 'PROCESSING' | 'ALERT' | 'INFO' | 'SYNC';

export interface NeuralLogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  details?: Record<string, unknown>;
  trace_id?: string;
}

export interface NeuralLogListResponse {
  success: boolean;
  logs: NeuralLogEntry[];
  count: number;
}

// ─── Neural Training & Voice ─────────────────────────────────────────────────

export interface VoiceProfile {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  base_model: string;
  lang?: string;
  accent?: string;
  pitch: number;
  rate: number;
  emotion_weight: number;
  logic_weight: number;
  last_trained?: string;
  is_active: boolean;
}

export interface VoiceProfileListResponse {
  success: boolean;
  profiles: VoiceProfile[];
}

export interface TrainingProgress {
  step: number;
  total_steps: number;
  loss: number;
  accuracy: number;
  current_epoch: number;
}
