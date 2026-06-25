/**
 * JARVIS API Client — Fully typed REST client for all backend endpoints.
 *
 * All methods are organized by domain:
 *   Health, Commands, System, Windows/Apps, Files, Desktop, Input,
 *   Memory, Automation, WhatsApp, Settings, Notifications, Sync,
 *   Context, Media/OCR/Image/PDF.
 */

import { API_BASE_URL, API_KEY } from '@/config';
import type {
  // Health
  HealthCheckResponse,
  // Commands
  CommandResult,
  CommandRequest,
  BaseResponse,
  PendingConfirmationsResponse,
  // System
  SystemStatus,
  BatteryResponse,
  VolumeResponse,
  TimeResponse,
  DateResponse,
  UptimeResponse,
  NetworkInfoResponse,
  WeatherResponse,
  WebSearchResponse,
  PerformanceHistoryResponse,
  PersonalitiesListResponse,
  SetPersonalityResponse,
  CommandInsightsResponse,
  ProcessListResponse,
  NetworkScanResponse,
  QuarantineResponse,
  // Windows
  WindowListResponse,
  AppListResponse,
  // Files
  FileListResponse,
  FileInfoResponse,
  // Desktop
  ScreenshotResponse,
  ClipboardTextResponse,
  // Input
  CursorResponse,
  // Memory
  ConversationListResponse,
  MemoryStatsResponse,
  FactListResponse,
  MemoryNodeListResponse,
  MemoryNodeResponse,
  // Automation
  AutomationStatusResponse,
  TaskListResponse,
  MacroListResponse,
  AutomationTask,
  AutomationMacro,
  // WhatsApp
  WhatsAppStatusResponse,
  WhatsAppContactListResponse,
  WhatsAppDraftResponse,
  // Settings
  SettingsResponse,
  ApiKeyStatusResponse,
  JarvisSettings,
  ApiKeyUpdatePayload,
  KeyTestResponse,
  // Notifications
  NotificationResponse,
  // Sync
  SyncStatusResponse,
  PairedDevicesResponse,
  DevicePairingResponse,
  // Context
  SuggestionResponse,
  QuickActionListResponse,
  QuickAction,
  // Media / OCR
  OCRResultResponse,
  // Agent
  AgentChatResponse,
  AgentRagResponse,
  AgentHealthResponse,
  // Other
  PairingCodeResponse,
  NotificationRequest,
} from '@/types/api';

// ============================================================================
// Error helpers
// ============================================================================

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function buildUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/+$/, '');
  // Ensure we use /api/v1 prefix
  if (path.startsWith('/api/v1/')) {
    return `${base}${path}`;
  } else if (path.startsWith('/')) {
    return `${base}/api/v1${path}`;
  }
  return `${base}/api/v1/${path}`;
}

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (API_KEY) {
    headers['X-API-Key'] = API_KEY;
  }
  return headers;
}

// ============================================================================
// ApiClient Class
// ============================================================================

class ApiClient {
  constructor(_baseUrl: string = API_BASE_URL) {
    // baseUrl is used via the buildUrl helper
    void _baseUrl;
  }

  // ------------------------------------------------------------------------
  // Generic HTTP methods
  // ------------------------------------------------------------------------

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    let url = buildUrl(path);
    if (params) {
      const search = new URLSearchParams(params).toString();
      if (search) url += `?${search}`;
    }
    const response = await fetch(url, { headers: getHeaders() });
    return this.handleResponse<T>(response, path, 'GET');
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const url = buildUrl(path);
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(response, path, 'POST');
  }

  /** POST with query parameters (for backend endpoints that use simple params, not Body()) */
  async postWithParams<T>(path: string, params?: Record<string, string | number | boolean | undefined | null>): Promise<T> {
    let url = buildUrl(path);
    if (params) {
      const filtered: Record<string, string> = {};
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) {
          filtered[k] = String(v);
        }
      }
      const search = new URLSearchParams(filtered).toString();
      if (search) url += `?${search}`;
    }
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
    });
    return this.handleResponse<T>(response, path, 'POST');
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const url = buildUrl(path);
    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(response, path, 'PUT');
  }

  async delete<T>(path: string): Promise<T> {
    const url = buildUrl(path);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return this.handleResponse<T>(response, path, 'DELETE');
  }

  /** Safe request wrapper — returns null on error instead of throwing */
  async safeRequest<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      console.error('[ApiClient] Safe request error:', error);
      return null;
    }
  }

  // ------------------------------------------------------------------------
  // Response handling with retry for 429
  // ------------------------------------------------------------------------

  private async handleResponse<T>(response: Response, path: string, method: string = 'GET'): Promise<T> {
    if (response.status === 429) {
      // Rate limited — retry with exponential backoff up to 3 times
      const body = method !== 'GET' ? await response.text().catch(() => undefined) : undefined;
      return this.retryWithBackoff<T>(() =>
        fetch(buildUrl(path), {
          method,
          headers: getHeaders(),
          body,
        }).then((r) => this.handleResponseRaw<T>(r)),
      );
    }
    return this.handleResponseRaw<T>(response);
  }

  private async handleResponseRaw<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData: unknown = null;
      try {
        errorData = await response.json();
      } catch {
        // ignore parse error
      }
      const message =
        (errorData as Record<string, unknown>)?.detail as string ??
        (errorData as Record<string, unknown>)?.error as string ??
        `HTTP ${response.status}`;
      throw new ApiError(response.status, message, errorData);
    }
    return response.json() as Promise<T>;
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000,
  ): Promise<T> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < maxRetries - 1) {
          const delay = Math.min(baseDelay * Math.pow(2, attempt), 10000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError ?? new Error('Retry failed');
  }

  // ========================================================================
  // Health & Probes
  // ========================================================================

  healthCheck = () => this.get<HealthCheckResponse>('/health');

  readinessProbe = () => this.get<{ status: string }>('/ready');

  livenessProbe = () => this.get<{ status: string }>('/live');

  // ========================================================================
  // Commands
  // ========================================================================

  executeCommand = (command: string, language: string = 'en') =>
    this.post<CommandResult>('/command', { command, language } as CommandRequest);

  confirmCommand = (confirmationId: string, approved: boolean) =>
    this.post<BaseResponse>(`/confirm/${confirmationId}`, { approved });

  getPendingConfirmations = () =>
    this.get<PendingConfirmationsResponse>('/pending');

  // ========================================================================
  // Agent
  // ========================================================================

  agentChat = (query: string, language?: string, useRag?: boolean) =>
    this.post<AgentChatResponse>('/agent/chat', { query, language, use_rag: useRag });

  agentRagSearch = (query: string) =>
    this.post<AgentRagResponse>('/agent/rag', { query });

  agentHealth = () => this.get<AgentHealthResponse>('/agent/health');

  // ========================================================================
  // System
  // ========================================================================

  getSystemStatus = () => this.get<SystemStatus>('/system/status');

  getBattery = (language?: string) =>
    this.get<BatteryResponse>('/system/battery', language ? { language } : undefined);

  getTime = (language?: string) =>
    this.get<TimeResponse>('/system/time', language ? { language } : undefined);

  getDate = (language?: string) =>
    this.get<DateResponse>('/system/date', language ? { language } : undefined);

  getUptime = (language?: string) =>
    this.get<UptimeResponse>('/system/uptime', language ? { language } : undefined);

  getNetworkInfo = (language?: string) =>
    this.get<NetworkInfoResponse>('/system/network', language ? { language } : undefined);

  getWeather = (city: string, language?: string) =>
    this.get<WeatherResponse>('/system/weather', { city, ...(language ? { language } : {}) });

  webSearch = (query: string, language?: string) =>
    this.postWithParams<WebSearchResponse>('/system/search', { query, language });

  getPerformanceHistory = (limit?: number) =>
    this.get<PerformanceHistoryResponse>('/system/performance/history', limit ? { limit: String(limit) } : undefined);

  getPersonalities = () =>
    this.get<PersonalitiesListResponse>('/system/personalities');

  setPersonality = (personalityId: string) =>
    this.post<SetPersonalityResponse>(`/system/personality/${personalityId}`);

  getCommandInsights = (days?: number) =>
    this.get<CommandInsightsResponse>('/system/command-insights', days ? { days: String(days) } : undefined);

  getRunningProcesses = () =>
    this.get<ProcessListResponse>('/system/security/processes');

  getNetworkScan = () =>
    this.get<NetworkScanResponse>('/system/security/connections');

  quarantineProcess = (pid: number, action: 'suspend' | 'resume' | 'terminate') =>
    this.postWithParams<QuarantineResponse>('/system/security/quarantine', { pid, action });

  shutdownComputer = (confirmed?: boolean, language?: string) =>
    this.postWithParams<BaseResponse>('/system/shutdown', { confirmed, language });

  restartComputer = (confirmed?: boolean, language?: string) =>
    this.postWithParams<BaseResponse>('/system/restart', { confirmed, language });

  sleepComputer = (confirmed?: boolean, language?: string) =>
    this.postWithParams<BaseResponse>('/system/sleep', { confirmed, language });

  volumeUp = (amount?: number, language?: string) =>
    this.postWithParams<VolumeResponse>('/system/volume/up', { amount, language });

  volumeDown = (amount?: number, language?: string) =>
    this.postWithParams<VolumeResponse>('/system/volume/down', { amount, language });

  toggleMute = (language?: string) =>
    this.postWithParams<BaseResponse>('/system/mute', { language });

  // ========================================================================
  // Windows & Apps
  // ========================================================================

  getWindows = () => this.get<WindowListResponse>('/windows/list');

  getApps = () => this.get<AppListResponse>('/apps/list');

  openApp = (appName: string, language?: string) =>
    this.postWithParams<BaseResponse>('/apps/open', { app_name: appName, language });

  closeApp = (appName: string, confirmed?: boolean, language?: string) =>
    this.postWithParams<BaseResponse>('/apps/close', { app_name: appName, confirmed, language });

  minimizeWindow = (title?: string, language?: string) =>
    this.postWithParams<BaseResponse>('/windows/minimize', { title, language });

  maximizeWindow = (title?: string, language?: string) =>
    this.postWithParams<BaseResponse>('/windows/maximize', { title, language });

  restoreWindow = (title?: string, language?: string) =>
    this.postWithParams<BaseResponse>('/windows/restore', { title, language });

  activateWindow = (title: string, language?: string) =>
    this.postWithParams<BaseResponse>('/windows/activate', { title, language });

  // ========================================================================
  // Files
  // ========================================================================

  listFiles = (folder: string, pattern?: string) =>
    this.get<FileListResponse>('/files/list', { folder, ...(pattern ? { pattern } : {}) });

  searchFiles = (search: string, folder?: string, language?: string) =>
    this.postWithParams<FileListResponse>('/files/search', { search, folder, language });

  openFolder = (folder: string, language?: string) =>
    this.postWithParams<BaseResponse>('/files/open', { folder, language });

  createFolder = (name: string, parent: string, language?: string) =>
    this.postWithParams<BaseResponse>('/files/create', { name, parent, language });

  deleteFile = (path: string, confirmed?: boolean, language?: string) =>
    this.postWithParams<BaseResponse>('/files/delete', { path, confirmed, language });

  copyFile = (source: string, destination: string, language?: string) =>
    this.postWithParams<BaseResponse>('/files/copy', { source, destination, language });

  moveFile = (source: string, destination: string, language?: string) =>
    this.postWithParams<BaseResponse>('/files/move', { source, destination, language });

  renameFile = (oldPath: string, newName: string, language?: string) =>
    this.postWithParams<BaseResponse>('/files/rename', { old_path: oldPath, new_name: newName, language });

  getFileInfo = (path: string) =>
    this.get<FileInfoResponse>('/files/info', { path });

  // ========================================================================
  // Desktop
  // ========================================================================

  takeScreenshot = (save?: boolean, language?: string) =>
    this.get<ScreenshotResponse>('/desktop/screenshot', {
      ...(save !== undefined ? { save: String(save) } : {}),
      ...(language ? { language } : {}),
    });

  takeRegionScreenshot = (x1: number, y1: number, x2: number, y2: number, language?: string) =>
    this.postWithParams<ScreenshotResponse>('/desktop/screenshot/region', {
      x: x1,
      y: y1,
      width: x2 - x1,
      height: y2 - y1,
      language,
    });

  readClipboard = () =>
    this.get<ClipboardTextResponse>('/desktop/clipboard/text');

  setClipboard = (text: string) =>
    this.post<BaseResponse>('/desktop/clipboard/text', { text });

  clearClipboard = () =>
    this.delete<BaseResponse>('/desktop/clipboard');

  mediaPlayPause = (language?: string) =>
    this.postWithParams<BaseResponse>('/desktop/media/play', { language });

  mediaNext = (language?: string) =>
    this.postWithParams<BaseResponse>('/desktop/media/next', { language });

  mediaPrevious = (language?: string) =>
    this.postWithParams<BaseResponse>('/desktop/media/previous', { language });

  mediaStop = (language?: string) =>
    this.postWithParams<BaseResponse>('/desktop/media/stop', { language });

  changeWallpaper = (imagePath: string) =>
    this.post<BaseResponse>('/desktop/wallpaper', { image_path: imagePath });

  zoomScreen = (level: number) =>
    this.post<BaseResponse>('/desktop/zoom', { level });

  // ========================================================================
  // Input Control
  // ========================================================================

  getCursorPosition = () =>
    this.get<CursorResponse>('/input/cursor');

  moveCursor = (x: number, y: number) =>
    this.postWithParams<BaseResponse>('/input/move', { x, y });

  mouseClick = (button: 'left' | 'right' | 'middle') =>
    this.postWithParams<BaseResponse>('/input/click', { button });

  doubleClick = () =>
    this.postWithParams<BaseResponse>('/input/double_click');

  rightClick = () =>
    this.postWithParams<BaseResponse>('/input/right_click');

  typeText = (text: string) =>
    this.post<BaseResponse>('/input/type', { text });

  pressKey = (key: string) =>
    this.post<BaseResponse>('/input/press', { key });

  scrollWheel = (amount: number) =>
    this.post<BaseResponse>('/input/scroll', { amount });

  dragMouse = (startX: number, startY: number, endX: number, endY: number) =>
    this.post<BaseResponse>('/input/drag', { start_x: startX, start_y: startY, end_x: endX, end_y: endY });

  sendShortcut = (keys: string[]) =>
    this.post<BaseResponse>('/input/shortcut', { keys });

  // ========================================================================
  // Memory
  // ========================================================================

  getConversations = (limit?: number, sessionId?: string) =>
    this.get<ConversationListResponse>('/memory/conversations', {
      ...(limit !== undefined ? { limit: String(limit) } : {}),
      ...(sessionId ? { session_id: sessionId } : {}),
    });

  saveConversation = (convData: {
    user_input: string;
    jarvis_response: string;
    command_type: string;
    success?: boolean;
    language?: string;
    session_id?: string;
  }) => this.post<BaseResponse>('/memory/conversation', convData);

  getMemoryStats = (days?: number) =>
    this.get<MemoryStatsResponse>('/memory/stats', days ? { days: String(days) } : undefined);

  clearConversationHistory = () =>
    this.delete<BaseResponse>('/memory/conversations');

  getMemoryFacts = (category?: string) =>
    this.get<FactListResponse>('/memory/facts', category ? { category } : undefined);

  createMemoryFact = (key: string, value: string, category?: string) =>
    this.post<BaseResponse>('/memory/fact', { key, value, category });

  updateMemoryFact = (factId: number, value: string) =>
    this.put<BaseResponse>(`/memory/fact/${factId}`, { value });

  deleteMemoryFact = (factId: number) =>
    this.delete<BaseResponse>(`/memory/fact/${factId}`);

  getMemoryNodes = () =>
    this.get<MemoryNodeListResponse>('/memory/nodes');

  getMemoryNodeContent = (name: string) =>
    this.get<MemoryNodeResponse>(`/memory/nodes/${encodeURIComponent(name)}`);

  updateMemoryNode = (name: string, content: string) =>
    this.put<BaseResponse>(`/memory/nodes/${encodeURIComponent(name)}`, { content });

  // ========================================================================
  // Automation
  // ========================================================================

  getAutomationStatus = () =>
    this.get<AutomationStatusResponse>('/automation/status');

  getTasks = () =>
    this.get<TaskListResponse>('/automation/tasks');

  createTask = (task: Partial<AutomationTask>) =>
    this.post<BaseResponse>('/automation/task', task);

  toggleTask = (taskId: string) =>
    this.post<BaseResponse>(`/automation/task/${taskId}/toggle`);

  deleteTask = (taskId: string) =>
    this.delete<BaseResponse>(`/automation/task/${taskId}`);

  getMacros = () =>
    this.get<MacroListResponse>('/automation/macros');

  createMacro = (macro: Partial<AutomationMacro>) =>
    this.post<BaseResponse>('/automation/macro', macro);

  runMacro = (macroId: string) =>
    this.post<BaseResponse>(`/automation/macro/${macroId}/run`);

  // ========================================================================
  // WhatsApp
  // ========================================================================

  openWhatsApp = (language?: string) =>
    this.postWithParams<BaseResponse>('/whatsapp/open', { language });

  getWhatsAppStatus = () =>
    this.get<WhatsAppStatusResponse>('/whatsapp/status');

  draftWhatsAppReply = (language?: string) =>
    this.postWithParams<WhatsAppDraftResponse>('/whatsapp/draft_reply', { language });

  sendWhatsAppMessage = (contact: string, message: string, language?: string) =>
    this.post<BaseResponse>('/whatsapp/send', { contact, message, language });

  callContact = (contact: string, video?: boolean) =>
    this.post<BaseResponse>('/whatsapp/call', { contact, video });

  getWhatsAppContacts = () =>
    this.get<WhatsAppContactListResponse>('/whatsapp/contacts');

  // ========================================================================
  // Settings
  // ========================================================================

  getSettings = () =>
    this.get<SettingsResponse>('/settings');

  updateSettings = (settings: Partial<JarvisSettings>) =>
    this.post<SettingsResponse>('/settings', settings);

  getApiKeyStatus = () =>
    this.get<ApiKeyStatusResponse>('/settings/keys');

  updateApiKeys = (keys: ApiKeyUpdatePayload) =>
    this.post<BaseResponse>('/settings/keys', keys);

  testApiKey = (provider: string, apiKey: string) =>
    this.post<KeyTestResponse>('/settings/test-key', { provider, api_key: apiKey });

  // ========================================================================
  // Notifications
  // ========================================================================

  broadcastNotification = (title: string, message: string, type?: string, duration?: number) =>
    this.post<NotificationResponse>('/notifications', {
      title,
      message,
      type: type ?? 'info',
      duration: duration ?? 5000,
    } as NotificationRequest);

  // ========================================================================
  // Sync & Pairing
  // ========================================================================

  getPairingCode = () =>
    this.get<PairingCodeResponse>('/sync/pairing-code');

  pairDevice = (payload: { pairing_code: string; device_name: string; device_type?: string }) =>
    this.post<DevicePairingResponse>('/sync/pair', payload);

  getPairedDevices = () =>
    this.get<PairedDevicesResponse>('/sync/devices');

  unpairDevice = (deviceId: string) =>
    this.delete<BaseResponse>(`/sync/devices/${deviceId}`);

  getSyncStatus = () =>
    this.get<SyncStatusResponse>('/sync/status');

  // ========================================================================
  // Context
  // ========================================================================

  getSuggestion = (language?: string) =>
    this.get<SuggestionResponse>('/context/suggestion', language ? { language } : undefined);

  getQuickActions = () =>
    this.get<QuickActionListResponse>('/context/quick-actions');

  updateQuickActions = (actions: QuickAction[]) =>
    this.post<BaseResponse>('/context/quick-actions', actions);

  // ========================================================================
  // Media / OCR
  // ========================================================================

  ocrImage = (imagePath: string, language?: string) =>
    this.postWithParams<OCRResultResponse>('/media/ocr/image', { image_path: imagePath, language });

  ocrPdf = (pdfPath: string, pageNumber?: number, language?: string) =>
    this.postWithParams<OCRResultResponse>('/media/ocr/pdf', { pdf_path: pdfPath, page_number: pageNumber, language });

  ocrScreen = (language?: string) =>
    this.postWithParams<OCRResultResponse>('/media/ocr/screen', { language });

  // ========================================================================
  // Image Tools
  // ========================================================================

  convertImage = (imagePath: string, targetFormat: string, outputPath?: string) =>
    this.post<BaseResponse>('/image/convert', {
      image_path: imagePath,
      target_format: targetFormat,
      output_path: outputPath,
    });

  resizeImage = (imagePath: string, width: number, height: number, outputPath?: string) =>
    this.post<BaseResponse>('/image/resize', {
      image_path: imagePath,
      width,
      height,
      output_path: outputPath,
    });

  compressImage = (imagePath: string, quality?: number, outputPath?: string) =>
    this.post<BaseResponse>('/image/compress', {
      image_path: imagePath,
      quality: quality ?? 85,
      output_path: outputPath,
    });

  // ========================================================================
  // PDF Tools
  // ========================================================================

  mergePdfs = (files: string[], output: string) =>
    this.post<BaseResponse>('/pdf/merge', { files, output });

  splitPdf = (pdfPath: string, pages: number[], output: string) =>
    this.post<BaseResponse>('/pdf/split', { pdf_path: pdfPath, pages, output });

  pdfToImages = (pdfPath: string, outputFolder: string, dpi?: number) =>
    this.post<BaseResponse>('/pdf/to-images', {
      pdf_path: pdfPath,
      output_folder: outputFolder,
      dpi: dpi ?? 200,
    });

  imagesToPdf = (images: string[], output: string) =>
    this.post<BaseResponse>('/pdf/from-images', { images, output });
}

// ============================================================================
// Singleton Export
// ============================================================================

export const apiClient = new ApiClient();
