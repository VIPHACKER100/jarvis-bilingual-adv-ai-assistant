import { useRef, useState, useCallback, useEffect } from 'react';
import { WS_BASE_URL } from '../config';

interface AudioWSState {
  isConnected: boolean;
  isProcessing: boolean;
  transcript: string | null;
  error: string | null;
}

export function useAudioWS(language: string = 'en') {
  const [state, setState] = useState<AudioWSState>({
    isConnected: false,
    isProcessing: false,
    transcript: null,
    error: null,
  });
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`${WS_BASE_URL}/audio?language=${language}`);

    ws.onopen = () => setState((s) => ({ ...s, isConnected: true, error: null }));
    ws.onclose = () => setState((s) => ({ ...s, isConnected: false }));
    ws.onerror = () => setState((s) => ({ ...s, error: 'WebSocket error' }));

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'stt_result') {
          setState((s) => ({ ...s, transcript: msg.text, isProcessing: false }));
        } else if (msg.type === 'tts_error') {
          setState((s) => ({ ...s, error: msg.error, isProcessing: false }));
        } else if (msg.type === 'pong') {
          // keep-alive
        }
      } catch {
        // skip
      }
    };

    wsRef.current = ws;
  }, [language]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setState({ isConnected: false, isProcessing: false, transcript: null, error: null });
  }, []);

  const sendAudio = useCallback((audioBase64: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    setState((s) => ({ ...s, isProcessing: true, transcript: null }));
    wsRef.current.send(JSON.stringify({ type: 'stt', audio: audioBase64 }));
  }, []);

  const requestTTS = useCallback((text: string, voice: string = 'alloy') => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    setState((s) => ({ ...s, isProcessing: true }));
    wsRef.current.send(JSON.stringify({ type: 'tts', text, voice }));
  }, []);

  const clearTranscript = useCallback(() => {
    setState((s) => ({ ...s, transcript: null }));
  }, []);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return { ...state, connect, disconnect, sendAudio, requestTTS, clearTranscript };
}
