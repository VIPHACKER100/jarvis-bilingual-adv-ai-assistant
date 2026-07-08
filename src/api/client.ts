// ==========================================================================
// JARVIS v4.0 — Axios API Client with auth interceptor
// ==========================================================================

import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { authService } from '../services/auth';

export const API_BASE_URL =
  (import.meta.env.VITE_BACKEND_URL as string) ?? 'http://localhost:8000';
export const API_PREFIX = '/api/v1';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: inject X-API-Key ──
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const key = authService.getApiKey();
  if (key && config.headers) {
    config.headers['X-API-Key'] = key;
  }
  // Strip the prefix for health endpoints that are already prefixed
  return config;
});

// ── Response interceptor: global error handling ──
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string; error?: string; message?: string }>) => {
    if (error.response?.status === 403) {
      authService.clearApiKey();
      window.dispatchEvent(new CustomEvent('auth:invalid-key'));
    }
    if (error.response?.status === 429) {
      // Rate limit hit — could dispatch an event
      window.dispatchEvent(
        new CustomEvent('notification:add', {
          detail: {
            title: 'Rate Limited',
            message: 'Too many requests. Please wait before trying again.',
            type: 'warning',
            duration: 5000,
          },
        }),
      );
    }
    return Promise.reject(error);
  },
);

export default apiClient;
