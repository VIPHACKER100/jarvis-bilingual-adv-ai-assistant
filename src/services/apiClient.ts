import { SystemStatus, CommandResponse, CommandRequest } from '../types/bridge';

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

  // Get current settings
  async getSettings(): Promise<{ success: boolean; settings: any }> {
    const response = await fetch(`${this.baseUrl}/api/settings`, {
      headers: this.getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to get settings');
    }
    return response.json();
  }

  // Update settings
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

  // Update API Keys
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
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };
