/* ==========================================================================
 * JARVIS API TypeScript Interfaces
 *
 * Complete mapping of ALL backend Pydantic models from backend/models.py
 * plus additional response shapes discovered from routers/*.py.
 * ========================================================================== */

// ---------------------------------------------------------------------------
// Base / Generic
// ---------------------------------------------------------------------------

export interface BaseResponse {
  success: boolean;
  response?: string;
  error?: string | null;
  response_time?: number | null;
  timestamp?: string;
  version?: string;
}

export interface HealthCheckResponse {
  status: string;
  version: string;
  platform?: string;
  uptime?: number;
}

// ---------------------------------------------------------------------------
// Command Models
// ---------------------------------------------------------------------------

export interface CommandRequest {
  command: string;
  language?: Language;
  session_id?: string | null;
}

export interface CommandResult extends BaseResponse {
  action_type: string;
  command?: string;
  command_key?: string;
  language?: string;
  macro_name?: string | null;
  requires_confirmation?: boolean;
  confirmation_id?: string | null;
  suggestion?: string | null;
  details?: Record<string, unknown> | null;
  data?: Record<string, unknown> | null;
}

export interface ConfirmationRequest {
  approved: boolean;
  details?: Record<string, unknown> | null;
}

export interface PendingConfirmationsResponse extends BaseResponse {
  pending: PendingConfirmationInfo[];
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

// ---------------------------------------------------------------------------
// System Status
// ---------------------------------------------------------------------------

export interface BatteryInfo {
  percent?: number | null;
  is_charging?: boolean | null;
  secs_left?: number | null;
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
  name: string;
  theme?: string;
}

export interface SystemStatus {
  success?: boolean;
  battery: BatteryInfo;
  cpu: CPUInfo;
  memory: MemoryInfo;
  disk: DiskInfo;
  network: NetworkIOInfo;
  uptime: number;
  volume: number;
  platform: string;
  active_window?: Record<string, unknown> | null;
  context_suggestion?: string | null;
  personality?: PersonalityInfo | null;
  event_loop_lag?: number | null;
}

export interface BatteryResponse extends BaseResponse {
  percent?: number | null;
  is_charging?: boolean | null;
}

export interface VolumeResponse extends BaseResponse {
  volume: number;
}

export interface TimeResponse extends BaseResponse {
  time: string;
  formatted: string;
}

export interface DateResponse extends BaseResponse {
  date: string;
  formatted: string;
}

export interface UptimeResponse extends BaseResponse {
  uptime_seconds: number;
  formatted: string;
}

export interface NetworkInfoResponse extends BaseResponse {
  hostname: string;
  ip: string;
  interfaces: Array<Record<string, string>>;
}

export interface WeatherResponse extends BaseResponse {
  temperature?: number;
  condition?: string;
  humidity?: number;
  city?: string;
}

export interface WebSearchResponse extends BaseResponse {
  query: string;
  results?: Array<{ title: string; url: string; snippet: string }>;
}

// ---------------------------------------------------------------------------
// Security / Process
// ---------------------------------------------------------------------------

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu_percent: number;
  memory_percent: number;
  status: string;
  threat_level?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ProcessListResponse extends BaseResponse {
  processes: ProcessInfo[];
  count: number;
}

export interface NetworkConnectionInfo {
  protocol: string;
  local_address: string;
  remote_address: string;
  status: string;
  pid: number;
  process_name?: string;
}

export interface NetworkScanResponse extends BaseResponse {
  connections: NetworkConnectionInfo[];
  count: number;
}

export interface QuarantineResponse extends BaseResponse {
  action: string;
  pid: number;
}

// ---------------------------------------------------------------------------
// Windows & Apps
// ---------------------------------------------------------------------------

export interface WindowInfo {
  title: string;
  pid: number;
  is_minimized?: boolean;
  is_maximized?: boolean;
  position?: number[] | null;
  size?: number[] | null;
}

export interface WindowListResponse extends BaseResponse {
  windows: WindowInfo[];
  count: number;
}

export interface AppListResponse extends BaseResponse {
  apps: string[];
  count: number;
}

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  size_human: string;
  created: string;
  modified: string;
  is_file: boolean;
  is_dir: boolean;
}

export interface FileInfoResponse extends BaseResponse {
  info: FileInfo;
}

export interface FileListResponse extends BaseResponse {
  folder: string;
  items: FileInfo[];
  total_count: number;
}

