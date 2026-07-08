// ==========================================================================
// JARVIS v4.0 — useSSE hook for agent streaming (via POST + ReadableStream)
// ==========================================================================

import { useState, useCallback, useRef } from 'react';
import type { StreamEvent, AgentQuery } from '../types';
import { agentApi } from '../api/agent';

interface UseSSEReturn {
  /** Latest stream event data */
  data: StreamEvent | null;
  /** Whether the stream is currently connected */
  isConnected: boolean;
  /** Error object if stream failed */
  error: Error | null;
  /** Start a new stream */
  start: (query: AgentQuery) => void;
  /** Abort the current stream */
  stop: () => void;
}

export function useSSE(): UseSSEReturn {
  const [data, setData] = useState<StreamEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<(() => void) | null>(null);

  const start = useCallback((query: AgentQuery) => {
    // Abort any existing stream
    abortRef.current?.();

    setData(null);
    setError(null);
    setIsConnected(true);

    const { abort } = agentApi.stream(
      query,
      (event) => {
        setData(event);
        if (event.type === 'done' || event.type === 'error' || event.type === 'partial_done') {
          setIsConnected(false);
        }
      },
      (err) => {
        setError(err);
        setIsConnected(false);
      },
      () => {
        setIsConnected(false);
      },
    );

    abortRef.current = abort;
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.();
    setIsConnected(false);
    abortRef.current = null;
  }, []);

  return { data, isConnected, error, start, stop };
}
