import { useRef, useState, useCallback, useEffect } from 'react';
import { WS_BASE_URL } from '../config';

interface AudioWSState {
  isConnected: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  transcript: string | null;
  error: string | null;
}

export function useAudioWS(language: string = 'en') {
  const [state, setState] = useState<AudioWSState>({
    isConnected: false,
    isProcessing: false,
    isSpeaking: false,
    transcript: null,
    error: null,
  });
  const wsRef = useRef<WebSocket | null>(null);
  const streamChunksRef = useRef<Uint8Array[]>([]);
  const resolvePlaybackRef = useRef<((value: void) => void) | null>(null);

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
        } else if (msg.type === 'tts_audio') {
          // Single TTS audio response — decode and play immediately
          handleTtsAudio(msg.audio, msg.format ?? 'opus');
        } else if (msg.type === 'tts_chunk') {
          // Streaming TTS chunk — accumulate
          const binaryStr = atob(msg.audio);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          streamChunksRef.current.push(bytes);
        } else if (msg.type === 'tts_end') {
          // All streaming chunks received — concatenate and play
          playAccumulatedStream();
        } else if (msg.type === 'tts_error') {
          setState((s) => ({ ...s, error: msg.error, isProcessing: false, isSpeaking: false }));
          resolvePlaybackRef.current?.();
          resolvePlaybackRef.current = null;
        } else if (msg.type === 'pong') {
          // keep-alive
        }
      } catch {
        // skip
      }
    };

    wsRef.current = ws;
  }, [language]);

  /** Decode base64 audio, create blob, play it, and return a Promise that resolves on end. */
  const handleTtsAudio = useCallback((audioBase64: string, format?: string) => {
    const mimeType = format === 'opus' || format === 'webm' ? 'audio/webm' : 'audio/mpeg';
    const binaryStr = atob(audioBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    setState((s) => ({ ...s, isSpeaking: true, isProcessing: false }));

    audio.play().catch(() => {
      // Autoplay may be blocked — silently clean up
      URL.revokeObjectURL(url);
      setState((s) => ({ ...s, isSpeaking: false }));
    });

    audio.onended = () => {
      URL.revokeObjectURL(url);
      setState((s) => ({ ...s, isSpeaking: false }));
    };
  }, []);

  /** Play concatenated streaming chunks once tts_end arrives. */
  const playAccumulatedStream = useCallback(() => {
    const chunks = streamChunksRef.current;
    streamChunksRef.current = [];

    if (chunks.length === 0) {
      setState((s) => ({ ...s, isSpeaking: false, isProcessing: false }));
      resolvePlaybackRef.current?.();
      resolvePlaybackRef.current = null;
      return;
    }

    // Concatenate all chunks
    const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
    const merged = new Uint8Array(totalLen);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    const blob = new Blob([merged], { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    setState((s) => ({ ...s, isSpeaking: true, isProcessing: false }));

    audio.play().catch(() => {
      URL.revokeObjectURL(url);
      setState((s) => ({ ...s, isSpeaking: false }));
      resolvePlaybackRef.current?.();
      resolvePlaybackRef.current = null;
    });

    audio.onended = () => {
      URL.revokeObjectURL(url);
      setState((s) => ({ ...s, isSpeaking: false }));
      resolvePlaybackRef.current?.();
      resolvePlaybackRef.current = null;
    };
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    streamChunksRef.current = [];
    resolvePlaybackRef.current?.();
    resolvePlaybackRef.current = null;
    setState({ isConnected: false, isProcessing: false, isSpeaking: false, transcript: null, error: null });
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

  const requestTTSStream = useCallback((text: string, voice: string = 'alloy') => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    setState((s) => ({ ...s, isProcessing: true, isSpeaking: false }));
    streamChunksRef.current = [];
    wsRef.current.send(JSON.stringify({ type: 'tts_stream', text, voice }));
  }, []);

  /** High-level speak function: uses streaming TTS, returns Promise that resolves on playback end. */
  const speak = useCallback(
    (text: string, voice?: string): Promise<void> => {
      return new Promise<void>((resolve) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          // Fallback: resolve immediately if WebSocket is disconnected
          resolve();
          return;
        }

        // Store the resolve callback so tts_end / tts_error can call it
        resolvePlaybackRef.current = resolve;

        // Initiate streaming TTS
        setState((s) => ({ ...s, isProcessing: true, isSpeaking: false }));
        streamChunksRef.current = [];
        wsRef.current.send(JSON.stringify({ type: 'tts_stream', text, voice: voice ?? 'alloy' }));
      });
    },
    [],
  );

  const clearTranscript = useCallback(() => {
    setState((s) => ({ ...s, transcript: null }));
  }, []);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    sendAudio,
    requestTTS,
    requestTTSStream,
    speak,
    clearTranscript,
  };
}
