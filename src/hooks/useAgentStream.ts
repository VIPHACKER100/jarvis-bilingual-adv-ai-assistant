import { useEffect, useRef, useState, useCallback } from 'react';
import { API_BASE_URL, API_KEY, SSE_TIMEOUT } from '@/config';
import type { SSEEvent } from '@/types/api';

export interface StreamCallbacks {
  onChunk?: (text: string) => void;
  onDone?: (fullText: string) => void;
  onError?: (error: string) => void;
}

export interface UseAgentStreamReturn {
  isStreaming: boolean;
  streamedText: string;
  streamAgentResponse: (
    query: string,
    language?: string,
    useRag?: boolean,
    callbacks?: StreamCallbacks,
  ) => Promise<string>;
  cancelStream: () => void;
}

export function useAgentStream(): UseAgentStreamReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, []);

  const streamAgentResponse = useCallback(
    async (
      query: string,
      language?: string,
      useRag?: boolean,
      callbacks?: StreamCallbacks,
    ): Promise<string> => {
      abortControllerRef.current?.abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (mountedRef.current) {
        setIsStreaming(true);
        setStreamedText('');
      }

      const timeoutId = setTimeout(() => {
        controller.abort();
      }, SSE_TIMEOUT);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/agent/stream`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': API_KEY,
            },
            body: JSON.stringify({
              query,
              language: language ?? 'en',
              use_rag: useRag ?? false,
            }),
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          const errorText = `HTTP ${response.status}: ${response.statusText}`;
          callbacks?.onError?.(errorText);
          throw new Error(errorText);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          const errorText = 'Response body is not readable';
          callbacks?.onError?.(errorText);
          throw new Error(errorText);
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;

            const data = trimmed.slice(6);
            if (data === '[DONE]') continue;

            try {
              const event = JSON.parse(data) as SSEEvent;

              switch (event.type) {
                case 'chunk': {
                  fullText += event.text;
                  if (mountedRef.current) {
                    setStreamedText(fullText);
                  }
                  callbacks?.onChunk?.(event.text);
                  break;
                }
                case 'done':
                case 'partial_done': {
                  fullText = event.full_text;
                  if (mountedRef.current) {
                    setStreamedText(fullText);
                  }
                  callbacks?.onDone?.(fullText);
                  return fullText;
                }
                case 'error': {
                  callbacks?.onError?.(event.error);
                  throw new Error(event.error);
                }
                case 'meta': {
                  break;
                }
              }
            } catch {
              continue;
            }
          }
        }

        if (mountedRef.current) {
          setIsStreaming(false);
        }
        return fullText;
      } catch (error) {
        if (!mountedRef.current) return '';
        setIsStreaming(false);
        const message =
          error instanceof Error ? error.message : 'Stream failed';
        callbacks?.onError?.(message);
        throw error;
      } finally {
        clearTimeout(timeoutId);
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        if (mountedRef.current) {
          setIsStreaming(false);
        }
      }
    },
    [],
  );

  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    if (mountedRef.current) {
      setIsStreaming(false);
    }
  }, []);

  return {
    isStreaming,
    streamedText,
    streamAgentResponse,
    cancelStream,
  };
}

export default useAgentStream;
