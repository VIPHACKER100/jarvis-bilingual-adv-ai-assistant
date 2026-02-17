import { SystemStatus, CommandResponse, CommandRequest } from '../types/bridge';

const API_BASE_URL = 'http://localhost:8000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
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
    const response = await fetch(`${this.baseUrl}/api/system/status`);
    if (!response.ok) {
      throw new Error('Failed to get system status');
    }
    return response.json();
  }

  // Execute command
  async executeCommand(command: string, language: 'en' | 'hi' = 'en'): Promise<CommandResponse> {
    const response = await fetch(`${this.baseUrl}/api/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    result?: CommandResponse;
    message?: string;
  }> {
    const response = await fetch(`${this.baseUrl}/api/confirm/${confirmationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ approved }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Confirmation failed');
    }

    return response.json();
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };
