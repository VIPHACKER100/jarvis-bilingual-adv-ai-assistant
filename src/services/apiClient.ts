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
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };
