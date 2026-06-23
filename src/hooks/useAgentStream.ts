import { useCallback, useRef, useState } from 'react';
import { API_BASE_URL } from '../config';

const API_KEY = (typeof import.meta !== 'undefined' ? (import.meta.env.VITE_JARVIS_API_KEY as string | undefined) : undefined) || '';

interface AgentStreamOptions {
  language?: 'en' | 'hi' | 'hinglish';
  useRag?: boolean;
  sessionId?: string;
}

interface AgentStreamState {
  isStreaming: boolean;
  response: string;
  provider: string | null;
  error: string | null;
}

export function useAgentStream() {
  const [state, setState] = useState<AgentStreamState>({
    isStreaming: false,
    response: '',
    provider: null,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const stream = useCallback(
    async (query: string, options: AgentStreamOptions = {}) => {
      const { language = 'en', useRag = true, sessionId } = options;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({ isStreaming: true, response: '', provider: null, error: null });

      try {
        const resp = await fetch(`${API_BASE_URL}/agent/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(API_KEY ? { 'X-API-Key': API_KEY } : {}) },
          body: JSON.stringify({
            query,
            language,
            stream: true,
            use_rag: useRag,
            session_id: sessionId,
          }),
          signal: controller.signal,
        });

        if (!resp.ok) {
          throw new Error(`Agent stream failed: ${resp.status}`);
        }

        const reader = resp.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.type === 'meta') {
                setState((s) => ({ ...s, provider: parsed.provider }));
              } else if (parsed.type === 'chunk') {
                setState((s) => ({ ...s, response: s.response + parsed.text }));
              } else if (parsed.type === 'done') {
                setState((s) => ({
                  ...s,
                  isStreaming: false,
                  response: parsed.full_text,
                }));
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          if (err.name === 'AbortError') return;
          setState({ isStreaming: false, response: '', provider: null, error: err.message });
        } else {
          setState({ isStreaming: false, response: '', provider: null, error: String(err) });
        }
      }
    },
    []
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState({ isStreaming: false, response: '', provider: null, error: null });
  }, []);

  const reset = useCallback(() => {
    cancel();
  }, [cancel]);

  return { ...state, stream, cancel, reset };
}