// ---------------------------------------------------------------------------
// Desktop / Clipboard / Screenshot
// ---------------------------------------------------------------------------

export interface ScreenshotResponse extends BaseResponse {
  image?: string;
  path?: string | null;
  saved?: boolean;
  size?: number[];
}

export interface ClipboardTextResponse extends BaseResponse {
  text?: string | null;
}

export interface CursorResponse extends BaseResponse {
  position: { x: number; y: number };
  screen: { width: number; height: number };
}

export interface ZoomResponse extends BaseResponse {
  level: number;
}

// ---------------------------------------------------------------------------
// Memory / Conversations
// ---------------------------------------------------------------------------

export interface ConversationEntry {
  id?: number | null;
  user_input: string;
  jarvis_response: string;
  command_type: string;
  success: boolean;
  language: string;
  session_id: string;
  timestamp: string;
}

export interface ConversationListResponse extends BaseResponse {
  conversations: ConversationEntry[];
  count: number;
}

export interface MemoryStatsResponse extends BaseResponse {
  stats: Record<string, unknown>;
}

export interface FactModel {
  id?: number | null;
  key: string;
  value: string;
  category: string;
  source: string;
  timestamp: string;
}

export interface FactListResponse extends BaseResponse {
  facts: FactModel[];
  count: number;
}

export interface MemoryNodeInfo {
  name: string;
  path: string;
  size: number;
  updated_at: string;
  is_core: boolean;
}

export interface MemoryNodeListResponse extends BaseResponse {
  nodes: MemoryNodeInfo[];
  count: number;
}

export interface MemoryNodeResponse extends BaseResponse {
  name: string;
  content: string;
}

// ---------------------------------------------------------------------------
// Automation
// ---------------------------------------------------------------------------

export interface AutomationTask {
  id?: string;
  name: string;
  command: string;
  schedule_type: 'once' | 'interval' | 'daily' | 'cron';
  interval_seconds?: number | null;
  cron_expression?: string | null;
  enabled: boolean;
  created_at?: string;
}

export interface TaskListResponse extends BaseResponse {
  tasks: AutomationTask[];
  count: number;
}

export interface AutomationMacro {
  id?: string;
  name: string;
  description?: string;
  commands: string[];
  trigger_phrase?: string | null;
  created_at?: string;
}

export interface MacroListResponse extends BaseResponse {
  macros: AutomationMacro[];
  count: number;
}

export interface AutomationStatusResponse extends BaseResponse {
  scheduler_running: boolean;
  active_tasks: number;
  queue_size: number;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface JarvisSettings {
  llm_provider?: string;
  language?: string;
  enable_dangerous_commands?: boolean;
  confirmation_timeout?: number;
  wake_word_enabled?: boolean;
  wake_word_phrase?: string;
  personality?: string;
}

export interface SettingsResponse extends BaseResponse {
  settings: Record<string, unknown>;
}

export interface ApiKeyStatusResponse {
  NVIDIA_API_KEY?: string | null;
  OPENROUTER_API_KEY?: string | null;
  OPENAI_API_KEY?: string | null;
  GEMINI_API_KEY?: string | null;
  BACKEND_API_KEY?: string | null;
}

export interface ApiKeyUpdatePayload {
  nvidia_api_key?: string | null;
  openrouter_api_key?: string | null;
  gemini_api_key?: string | null;
  backend_api_key?: string | null;
}

export interface KeyTestResponse extends BaseResponse {
  provider: string;
  valid: boolean;
}

// ---------------------------------------------------------------------------
// Persona / Personality
// ---------------------------------------------------------------------------

export interface Personality {
  id: string;
  name: string;
  description?: string;
  theme?: string;
  accent_color?: string;
}

export interface PersonalitiesListResponse extends BaseResponse {
  personalities: Personality[];
  count: number;
}

export interface SetPersonalityResponse extends BaseResponse {
  personality_id: string;
}

// ---------------------------------------------------------------------------
// Performance / Insights
// ---------------------------------------------------------------------------

export interface PerformancePoint {
  timestamp: string;
  cpu: number;
  memory: number;
  event_loop_lag?: number;
}

export interface PerformanceHistoryResponse extends BaseResponse {
  points: PerformancePoint[];
  count: number;
}

export interface CommandInsightsResponse extends BaseResponse {
  data?: {
    top_commands: Array<{ command_type: string; count: number }>;
    daily_activity: Array<{ day: string; count: number }>;
    peak_hour: { hour: number; count: number };
    failure_patterns: Array<{ command_type: string; failures: number; total: number }>;
    period_days: number;
  };
}

// ---------------------------------------------------------------------------
// WhatsApp
// ---------------------------------------------------------------------------

export interface WhatsAppStatusResponse extends BaseResponse {
  desktop_installed: boolean;
  desktop_running: boolean;
  is_authenticated: boolean;
}

export interface WhatsAppContactListResponse extends BaseResponse {
  contacts: Array<Record<string, string>>;
  count: number;
}

export interface WhatsAppDraftResponse extends BaseResponse {
  draft?: string | null;
  copied_to_clipboard?: boolean;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface NotificationRequest {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

export interface NotificationResponse extends BaseResponse {
  clients_notified: number;
}

// ---------------------------------------------------------------------------
// Sync / Pairing
// ---------------------------------------------------------------------------

export interface PairingCodeResponse {
  code: string;
  expires_in: number;
}

export interface DevicePairingResponse extends BaseResponse {
  device_id: string;
  access_token: string;
  message: string;
}

export interface PairedDevice {
  id: string;
  name: string;
  type: string;
  paired_at: string;
  last_seen: string;
}

export interface PairedDevicesResponse extends BaseResponse {
  devices: PairedDevice[];
  count: number;
}

export interface SyncStatusResponse extends BaseResponse {
  device_name: string;
  paired_devices_count: number;
  system_status: Record<string, unknown>;
  last_updated: string;
}

// ---------------------------------------------------------------------------
// Context / Suggestions
// ---------------------------------------------------------------------------

export interface SuggestionResponse extends BaseResponse {
  suggestion: string;
  topic?: string;
  mood?: string;
}

export interface QuickAction {
  id: string;
  label: string;
  command: string;
  icon?: string;
  color?: string;
}

export interface QuickActionListResponse extends BaseResponse {
  actions: QuickAction[];
}

// ---------------------------------------------------------------------------
// Agent
// ---------------------------------------------------------------------------

export interface AgentChatResponse extends BaseResponse {
  response: string;
  provider?: string;
  model?: string;
}

export interface AgentRagResponse extends BaseResponse {
  response: string;
  sources?: string[];
}

export interface AgentHealthResponse {
  status: string;
  provider: string;
  model: string;
  uptime?: number;
}

// ---------------------------------------------------------------------------
// OCR / Media
// ---------------------------------------------------------------------------

export interface OCRResultResponse extends BaseResponse {
  text?: string | null;
  confidence: number;
  detected_language?: string | null;
  extraction_type: string;
}

export interface ImageConvertResponse extends BaseResponse {
  output_path?: string;
}

export interface ImageResizeResponse extends BaseResponse {
  width: number;
  height: number;
}

export interface ImageCompressResponse extends BaseResponse {
  original_size: number;
  compressed_size: number;
  savings_percent: number;
}

// ---------------------------------------------------------------------------
// Audio WS Types
// ---------------------------------------------------------------------------

export interface AudioWSIncoming {
  type: 'stt_result' | 'tts_audio' | 'tts_chunk' | 'tts_end' | 'tts_error' | 'error' | 'pong';
  text?: string;
  audio?: string;
  format?: 'opus' | 'webm' | 'mp3';
  error?: string;
}

export interface AudioWSOutgoing {
  type: 'stt' | 'tts' | 'tts_stream' | 'ping';
  audio?: string;
  text?: string;
  voice?: string;
  language?: string;
}

// ---------------------------------------------------------------------------
// SSE Event Types
// ---------------------------------------------------------------------------

export type SSEEvent =
  | { type: 'meta'; provider: string; language: string }
  | { type: 'chunk'; text: string }
  | { type: 'done'; full_text: string }
  | { type: 'partial_done'; full_text: string; truncated: boolean }
  | { type: 'error'; error: string };

// ---------------------------------------------------------------------------
// WS Broadcast Event Types
// ---------------------------------------------------------------------------

export interface ProactiveSuggestionEvent {
  suggestion: string;
  topic: string;
  mood: string;
  timestamp: string;
}

export interface WakeDetectedEvent {
  model: string;
  score: number;
}

// ---------------------------------------------------------------------------
// Macro Step (backend shape)
// ---------------------------------------------------------------------------

export interface MacroStepBackend {
  command: string;
  delay: number;
  parameters?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Utility / Aliases (re-exported from config.ts for convenience)
// ---------------------------------------------------------------------------

export type Language = 'en' | 'hi' | 'hinglish';
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';
export type AppMode = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING';
