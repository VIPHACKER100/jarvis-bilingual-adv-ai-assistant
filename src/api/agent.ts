// ==========================================================================
// JARVIS v4.0 — Agent API service
// ==========================================================================

import apiClient from './client';
import type {
  AgentQuery,
  AgentChatResponse,
  AgentHealthResponse,
  StreamEvent,
} from '../types';
import { API_BASE_URL, API_PREFIX } from './client';
import { authService } from '../services/auth';

export const agentApi = {
  /** Non-streaming LLM chat */
  async chat(query: AgentQuery): Promise<AgentChatResponse> {
    const { data } = await apiClient.post<AgentChatResponse>('/agent/chat', query);
    return data;
  },

  /**
   * Streaming LLM response (SSE via POST + ReadableStream).
   * Returns an AbortController + the fetch promise.
   * Call `onEvent` for each parsed StreamEvent.
   */
  stream(
    query: AgentQuery,
    onEvent: (event: StreamEvent) => void,
    onError?: (err: Error) => void,
    onComplete?: () => void,
  ): { abort: () => void } {
    const controller = new AbortController();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const key = authService.getApiKey();
    if (key) headers['X-API-Key'] = key;

    fetch(`${API_BASE_URL}${API_PREFIX}/agent/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...query, stream: true }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body stream');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            try {
              const parsed = JSON.parse(trimmed.slice(6)) as StreamEvent;
              onEvent(parsed);
              if (parsed.type === 'done' || parsed.type === 'error' || parsed.type === 'partial_done') {
                onComplete?.();
                return;
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
        onComplete?.();
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          onError?.(err);
        }
      });

    return { abort: () => controller.abort() };
  },

  /** Agent subsystem health (auth-exempt) */
  async health(): Promise<AgentHealthResponse> {
    const { data } = await apiClient.get<AgentHealthResponse>('/agent/health');
    return data;
  },
};
