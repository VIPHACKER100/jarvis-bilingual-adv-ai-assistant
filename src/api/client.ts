// ==========================================================================
// JARVIS v4.0 — Axios API Client with auth interceptor
// ==========================================================================

import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { authService } from '../services/auth';
import { useStore } from '../store';

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

function pushNotification(
  title: string,
  message: string,
  type: 'error' | 'warning',
  duration: number
) {
  // Global 403/429 handling — every page sees these, not just Home
  useStore.getState().addNotification({
    id: crypto.randomUUID(),
    title,
    message,
    type,
    duration,
  });
}

// ── Response interceptor: global error handling ──
apiClient.interceptors.response.use(
  response => response,
  (
    error: AxiosError<{ detail?: string; error?: string; message?: string }>
  ) => {
    if (error.response?.status === 403) {
      authService.clearApiKey();
      pushNotification(
        'Auth Error',
        'Invalid or missing API key. Please configure it in Settings.',
        'error',
        8000
      );
    }
    if (error.response?.status === 429) {
      pushNotification(
        'Rate Limited',
        'Too many requests. Please wait before trying again.',
        'warning',
        5000
      );
    }
    return Promise.reject(error);
  }
);

export default apiClient;
