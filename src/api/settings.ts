// ==========================================================================
// JARVIS v4.0 — Settings API service
// ==========================================================================

import apiClient from './client';
import type {
  SettingsResponse,
  SettingsUpdateRequest,
  ApiKeyStatusResponse,
  ApiKeyUpdateRequest,
  BaseResponse,
} from '../types';

export const settingsApi = {
  /** Get all current settings */
  async get(): Promise<SettingsResponse> {
    const { data } = await apiClient.get<SettingsResponse>('/settings');
    return data;
  },

  /** Update settings */
  async update(updates: SettingsUpdateRequest): Promise<SettingsResponse> {
    const { data } = await apiClient.post<SettingsResponse>('/settings', updates);
    return data;
  },

  /** Get API key status (redacted booleans) */
  async getKeys(): Promise<ApiKeyStatusResponse> {
    const { data } = await apiClient.get<ApiKeyStatusResponse>('/settings/keys');
    return data;
  },

  /** Update API keys in .env */
  async updateKeys(keys: ApiKeyUpdateRequest): Promise<BaseResponse> {
    const { data } = await apiClient.post<BaseResponse>('/settings/keys', keys);
    return data;
  },

  /** Test/verify an API key (simulated) */
  async testKey(provider: string, apiKey: string): Promise<BaseResponse> {
    const { data } = await apiClient.post<BaseResponse>('/settings/test-key', {
      provider,
      api_key: apiKey,
    });
    return data;
  },
};
