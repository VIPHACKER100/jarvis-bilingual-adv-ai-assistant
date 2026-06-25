import { SystemStatus, CommandResponse } from '../types';
import { API_BASE_URL } from '../config';
import type {
  HealthCheckResponse,
  ConversationListResponse,
  ConversationEntry as ConversationEntryApi,
  ConversationSaveResponse,
  MemoryStatsResponse,
  FactListResponse,
  FactCreateResponse,
  FactUpdateResponse,
  FactDeleteResponse,
  MemoryNodeListResponse,

  AutomationStatusResponse,
  TaskListResponse,
  TaskCreateResponse,
  AutomationTask,
  MacroListResponse,
  MacroCreateResponse,
  AutomationMacro,
  WhatsAppStatusResponse,
  WhatsAppSendResponse,
  WhatsAppDraftResponse,
  WhatsAppContactsResponse,
  ProcessListResponse,
  NetworkScanResponse,
  QuarantineResponse,
  BroadcastNotificationResponse,
  SettingsResponse,
  SettingsUpdateResponse,
  ApiKeyUpdatePayload,
  ApiKeyUpdateResponse,
  SuccessResponse,
  QuickAction,
  QuickActionListResponse,
  SuggestionResponse,
  PairedDevicesResponse,
} from '../types/api';

const API_KEY = import.meta.env.VITE_JARVIS_API_KEY || "";

class ApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.apiKey = API_KEY;
  }

  private getHeaders(contentType: string = 'application/json'): HeadersInit {
    const headers: HeadersInit = {
      'X-API-Key': this.apiKey,
    };
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    return headers;
  }

  // --- Generic REST Methods ---

  async get<T = unknown>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error(`GET ${path} failed`);
    return response.json();
  }

  async post<T = unknown>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`POST ${path} failed`);
    return response.json();
  }

  async put<T = unknown>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`PUT ${path} failed`);
    return response.json();
  }

  async delete<T = unknown>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error(`DELETE ${path} failed`);
    return response.json();
  }

  // Health check
  async healthCheck(): Promise<HealthCheckResponse> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error('Backend not available');
    }
    return response.json();
  }

  // Get system status
  async getSystemStatus(): Promise<SystemStatus> {
    const response = await fetch(`${this.baseUrl}/system/status`, {
      headers: this.getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to get system status');
    }
    return response.json();
  }

  // Execute command
  async executeCommand(command: string, language: 'en' | 'hi' = 'en'): Promise<CommandResponse> {
    const response = await fetch(`${this.baseUrl}/command`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        command,
        language,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Command execution failed');
    }

    return response.json();
  }

  // Confirm dangerous command
  async confirmCommand(confirmationId: string, approved: boolean): Promise<{
    success: boolean;
    approved: boolean;
    result?: Record<string, unknown>;
    message?: string;
  }> {
    const response = await fetch(`${this.baseUrl}/confirm/${confirmationId}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ approved }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Confirmation failed');
    }

    return response.json();
  }

  // Get conversation history
  async getConversations(limit: number = 50, session_id?: string): Promise<ConversationListResponse> {
    const url = new URL(`${this.baseUrl}/memory/conversations`);
    url.searchParams.append('limit', limit.toString());
    if (session_id) {
      url.searchParams.append('session_id', session_id);
    }

    const response = await fetch(url.toString(), {
      headers: this.getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to get conversations');
    }
    return response.json();
  }

  // Get memory stats
  async getMemoryStats(days: number = 7): Promise<MemoryStatsResponse> {
    const response = await fetch(`${this.baseUrl}/memory/stats?days=${days}`, {
      headers: this.getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to get memory stats');
    }
    return response.json();
  }

  // Save conversation (optional, usually done by backend, but useful for manual additions)
  async saveConversation(convData: Partial<ConversationEntryApi>): Promise<ConversationSaveResponse> {
    const response = await fetch(`${this.baseUrl}/memory/conversation`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(convData),
    });

    if (!response.ok) {
      throw new Error('Failed to save conversation');
    }
    return response.json();
  }

  // Get user facts/memories
  async getMemoryFacts(category?: string): Promise<FactListResponse> {
    const url = new URL(`${this.baseUrl}/memory/facts`);
    if (category) {
      url.searchParams.append('category', category);
    }

    const response = await fetch(url.toString(), {
      headers: this.getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to get memory facts');
    }
    return response.json();
  }

  // Create a user fact/memory
  async createMemoryFact(key: string, value: string, category: string = 'personal'): Promise<FactCreateResponse> {
    const response = await fetch(`${this.baseUrl}/memory/fact`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ key, value, category }),
    });

    if (!response.ok) {
      throw new Error('Failed to create memory fact');
    }
    return response.json();
  }

  // Update a user fact/memory
  async updateMemoryFact(factId: number, value: string): Promise<FactUpdateResponse> {
    const response = await fetch(`${this.baseUrl}/memory/fact/${factId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ value }),
    });
    if (!response.ok) {
      throw new Error('Failed to update memory fact');
    }
    return response.json();
  }

  // Delete a user fact/memory
  async deleteMemoryFact(factId: number): Promise<FactDeleteResponse> {
    const response = await fetch(`${this.baseUrl}/memory/fact/${factId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to delete memory fact');
    }
    return response.json();
  }

  // Clear conversation history
  async clearConversationHistory(): Promise<SuccessResponse> {
    const response = await fetch(`${this.baseUrl}/memory/conversations`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to clear conversation history');
    }
    return response.json();
  }

  // --- Neural Memory (Markdown Nodes) ---

  // Get all memory nodes
  async getMemoryNodes(): Promise<MemoryNodeListResponse> {
    const response = await fetch(`${this.baseUrl}/memory/nodes`, {
      headers: this.getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to get memory nodes');
    }
    return response.json();
  }

  // Get content of a specific node
  async getMemoryNodeContent(name: string): Promise<{
    success: boolean;
    name: string;
    content: string;
  }> {
    const response = await fetch(`${this.baseUrl}/memory/nodes/${name}`, {
      headers: this.getHeaders()
    });
    if (!response.ok) {
      throw new Error(`Failed to get memory node content for ${name}`);
    }
    return response.json();
  }

  // Update content of a specific node
  async updateMemoryNode(name: string, content: string): Promise<{
    success: boolean;
    response: string;
  }> {
    const response = await fetch(`${this.baseUrl}/memory/nodes/${name}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ content }),
    });
    if (!response.ok) {
      throw new Error(`Failed to update memory node ${name}`);
    }
    return response.json();
  }


  // Get automation status
  async getAutomationStatus(): Promise<AutomationStatusResponse> {
    const response = await fetch(`${this.baseUrl}/automation/status`, {
      headers: this.getHeaders()
    });
    return response.json();
  }

  // Get all tasks
  async getTasks(): Promise<TaskListResponse> {
    const response = await fetch(`${this.baseUrl}/automation/tasks`, {
      headers: this.getHeaders()
    });
    return response.json();
  }

  // Create task
  async createTask(task: Partial<AutomationTask>): Promise<TaskCreateResponse> {
    const response = await fetch(`${this.baseUrl}/automation/task`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(task)
    });
    return response.json();
  }

  // Toggle task
  async toggleTask(taskId: string): Promise<SuccessResponse> {
    const response = await fetch(`${this.baseUrl}/automation/task/${taskId}/toggle`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    return response.json();
  }

  // Delete task
  async deleteTask(taskId: string): Promise<SuccessResponse> {
    const response = await fetch(`${this.baseUrl}/automation/task/${taskId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return response.json();
  }

  // Get all macros
  async getMacros(): Promise<MacroListResponse> {
    const response = await fetch(`${this.baseUrl}/automation/macros`, {
      headers: this.getHeaders()
    });
    return response.json();
  }

  // Create macro
  async createMacro(macro: Partial<AutomationMacro>): Promise<MacroCreateResponse> {
    const response = await fetch(`${this.baseUrl}/automation/macro`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(macro)
    });
    return response.json();
  }

  // Run macro
  async runMacro(macroId: string): Promise<SuccessResponse> {
    const response = await fetch(`${this.baseUrl}/automation/macro/${macroId}/run`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    return response.json();
  }

  // Toggle macro
  async toggleMacro(macroId: string): Promise<SuccessResponse> {
    const response = await fetch(`${this.baseUrl}/automation/macro/${macroId}/toggle`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    return response.json();
  }

  // Delete macro
  async deleteMacro(macroId: string): Promise<SuccessResponse> {
    const response = await fetch(`${this.baseUrl}/automation/macro/${macroId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return response.json();
  }

  // --- WhatsApp ---

  /** Check WhatsApp Desktop status */
  async getWhatsAppStatus(): Promise<WhatsAppStatusResponse> {
    const response = await fetch(`${this.baseUrl}/whatsapp/status`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to get WhatsApp status');
    return response.json();
  }

  /** Send a WhatsApp message */
  async sendWhatsAppMessage(contact: string, message: string, language: 'en' | 'hi' = 'en'): Promise<WhatsAppSendResponse> {
    const response = await fetch(`${this.baseUrl}/whatsapp/send`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ contact, message, language })
    });
    if (!response.ok) throw new Error('Failed to send WhatsApp message');
    return response.json();
  }

  /** Draft a context-aware reply from the active WhatsApp screen (OCR-powered) */
  async draftWhatsAppReply(language: 'en' | 'hi' = 'en'): Promise<WhatsAppDraftResponse> {
    const response = await fetch(`${this.baseUrl}/whatsapp/draft_reply?language=${language}`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to draft WhatsApp reply');
    return response.json();
  }

  /** Get list of known WhatsApp contacts */
  async getWhatsAppContacts(): Promise<WhatsAppContactsResponse> {
    const response = await fetch(`${this.baseUrl}/whatsapp/contacts`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to get WhatsApp contacts');
    return response.json();
  }

  // --- Security & Process Guardian ---

  /** Get all running processes */
  async getRunningProcesses(): Promise<ProcessListResponse> {
    const response = await fetch(`${this.baseUrl}/system/security/processes`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to get running processes');
    return response.json();
  }

  /** Get deep network connection scan */
  async getNetworkScan(): Promise<NetworkScanResponse> {
    const response = await fetch(`${this.baseUrl}/system/security/connections`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to perform network scan');
    return response.json();
  }

  /** Quarantine (suspend/resume/terminate) a process by PID */
  async quarantineProcess(pid: number, action: 'suspend' | 'resume' | 'terminate' = 'suspend'): Promise<QuarantineResponse> {
    const response = await fetch(`${this.baseUrl}/system/security/quarantine?pid=${pid}&action=${action}`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error(`Failed to ${action} process ${pid}`);
    return response.json();
  }

  // --- Notifications ---

  /** Broadcast a notification to all connected WebSocket clients */
  async broadcastNotification(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration = 5000): Promise<BroadcastNotificationResponse> {
    const response = await fetch(`${this.baseUrl}/notifications`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ title, message, type, duration })
    });
    if (!response.ok) throw new Error('Failed to broadcast notification');
    return response.json();
  }

  // --- Settings ---

  /** Get current settings */
  async getSettings(): Promise<SettingsResponse> {
    const response = await fetch(`${this.baseUrl}/settings`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to get settings');
    return response.json();
  }

  /** Update settings */
  async updateSettings(settings: Partial<import('../types/api').JarvisSettings>): Promise<SettingsUpdateResponse> {
    const response = await fetch(`${this.baseUrl}/settings`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(settings)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update settings');
    }
    return response.json();
  }

  /** Update API keys */
  async updateApiKeys(keys: ApiKeyUpdatePayload): Promise<ApiKeyUpdateResponse> {
    const response = await fetch(`${this.baseUrl}/settings/keys`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(keys)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update API keys');
    }
    return response.json();
  }

  // --- Utility ---

  /**
   * Safe request wrapper — returns null on failure instead of throwing.
   * Use for non-critical background calls where errors should be silent.
   */
  async safeRequest<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch {
      return null;
    }
  }

  // --- Context & Quick Actions ---

  /** Get a context-aware proactive suggestion on demand */
  async getSuggestion(language: 'en' | 'hi' = 'en'): Promise<SuggestionResponse> {
    const response = await fetch(`${this.baseUrl}/context/suggestion?language=${language}`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to get suggestion');
    return response.json();
  }

  /** Get list of user-configured quick actions */
  async getQuickActions(): Promise<QuickActionListResponse> {
    const response = await fetch(`${this.baseUrl}/context/quick-actions`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to get quick actions');
    return response.json();
  }

  /** Update user-configured quick actions */
  async updateQuickActions(actions: QuickAction[]): Promise<SuccessResponse> {
    const response = await fetch(`${this.baseUrl}/context/quick-actions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(actions)
    });
    if (!response.ok) throw new Error('Failed to update quick actions');
    return response.json();
  }

  /** Get a new dynamic pairing code for mobile linking */
  async getPairingCode(): Promise<{
    success: boolean;
    code: string;
    expires_in: number;
  }> {
    const response = await fetch(`${this.baseUrl}/sync/pairing-code`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to get pairing code');
    return response.json();
  }

  /** Get list of all paired devices */
  async getPairedDevices(): Promise<PairedDevicesResponse> {
    const response = await fetch(`${this.baseUrl}/sync/devices`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to get paired devices');
    return response.json();
  }

  /** Unpair a mobile device */
  async unpairDevice(deviceId: string): Promise<SuccessResponse> {
    const response = await fetch(`${this.baseUrl}/sync/devices/${deviceId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to unpair device');
    return response.json();
  }

  // --- Neural Logs & Training ---

  /** Get high-density neural trace logs */
  async getNeuralLogs(limit: number = 100): Promise<import('../types/api').NeuralLogListResponse> {
    const response = await fetch(`${this.baseUrl}/system/neural/logs?limit=${limit}`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to get neural logs');
    return response.json();
  }

  /** Get all available voice profiles */
  async getVoiceProfiles(): Promise<import('../types/api').VoiceProfileListResponse> {
    const response = await fetch(`${this.baseUrl}/neural/voice/profiles`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to get voice profiles');
    return response.json();
  }

  /** Update voice profile parameters */
  async updateVoiceProfile(id: string, profile: Partial<import('../types/api').VoiceProfile>): Promise<SuccessResponse> {
    const response = await fetch(`${this.baseUrl}/neural/voice/profiles/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(profile)
    });
    if (!response.ok) throw new Error(`Failed to update voice profile ${id}`);
    return response.json();
  }

  /** Initiate neural training for a voice profile */
  async trainVoiceProfile(id: string): Promise<SuccessResponse> {
    const response = await fetch(`${this.baseUrl}/neural/voice/profiles/${id}/train`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error(`Failed to initiate training for profile ${id}`);
    return response.json();
  }

  // ─── Agent API (v4.0) ─────────────────────────────────────────────────────

  /** Non-streaming agent chat with optional RAG context */
  async agentChat(query: string, language: string = 'en', useRag: boolean = true): Promise<{
    success: boolean;
    response: string;
    provider: string;
    language: string;
    cost_stats: Record<string, number>;
  }> {
    const resp = await fetch(`${this.baseUrl}/agent/chat`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ query, language, stream: false, use_rag: useRag }),
    });
    if (!resp.ok) throw new Error('Agent chat failed');
    return resp.json();
  }

  /** Retrieve RAG context for a query */
  async agentRagSearch(query: string): Promise<{
    success: boolean;
    query: string;
    results: Array<{ node: string; score: number; match_type: string; excerpt: string }>;
    total_scanned: number;
  }> {
    const resp = await fetch(`${this.baseUrl}/agent/rag`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ query, stream: false, use_rag: true }),
    });
    if (!resp.ok) throw new Error('Agent RAG search failed');
    return resp.json();
  }

  /** Agent subsystem health */
  async agentHealth(): Promise<{
    success: boolean;
    online: boolean;
    active_provider: string | null;
    available_providers: string[];
    cost_stats: Record<string, number>;
  }> {
    const resp = await fetch(`${this.baseUrl}/agent/health`, {
      headers: this.getHeaders(),
    });
    if (!resp.ok) throw new Error('Agent health check failed');
    return resp.json();
  }

  // ── System Operations ───────────────────────────────────────────────────────

  /** Get battery info */
  async getBattery(language: string = 'en'): Promise<import('../types/api').BatteryResponse> {
    return this.get<import('../types/api').BatteryResponse>(`/system/battery?language=${language}`);
  }

  /** Get current time */
  async getTime(language: string = 'en'): Promise<import('../types/api').TimeResponse> {
    return this.get<import('../types/api').TimeResponse>(`/system/time?language=${language}`);
  }

  /** Get current date */
  async getDate(language: string = 'en'): Promise<import('../types/api').DateResponse> {
    return this.get<import('../types/api').DateResponse>(`/system/date?language=${language}`);
  }

  /** Shutdown computer — dangerous */
  async shutdownComputer(confirmed: boolean = false, language: string = 'en'): Promise<import('../types/api').DangerActionResponse> {
    return this.post<import('../types/api').DangerActionResponse>(`/system/shutdown?confirmed=${confirmed}&language=${language}`, {});
  }

  /** Restart computer — dangerous */
  async restartComputer(confirmed: boolean = false, language: string = 'en'): Promise<import('../types/api').DangerActionResponse> {
    return this.post<import('../types/api').DangerActionResponse>(`/system/restart?confirmed=${confirmed}&language=${language}`, {});
  }

  /** Sleep computer — dangerous */
  async sleepComputer(confirmed: boolean = false, language: string = 'en'): Promise<import('../types/api').DangerActionResponse> {
    return this.post<import('../types/api').DangerActionResponse>(`/system/sleep?confirmed=${confirmed}&language=${language}`, {});
  }

  /** Increase volume */
  async volumeUp(amount: number = 10, language: string = 'en'): Promise<import('../types/api').VolumeResponse> {
    return this.get<import('../types/api').VolumeResponse>(`/system/volume/up?amount=${amount}&language=${language}`);
  }

  /** Decrease volume */
  async volumeDown(amount: number = 10, language: string = 'en'): Promise<import('../types/api').VolumeResponse> {
    return this.get<import('../types/api').VolumeResponse>(`/system/volume/down?amount=${amount}&language=${language}`);
  }

  /** Toggle mute */
  async toggleMute(language: string = 'en'): Promise<import('../types/api').MuteResponse> {
    return this.post<import('../types/api').MuteResponse>(`/system/mute?language=${language}`, {});
  }

  /** Get system uptime */
  async getUptime(language: string = 'en'): Promise<import('../types/api').UptimeResponse> {
    return this.get<import('../types/api').UptimeResponse>(`/system/uptime?language=${language}`);
  }

  /** Get network info */
  async getNetworkInfo(language: string = 'en'): Promise<import('../types/api').NetworkResponse> {
    return this.get<import('../types/api').NetworkResponse>(`/system/network?language=${language}`);
  }

  /** Get weather */
  async getWeather(city: string, language: string = 'en'): Promise<import('../types/api').WeatherResponse> {
    return this.get<import('../types/api').WeatherResponse>(`/system/weather?city=${encodeURIComponent(city)}&language=${language}`);
  }

  /** Web search */
  async webSearch(query: string, language: string = 'en'): Promise<import('../types/api').WebSearchResponse> {
    return this.get<import('../types/api').WebSearchResponse>(`/system/search?query=${encodeURIComponent(query)}&language=${language}`);
  }

  /** Get performance history */
  async getPerformanceHistory(limit: number = 60): Promise<import('../types/api').PerformanceHistoryResponse> {
    return this.get<import('../types/api').PerformanceHistoryResponse>(`/system/performance/history?limit=${Math.min(Math.max(limit, 1), 1440)}`);
  }

  /** List all personalities */
  async getPersonalities(): Promise<import('../types/api').PersonalitiesListResponse> {
    return this.get<import('../types/api').PersonalitiesListResponse>('/system/personalities');
  }

  /** Set personality */
  async setPersonality(personalityId: string): Promise<import('../types/api').SetPersonalityResponse> {
    return this.post<import('../types/api').SetPersonalityResponse>(`/system/personality/${personalityId}`, {});
  }

  /** Get command usage insights */
  async getCommandInsights(days: number = 30): Promise<import('../types/api').CommandInsightsResponse> {
    return this.get<import('../types/api').CommandInsightsResponse>(`/system/command-insights?days=${Math.min(Math.max(days, 1), 365)}`);
  }

  // ── Windows & Apps ──────────────────────────────────────────────────────────

  /** List open windows */
  async getWindows(): Promise<import('../types/api').WindowListResponse> {
    return this.get<import('../types/api').WindowListResponse>('/windows/list');
  }

  /** List running apps */
  async getApps(): Promise<import('../types/api').AppListResponse> {
    return this.get<import('../types/api').AppListResponse>('/apps/list');
  }

  /** Open an app */
  async openApp(appName: string): Promise<import('../types/api').AppActionResponse> {
    return this.post<import('../types/api').AppActionResponse>('/apps/open', { app_name: appName });
  }

  /** Close an app — dangerous */
  async closeApp(appName: string, confirmed: boolean = false): Promise<import('../types/api').AppActionResponse> {
    return this.post<import('../types/api').AppActionResponse>(`/apps/close?confirmed=${confirmed}`, { app_name: appName });
  }

  /** Minimize window */
  async minimizeWindow(title: string): Promise<import('../types/api').WindowActionResponse> {
    return this.post<import('../types/api').WindowActionResponse>('/windows/minimize', { title });
  }

  /** Maximize window */
  async maximizeWindow(title: string): Promise<import('../types/api').WindowActionResponse> {
    return this.post<import('../types/api').WindowActionResponse>('/windows/maximize', { title });
  }

  /** Restore window */
  async restoreWindow(title: string): Promise<import('../types/api').WindowActionResponse> {
    return this.post<import('../types/api').WindowActionResponse>('/windows/restore', { title });
  }

  /** Activate/focus window */
  async activateWindow(title: string): Promise<import('../types/api').WindowActionResponse> {
    return this.post<import('../types/api').WindowActionResponse>('/windows/activate', { title });
  }

  // ── File Operations ─────────────────────────────────────────────────────────

  /** Open folder in explorer */
  async openFolder(folder: string): Promise<import('../types/api').FileOpenResponse> {
    return this.post<import('../types/api').FileOpenResponse>('/files/open', { folder });
  }

  /** List files in folder */
  async listFiles(folder: string, pattern?: string): Promise<import('../types/api').FileListResponse> {
    let path = `/files/list?folder=${encodeURIComponent(folder)}`;
    if (pattern) path += `&pattern=${encodeURIComponent(pattern)}`;
    return this.get<import('../types/api').FileListResponse>(path);
  }

  /** Search files */
  async searchFiles(search: string, folder?: string): Promise<import('../types/api').FileSearchResponse> {
    const body: Record<string, string> = { search };
    if (folder) body.folder = folder;
    return this.post<import('../types/api').FileSearchResponse>('/files/search', body);
  }

  /** Create folder */
  async createFolder(name: string, parent: string): Promise<import('../types/api').FileCreateResponse> {
    return this.post<import('../types/api').FileCreateResponse>('/files/create', { name, parent });
  }

  /** Delete file/folder — dangerous */
  async deleteFile(path: string, confirmed: boolean = false): Promise<import('../types/api').FileDeleteResponse> {
    return this.post<import('../types/api').FileDeleteResponse>(`/files/delete?confirmed=${confirmed}`, { path });
  }

  /** Copy file/folder */
  async copyFile(source: string, destination: string): Promise<import('../types/api').FileCopyResponse> {
    return this.post<import('../types/api').FileCopyResponse>('/files/copy', { source, destination });
  }

  /** Move file/folder */
  async moveFile(source: string, destination: string): Promise<import('../types/api').FileMoveResponse> {
    return this.post<import('../types/api').FileMoveResponse>('/files/move', { source, destination });
  }

  /** Rename file/folder */
  async renameFile(oldPath: string, newName: string): Promise<import('../types/api').FileRenameResponse> {
    return this.post<import('../types/api').FileRenameResponse>('/files/rename', { old_path: oldPath, new_name: newName });
  }

  /** Get file metadata */
  async getFileInfo(path: string): Promise<import('../types/api').FileInfoResponse> {
    return this.get<import('../types/api').FileInfoResponse>(`/files/info?path=${encodeURIComponent(path)}`);
  }

  // ── Desktop Operations ──────────────────────────────────────────────────────

  /** Take full screenshot */
  async takeScreenshot(save: boolean = false, language: string = 'en'): Promise<import('../types/api').ScreenshotResponse> {
    return this.get<import('../types/api').ScreenshotResponse>(`/desktop/screenshot?save=${save}&language=${language}`);
  }

  /** Take region screenshot */
  async takeRegionScreenshot(x1: number, y1: number, x2: number, y2: number): Promise<import('../types/api').ScreenshotResponse> {
    return this.post<import('../types/api').ScreenshotResponse>('/desktop/screenshot/region', { x1, y1, x2, y2 });
  }

  /** Read clipboard text */
  async readClipboard(): Promise<import('../types/api').ClipboardTextResponse> {
    return this.get<import('../types/api').ClipboardTextResponse>('/desktop/clipboard/text');
  }

  /** Set clipboard text */
  async setClipboard(text: string): Promise<import('../types/api').ClipboardSetResponse> {
    return this.post<import('../types/api').ClipboardSetResponse>('/desktop/clipboard/text', { text });
  }

  /** Clear clipboard */
  async clearClipboard(): Promise<import('../types/api').SuccessResponse> {
    return this.delete<import('../types/api').SuccessResponse>('/desktop/clipboard');
  }

  /** Toggle media play/pause */
  async mediaPlayPause(): Promise<import('../types/api').MediaPlaybackResponse> {
    return this.post<import('../types/api').MediaPlaybackResponse>('/desktop/media/play', {});
  }

  /** Next media track */
  async mediaNext(): Promise<import('../types/api').MediaPlaybackResponse> {
    return this.post<import('../types/api').MediaPlaybackResponse>('/desktop/media/next', {});
  }

  /** Previous media track */
  async mediaPrevious(): Promise<import('../types/api').MediaPlaybackResponse> {
    return this.post<import('../types/api').MediaPlaybackResponse>('/desktop/media/previous', {});
  }

  /** Stop media */
  async mediaStop(): Promise<import('../types/api').MediaPlaybackResponse> {
    return this.post<import('../types/api').MediaPlaybackResponse>('/desktop/media/stop', {});
  }

  /** Change wallpaper */
  async changeWallpaper(path: string): Promise<import('../types/api').WallpaperResponse> {
    return this.post<import('../types/api').WallpaperResponse>('/desktop/wallpaper', { path });
  }

  /** Zoom screen */
  async zoomScreen(level: number): Promise<import('../types/api').ZoomResponse> {
    return this.post<import('../types/api').ZoomResponse>('/desktop/zoom', { level });
  }

  // ── Input Simulation ────────────────────────────────────────────────────────

  /** Get cursor position */
  async getCursorPosition(): Promise<import('../types/api').CursorResponse> {
    return this.get<import('../types/api').CursorResponse>('/input/cursor');
  }

  /** Move cursor to position */
  async moveCursor(x: number, y: number): Promise<import('../types/api').InputActionResponse> {
    return this.post<import('../types/api').InputActionResponse>('/input/move', { x, y });
  }

  /** Mouse click */
  async mouseClick(button: 'left' | 'right' | 'middle' = 'left'): Promise<import('../types/api').InputActionResponse> {
    return this.post<import('../types/api').InputActionResponse>('/input/click', { button });
  }

  /** Double click */
  async doubleClick(): Promise<import('../types/api').InputActionResponse> {
    return this.post<import('../types/api').InputActionResponse>('/input/double_click', {});
  }

  /** Right click */
  async rightClick(): Promise<import('../types/api').InputActionResponse> {
    return this.post<import('../types/api').InputActionResponse>('/input/right_click', {});
  }

  /** Type text */
  async typeText(text: string): Promise<import('../types/api').TypeResponse> {
    return this.post<import('../types/api').TypeResponse>('/input/type', { text });
  }

  /** Press key */
  async pressKey(key: string): Promise<import('../types/api').InputActionResponse> {
    return this.post<import('../types/api').InputActionResponse>('/input/press', { key });
  }

  /** Scroll wheel */
  async scrollWheel(clicks: number): Promise<import('../types/api').InputActionResponse> {
    return this.post<import('../types/api').InputActionResponse>('/input/scroll', { clicks });
  }

  /** Drag mouse */
  async dragMouse(x: number, y: number): Promise<import('../types/api').InputActionResponse> {
    return this.post<import('../types/api').InputActionResponse>('/input/drag', { x, y });
  }

  /** Hotkey shortcut */
  async sendShortcut(keys: string[]): Promise<import('../types/api').InputActionResponse> {
    return this.post<import('../types/api').InputActionResponse>('/input/shortcut', { keys });
  }

  // ── OCR & Media Tools ───────────────────────────────────────────────────────

  /** OCR from image file */
  async ocrImage(imagePath: string, language?: string): Promise<import('../types/api').OcrResponse> {
    const body: Record<string, string> = { image_path: imagePath };
    if (language) body.language = language;
    return this.post<import('../types/api').OcrResponse>('/media/ocr/image', body);
  }

  /** OCR from PDF page */
  async ocrPdf(pdfPath: string, pageNumber: number = 1): Promise<import('../types/api').OcrPdfResponse> {
    return this.post<import('../types/api').OcrPdfResponse>('/media/ocr/pdf', { pdf_path: pdfPath, page_number: pageNumber });
  }

  /** OCR from screen capture */
  async ocrScreen(): Promise<import('../types/api').OcrResponse> {
    return this.post<import('../types/api').OcrResponse>('/media/ocr/screen', {});
  }

  // ── Image Tools ─────────────────────────────────────────────────────────────

  /** Convert image format */
  async convertImage(imagePath: string, format: string, outputPath?: string): Promise<import('../types/api').ImageConvertResponse> {
    return this.post<import('../types/api').ImageConvertResponse>('/image/convert', { image_path: imagePath, format, output_path: outputPath });
  }

  /** Resize image */
  async resizeImage(imagePath: string, width: number, height: number): Promise<import('../types/api').ImageTransformResponse> {
    return this.post<import('../types/api').ImageTransformResponse>('/image/resize', { image_path: imagePath, width, height });
  }

  /** Compress image */
  async compressImage(imagePath: string, quality: number = 80): Promise<import('../types/api').ImageTransformResponse> {
    return this.post<import('../types/api').ImageTransformResponse>('/image/compress', { image_path: imagePath, quality });
  }

  // ── PDF Tools ───────────────────────────────────────────────────────────────

  /** Merge PDFs */
  async mergePdfs(pdfPaths: string[], outputPath?: string): Promise<import('../types/api').PdfMergeResponse> {
    return this.post<import('../types/api').PdfMergeResponse>('/pdf/merge', { pdf_paths: pdfPaths, output_path: outputPath });
  }

  /** Split PDF */
  async splitPdf(pdfPath: string, outputFolder?: string): Promise<import('../types/api').PdfTransformResponse> {
    return this.post<import('../types/api').PdfTransformResponse>('/pdf/split', { pdf_path: pdfPath, output_folder: outputFolder });
  }

  /** PDF to images */
  async pdfToImages(pdfPath: string, outputFolder?: string): Promise<import('../types/api').PdfImagesResponse> {
    return this.post<import('../types/api').PdfImagesResponse>('/pdf/to-images', { pdf_path: pdfPath, output_folder: outputFolder });
  }

  /** Images to PDF */
  async imagesToPdf(imagePaths: string[], outputPath?: string): Promise<import('../types/api').PdfMergeResponse> {
    return this.post<import('../types/api').PdfMergeResponse>('/pdf/from-images', { image_paths: imagePaths, output_path: outputPath });
  }

  // ── Settings Extended ───────────────────────────────────────────────────────

  /** Get API key status (redacted) */
  async getApiKeyStatus(): Promise<import('../types/api').ApiKeyStatusResponse> {
    return this.get<import('../types/api').ApiKeyStatusResponse>('/settings/keys');
  }

  /** Test API key */
  async testApiKey(provider: string, apiKey: string): Promise<import('../types/api').TestKeyResponse> {
    return this.post<import('../types/api').TestKeyResponse>('/settings/test-key', { provider, api_key: apiKey });
  }

  // ── WhatsApp Extended ───────────────────────────────────────────────────────

  /** Open WhatsApp Desktop */
  async openWhatsApp(): Promise<import('../types/api').WhatsAppOpenResponse> {
    return this.post<import('../types/api').WhatsAppOpenResponse>('/whatsapp/open', {});
  }

  // ── Sync / Pairing Extended ─────────────────────────────────────────────────

  /** Pair a mobile device */
  async pairDevice(payload: import('../types/api').PairDevicePayload): Promise<import('../types/api').PairDeviceResponse> {
    return this.post<import('../types/api').PairDeviceResponse>('/sync/pair', payload);
  }

  /** Get sync status */
  async getSyncStatus(): Promise<import('../types/api').SyncStatusFullResponse> {
    return this.get<import('../types/api').SyncStatusFullResponse>('/sync/status');
  }

  // ── Context Extended ────────────────────────────────────────────────────────

  /** Get proactive suggestion from context router */
  async getProactiveSuggestion(language: string = 'en'): Promise<import('../types/api').ProactiveSuggestionResponse> {
    return this.get<import('../types/api').ProactiveSuggestionResponse>(`/context/suggestion?language=${language}`);
  }

  // ── Pending Confirmations ───────────────────────────────────────────────────

  /** List all pending confirmations */
  async getPendingConfirmations(): Promise<import('../types/api').PendingConfirmationsResponse> {
    return this.get<import('../types/api').PendingConfirmationsResponse>('/pending');
  }

  // ── Health / Probes ─────────────────────────────────────────────────────────

  /** Readiness probe (DB check) */
  async readinessProbe(): Promise<{ status: string }> {
    const resp = await fetch(`${this.baseUrl.replace('/api/v1', '')}/ready`);
    if (!resp.ok) throw new Error('Readiness check failed');
    return resp.json();
  }

  /** Liveness probe */
  async livenessProbe(): Promise<{ status: string }> {
    const resp = await fetch(`${this.baseUrl.replace('/api/v1', '')}/live`);
    return resp.json();
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };
