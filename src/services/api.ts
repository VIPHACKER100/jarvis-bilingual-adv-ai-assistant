import { API_BASE_URL, API_KEY } from '@/config';

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

async function api<T>(path: string, opts?: RequestInit & { params?: Record<string, string> }): Promise<T> {
  let url = API_BASE_URL.replace(/\/+$/, '') + '/api/v1' + path;
  if (opts?.params) {
    const search = new URLSearchParams(opts.params).toString();
    if (search) url += '?' + search;
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_KEY) headers['X-API-Key'] = API_KEY;
  const res = await fetch(url, { ...opts, headers: { ...headers, ...opts?.headers as Record<string, string> } });
  if (!res.ok) {
    let data: unknown = null;
    try { data = await res.json(); } catch { /* ignore */ }
    throw new ApiError(res.status, (data as Record<string, unknown>)?.detail as string ?? `HTTP ${res.status}`, data);
  }
  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string, params?: Record<string, string>) => api<T>(path, { params }),
  post: <T>(path: string, body?: unknown) => api<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  postWithParams: <T>(path: string, params?: Record<string, string | number | boolean | undefined | null>) => {
    const filtered: Record<string, string> = {};
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) filtered[k] = String(v);
      }
    }
    return api<T>(path, { method: 'POST', params: filtered });
  },
  put: <T>(path: string, body?: unknown) => api<T>(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => api<T>(path, { method: 'DELETE' }),
};
