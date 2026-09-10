import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStore } from '../store';
import { useWebSocket, type UseWebSocketOptions } from './useWebSocket';

// ── WebSocket stub ───────────────────────────────────────────────────────────

class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  static instances: MockWebSocket[] = [];

  readyState = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  sent: string[] = [];

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    if (this.readyState === MockWebSocket.CLOSED) return;
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  // Test helpers
  simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  simulateMessage(payload: unknown) {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }
}

const lastSocket = () =>
  MockWebSocket.instances[MockWebSocket.instances.length - 1] as MockWebSocket;

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  MockWebSocket.instances = [];
  vi.stubGlobal('WebSocket', MockWebSocket);
  useStore.setState({
    isConnected: false,
    reconnectAttempts: 0,
    notifications: [],
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('useWebSocket', () => {
  it('keeps the socket open across re-renders with a fresh inline options object', () => {
    // Regression: options sat in connect's dependency array, so every render
    // created a new connect identity, tore the socket down, and exhausted the
    // retry budget — permanently disconnecting after the first re-render.
    const optionsA: UseWebSocketOptions = { onSuggestion: () => {} };
    const optionsB: UseWebSocketOptions = { onSuggestion: () => {} };

    const { rerender, result } = renderHook(
      (props: { options: UseWebSocketOptions }) => useWebSocket(props.options),
      {
        initialProps: { options: optionsA },
      }
    );

    const socket = lastSocket();
    act(() => socket.simulateOpen());
    expect(result.current.isConnected).toBe(true);

    rerender({ options: optionsB });

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(socket.readyState).toBe(MockWebSocket.OPEN);
    expect(result.current.isConnected).toBe(true);
  });

  it('does not surface duplicate notifications when onNotification is provided', () => {
    const onNotification = vi.fn();
    renderHook(() => useWebSocket({ onNotification }));
    act(() => lastSocket().simulateOpen());

    const payload = {
      type: 'notification' as const,
      data: {
        title: 'Security Protocol',
        message: 'Action approved',
        type: 'success' as const,
        duration: 5000,
      },
    };
    act(() => lastSocket().simulateMessage(payload));

    expect(onNotification).toHaveBeenCalledTimes(1);
    expect(useStore.getState().notifications).toHaveLength(0);
  });

  it('falls back to the store when no onNotification is provided', () => {
    renderHook(() => useWebSocket({}));
    act(() => lastSocket().simulateOpen());

    const payload = {
      type: 'notification' as const,
      data: { title: 'T', message: 'M', type: 'info' as const, duration: 3000 },
    };
    act(() => lastSocket().simulateMessage(payload));

    expect(useStore.getState().notifications).toHaveLength(1);
  });

  it('manual disconnect stops auto-reconnect', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useWebSocket({}));
    const socket = lastSocket();
    act(() => socket.simulateOpen());

    act(() => result.current.disconnect());

    expect(socket.readyState).toBe(MockWebSocket.CLOSED);
    expect(result.current.isConnected).toBe(false);

    // Regression: disconnect used to max out the retry counter; either way,
    // no new socket may appear after the wait period elapses.
    act(() => vi.advanceTimersByTime(4000));
    expect(MockWebSocket.instances).toHaveLength(1);
  });

  it('manual reconnect establishes a fresh connection after disconnect', () => {
    const { result } = renderHook(() => useWebSocket({}));
    act(() => lastSocket().simulateOpen());
    act(() => result.current.disconnect());
    expect(useStore.getState().isConnected).toBe(false);

    act(() => result.current.reconnect());

    expect(MockWebSocket.instances).toHaveLength(2);
    expect(lastSocket().readyState).toBe(MockWebSocket.CONNECTING);
    act(() => lastSocket().simulateOpen());
    expect(useStore.getState().isConnected).toBe(true);
  });
});
