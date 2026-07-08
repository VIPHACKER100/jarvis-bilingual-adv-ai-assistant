// ==========================================================================
// JARVIS v4.0 — System API service (all /system/* endpoints)
// ==========================================================================

import apiClient from './client';
import type {
  SystemStatusResponse,
  BatteryResponse,
  TimeResponse,
  DateResponse,
  VolumeResponse,
  UptimeResponse,
  NetworkInfoResponse,
  BaseResponse,
  PerformanceEntry,
  PersonalityInfo,
  SetPersonalityResponse,
  CommandInsights,
  ProcessInfo,
  ConnectionInfo,
} from '../types';

export const systemApi = {
  // ── Basic System ──

  /** Full system status */
  async getStatus(language?: string): Promise<SystemStatusResponse> {
    const { data } = await apiClient.get<SystemStatusResponse>('/system/status', {
      params: language ? { language } : undefined,
    });
    return data;
  },

  /** Battery info */
  async getBattery(language?: string): Promise<BatteryResponse> {
    const { data } = await apiClient.get<BatteryResponse>('/system/battery', {
      params: language ? { language } : undefined,
    });
    return data;
  },

  /** Current time */
  async getTime(language?: string): Promise<TimeResponse> {
    const { data } = await apiClient.get<TimeResponse>('/system/time', {
      params: language ? { language } : undefined,
    });
    return data;
  },

  /** Current date */
  async getDate(language?: string): Promise<DateResponse> {
    const { data } = await apiClient.get<DateResponse>('/system/date', {
      params: language ? { language } : undefined,
    });
    return data;
  },

  // ── Power Actions ──

  async shutdown(language?: string, confirmed?: boolean): Promise<BaseResponse> {
    const { data } = await apiClient.post<BaseResponse>('/system/shutdown', null, {
      params: { language, confirmed },
    });
    return data;
  },

  async restart(language?: string, confirmed?: boolean): Promise<BaseResponse> {
    const { data } = await apiClient.post<BaseResponse>('/system/restart', null, {
      params: { language, confirmed },
    });
    return data;
  },

  async sleep(language?: string, confirmed?: boolean): Promise<BaseResponse> {
    const { data } = await apiClient.post<BaseResponse>('/system/sleep', null, {
      params: { language, confirmed },
    });
    return data;
  },

  // ── Volume ──

  async volumeUp(amount?: number, language?: string): Promise<VolumeResponse> {
    const { data } = await apiClient.post<VolumeResponse>('/system/volume/up', null, {
      params: { amount, language },
    });
    return data;
  },

  async volumeDown(amount?: number, language?: string): Promise<VolumeResponse> {
    const { data } = await apiClient.post<VolumeResponse>('/system/volume/down', null, {
      params: { amount, language },
    });
    return data;
  },

  async toggleMute(language?: string): Promise<BaseResponse> {
    const { data } = await apiClient.post<BaseResponse>('/system/mute', null, {
      params: { language },
    });
    return data;
  },

  // ── Info ──

  async getUptime(language?: string): Promise<UptimeResponse> {
    const { data } = await apiClient.get<UptimeResponse>('/system/uptime', {
      params: language ? { language } : undefined,
    });
    return data;
  },

  async getNetworkInfo(language?: string): Promise<NetworkInfoResponse> {
    const { data } = await apiClient.get<NetworkInfoResponse>('/system/network', {
      params: language ? { language } : undefined,
    });
    return data;
  },

  async getWeather(city?: string, language?: string): Promise<BaseResponse> {
    const { data } = await apiClient.get<BaseResponse>('/system/weather', {
      params: { city, language },
    });
    return data;
  },

  async googleSearch(query: string, language?: string): Promise<BaseResponse> {
    const { data } = await apiClient.post<BaseResponse>('/system/search', null, {
      params: { query, language },
    });
    return data;
  },

  // ── Performance & Analytics ──

  async getPerformanceHistory(
    limit?: number,
  ): Promise<{ success: boolean; data: PerformanceEntry[] }> {
    const { data } = await apiClient.get<{ success: boolean; data: PerformanceEntry[] }>(
      '/system/performance/history',
      { params: { limit } },
    );
    return data;
  },

  async getPersonalities(): Promise<{ success: boolean; data: PersonalityInfo[] }> {
    const { data } = await apiClient.get<{ success: boolean; data: PersonalityInfo[] }>(
      '/system/personalities',
    );
    return data;
  },

  async setPersonality(
    id: string,
  ): Promise<SetPersonalityResponse> {
    const { data } = await apiClient.post<SetPersonalityResponse>(
      `/system/personality/${id}`,
    );
    return data;
  },

  async getCommandInsights(
    days?: number,
  ): Promise<{ success: boolean; data: CommandInsights }> {
    const { data } = await apiClient.get<{ success: boolean; data: CommandInsights }>(
      '/system/command-insights',
      { params: { days } },
    );
    return data;
  },

  // ── Security ──

  async getRunningProcesses(): Promise<{
    success: boolean;
    processes: ProcessInfo[];
  }> {
    const { data } = await apiClient.get<{
      success: boolean;
      processes: ProcessInfo[];
    }>('/system/security/processes');
    return data;
  },

  async getNetworkConnections(): Promise<{
    success: boolean;
    connections: ConnectionInfo[];
  }> {
    const { data } = await apiClient.get<{
      success: boolean;
      connections: ConnectionInfo[];
    }>('/system/security/connections');
    return data;
  },

  async quarantineProcess(
    pid: number,
    action: string,
  ): Promise<BaseResponse> {
    const { data } = await apiClient.post<BaseResponse>(
      '/system/security/quarantine',
      null,
      { params: { pid, action } },
    );
    return data;
  },
};
