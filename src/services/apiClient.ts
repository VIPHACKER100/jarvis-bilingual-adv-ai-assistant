import { SystemStatus, CommandResponse, CommandRequest } from '../types';

const API_BASE_URL = 'http://localhost:8000';
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

  // Health check
  async healthCheck(): Promise<{ status: string; name: string; version: string }> {
    const response = await fetch(`${this.baseUrl}/`);
    if (!response.ok) {
      throw new Error('Backend not available');
    }
    return response.json();
  }

  // Get system status
  async getSystemStatus(): Promise<SystemStatus> {
    const response = await fetch(`${this.baseUrl}/api/system/status`, {
      headers: this.getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to get system status');
    }
    return response.json();
  }

  // Execute command
  async executeCommand(command: string, language: 'en' | 'hi' = 'en'): Promise<CommandResponse> {
    const response = await fetch(`${this.baseUrl}/api/command`, {
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
    result?: any;
    message?: string;
  }> {
    const response = await fetch(`${this.baseUrl}/api/confirm/${confirmationId}`, {
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
  async getConversations(limit: number = 50, session_id?: string): Promise<{
    success: boolean;
    conversations: any[];
  }> {
    const url = new URL(`${this.baseUrl}/api/memory/conversations`);
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
  async getMemoryStats(days: number = 7): Promise<{
    success: boolean;
    stats: any;
  }> {
    const response = await fetch(`${this.baseUrl}/api/memory/stats?days=${days}`, {
      headers: this.getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to get memory stats');
    }
    return response.json();
  }

  // Save conversation (optional, usually done by backend, but useful for manual additions)
  async saveConversation(convData: any): Promise<{ success: boolean; id: number }> {
    const response = await fetch(`${this.baseUrl}/api/memory/conversation`, {
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
  async getMemoryFacts(category?: string): Promise<{
    success: boolean;
    facts: any[];
  }> {
    const url = new URL(`${this.baseUrl}/api/memory/facts`);
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
  async createMemoryFact(key: string, value: string, category: string = 'personal'): Promise<{ success: boolean; id: number }> {
    const response = await fetch(`${this.baseUrl}/api/memory/fact`, {
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
  async updateMemoryFact(factId: number, value: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/api/memory/fact/${factId}`, {
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
  async deleteMemoryFact(factId: number): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/api/memory/fact/${factId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to delete memory fact');
    }
    return response.json();
  }

  // Clear conversation history
  async clearConversationHistory(): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/api/memory/conversations`, {
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
  async getMemoryNodes(): Promise<{
    success: boolean;
    nodes: any[];
    count: number;
  }> {
    const response = await fetch(`${this.baseUrl}/api/memory/nodes`, {
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
    const response = await fetch(`${this.baseUrl}/api/memory/nodes/${name}`, {
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
    const response = await fetch(`${this.baseUrl}/api/memory/nodes/${name}`, {
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
  async getAutomationStatus(): Promise<{ success: boolean; status: any }> {
    const response = await fetch(`${this.baseUrl}/api/automation/status`, {
      headers: this.getHeaders()
    });
    return response.json();
  }

  // Get all tasks
  async getTasks(): Promise<{ success: boolean; tasks: any[] }> {
    const response = await fetch(`${this.baseUrl}/api/automation/tasks`, {
      headers: this.getHeaders()
    });
    return response.json();
  }

  // Create task
  async createTask(task: any): Promise<{ success: boolean; task: any }> {
    const response = await fetch(`${this.baseUrl}/api/automation/task`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(task)
    });
    return response.json();
  }

  // Toggle task
  async toggleTask(taskId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/api/automation/task/${taskId}/toggle`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    return response.json();
  }

  // Delete task
  async deleteTask(taskId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/api/automation/task/${taskId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return response.json();
  }

  // Get all macros
  async getMacros(): Promise<{ success: boolean; macros: any[] }> {
    const response = await fetch(`${this.baseUrl}/api/automation/macros`, {
      headers: this.getHeaders()
    });
    return response.json();
  }

  // Create macro
  async createMacro(macro: any): Promise<{ success: boolean; macro: any }> {
    const response = await fetch(`${this.baseUrl}/api/automation/macro`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(macro)
    });
    return response.json();
  }

  // Run macro
  async runMacro(macroId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/api/automation/macro/${macroId}/run`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    return response.json();
  }

  // Toggle macro
  async toggleMacro(macroId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/api/automation/macro/${macroId}/toggle`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    return response.json();
  }

  // Delete macro
  async deleteMacro(macroId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/api/automation/macro/${macroId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return response.json();
  }

  // --- WhatsApp ---

  /** Check WhatsApp Desktop status */
  async getWhatsAppStatus(): Promise<{
    success: boolean;
    desktop_installed: boolean;
    is_running: boolean;
    response: string;
  }> {
    const response = await fetch(`${this.baseUrl}/api/whatsapp/status`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to get WhatsApp status');
    return response.json();
  }

  /** Send a WhatsApp message */
  async sendWhatsAppMessage(contact: string, message: string, language: 'en' | 'hi' = 'en'): Promise<{
    success: boolean;
    response: string;
  }> {
    const response = await fetch(`${this.baseUrl}/api/whatsapp/send`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ contact, message, language })
    });
    if (!response.ok) throw new Error('Failed to send WhatsApp message');
    return response.json();
  }

  /** Draft a context-aware reply from the active WhatsApp screen (OCR-powered) */
  async draftWhatsAppReply(language: 'en' | 'hi' = 'en'): Promise<{
    success: boolean;
    draft?: string;
    copied_to_clipboard: boolean;
    response: string;
  }> {
    const response = await fetch(`${this.baseUrl}/api/whatsapp/draft_reply?language=${language}`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to draft WhatsApp reply');
    return response.json();
  }

  /** Get list of known WhatsApp contacts */
  async getWhatsAppContacts(): Promise<{
    success: boolean;
    contacts: Array<{ alias: string; name: string; phone: string }>;
    count: number;
  }> {
    const response = await fetch(`${this.baseUrl}/api/whatsapp/contacts`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to get WhatsApp contacts');
    return response.json();
  }

  // --- Security & Process Guardian ---

  /** Get all running processes */
  async getRunningProcesses(): Promise<{
    success: boolean;
    processes: Array<{
      pid: number;
      name: string;
      cpu_percent: number;
      memory_mb: number;
      status: string;
      threat_level: string;
    }>;
    count: number;
  }> {
    const response = await fetch(`${this.baseUrl}/api/system/security/processes`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to get running processes');
    return response.json();
  }

  /** Get deep network connection scan */
  async getNetworkScan(): Promise<{
    success: boolean;
    connections: any[];
    count: number;
  }> {
    const response = await fetch(`${this.baseUrl}/api/system/security/connections`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to perform network scan');
    return response.json();
  }

  /** Quarantine (suspend/resume/terminate) a process by PID */
  async quarantineProcess(pid: number, action: 'suspend' | 'resume' | 'terminate' = 'suspend'): Promise<{
    success: boolean;
    response: string;
  }> {
    const response = await fetch(`${this.baseUrl}/api/system/security/quarantine?pid=${pid}&action=${action}`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error(`Failed to ${action} process ${pid}`);
    return response.json();
  }

  // --- Notifications ---

  /** Broadcast a notification to all connected WebSocket clients */
  async broadcastNotification(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration = 5000): Promise<{
    success: boolean;
    clients_notified: number;
  }> {
    const response = await fetch(`${this.baseUrl}/api/notifications/broadcast`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ title, message, type, duration })
    });
    if (!response.ok) throw new Error('Failed to broadcast notification');
    return response.json();
  }

  // --- Settings ---

  /** Get current settings */
  async getSettings(): Promise<{ success: boolean; settings: any }> {
    const response = await fetch(`${this.baseUrl}/api/settings`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to get settings');
    return response.json();
  }

  /** Update settings */
  async updateSettings(settings: any): Promise<{ success: boolean; updated: string[]; settings: any }> {
    const response = await fetch(`${this.baseUrl}/api/settings`, {
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
  async updateApiKeys(keys: {
    nvidia_api_key?: string;
    openrouter_api_key?: string;
    gemini_api_key?: string;
    backend_api_key?: string;
  }): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/settings/keys`, {
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
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };
