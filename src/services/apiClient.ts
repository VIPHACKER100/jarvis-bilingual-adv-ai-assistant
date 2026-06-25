import {
  SystemStatus,
  HealthCheckResponse,
  CommandResult,
  SettingsResponse,
  BaseResponse,
} from "../types/api";

const API_BASE_URL = import.meta.env.VITE_APP_URL || "http://localhost:8000";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private getHeaders(): HeadersInit {
    const apiKey = import.meta.env.VITE_JARVIS_API_KEY || "";
    return {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    };
  }

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api/v1${path}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api/v1${path}`, {
      method: "POST",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api/v1${path}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  }

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api/v1${path}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  }

  async safeRequest<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      console.error("API Error:", error);
      return null;
    }
  }

  // --- Health ---
  healthCheck = () => this.get<HealthCheckResponse>("/health");

  // --- Commands ---
  executeCommand = (command: string, language: string = "en") =>
    this.post<CommandResult>("/command", { command, language });

  confirmCommand = (confirmationId: string, approved: boolean) =>
    this.post<BaseResponse>(`/confirm/${confirmationId}`, { approved });

  // --- System ---
  getSystemStatus = () => this.get<SystemStatus>("/system/status");

  // --- Settings ---
  getSettings = () => this.get<SettingsResponse>("/settings");
}

export const apiClient = new ApiClient();
