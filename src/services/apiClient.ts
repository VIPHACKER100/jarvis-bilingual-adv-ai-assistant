import { SystemStatus, CommandResponse, CommandRequest } from '../types';
import { API_BASE_URL } from '../config';
import type {
  HealthCheckResponse,
  PerformanceHistoryResponse,
  CommandInsightsResponse,
  ConversationListResponse,
  ConversationEntry as ConversationEntryApi,
  ConversationSaveResponse,
  MemoryStatsResponse,
  FactListResponse,
  FactCreateResponse,
  FactUpdateResponse,
  FactDeleteResponse,
  MemoryNodeListResponse,
  MemoryNodeContentResponse,
  MemoryNodeUpdateResponse,
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

  async get<T = unknown>(path: string): Promise<{ data: T; status: number }> {
    const response = await fetch(`${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error(`GET ${path} failed`);
    return { data: await response.json(), status: response.status };
  }

  async post<T = unknown>(path: string, body: unknown): Promise<{ data: T; status: number }> {
    const response = await fetch(`${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`POST ${path} failed`);
    return { data: await response.json(), status: response.status };
  }

  async put<T = unknown>(path: string, body: unknown): Promise<{ data: T; status: number }> {
    const response = await fetch(`${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`PUT ${path} failed`);
    return { data: await response.json(), status: response.status };
  }

  async delete<T = unknown>(path: string): Promise<{ data: T; status: number }> {
    const response = await fetch(`${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error(`DELETE ${path} failed`);
    return { data: await response.json(), status: response.status };
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

  // Get performance history
  async getPerformanceHistory(limit: number = 60): Promise<PerformanceHistoryResponse> {
    const response = await fetch(`${this.baseUrl}/system/performance/history?limit=${limit}`, {
      headers: this.getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to get performance history');
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

  // Get command insights
  async getCommandInsights(days: number = 30): Promise<CommandInsightsResponse> {
    const response = await fetch(`${this.baseUrl}/system/command-insights?days=${days}`, {
      headers: this.getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to get command insights');
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
    const response = await fetch(`${this.baseUrl}/notifications/broadcast`, {
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
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };
