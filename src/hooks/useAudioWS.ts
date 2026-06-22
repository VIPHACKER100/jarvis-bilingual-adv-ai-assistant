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
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlsRef = useRef<string[]>([]);

  const stopCurrentAudio = useCallback(() => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    for (const url of objectUrlsRef.current) {
      URL.revokeObjectURL(url);
    }
    objectUrlsRef.current = [];
  }, []);

  const playAudioBlob = useCallback((blob: Blob) => {
    stopCurrentAudio();
    const url = URL.createObjectURL(blob);
    objectUrlsRef.current.push(url);
    const audio = new Audio(url);
    activeAudioRef.current = audio;

    setState((s) => ({ ...s, isSpeaking: true, isProcessing: false }));

    const cleanup = (targetUrl: string) => {
      if (activeAudioRef.current !== audio) return;
      URL.revokeObjectURL(targetUrl);
      objectUrlsRef.current = objectUrlsRef.current.filter((u) => u !== targetUrl);
      activeAudioRef.current = null;
      setState((s) => ({ ...s, isSpeaking: false }));
      resolvePlaybackRef.current?.();
      resolvePlaybackRef.current = null;
    };

    audio.play().catch(() => cleanup(url));
    audio.onended = () => cleanup(url);
    audio.onerror = () => cleanup(url);
  }, [stopCurrentAudio]);

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
          const mimeType = msg.format === 'opus' || msg.format === 'webm' ? 'audio/webm' : 'audio/mpeg';
          const binaryStr = atob(msg.audio);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          playAudioBlob(new Blob([bytes], { type: mimeType }));
        } else if (msg.type === 'tts_chunk') {
          const binaryStr = atob(msg.audio);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          streamChunksRef.current.push(bytes);
        } else if (msg.type === 'tts_end') {
          const chunks = streamChunksRef.current;
          streamChunksRef.current = [];
          if (chunks.length > 0) {
            const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
            const merged = new Uint8Array(totalLen);
            let offset = 0;
            for (const chunk of chunks) {
              merged.set(chunk, offset);
              offset += chunk.length;
            }
            playAudioBlob(new Blob([merged], { type: 'audio/webm' }));
          } else {
            setState((s) => ({ ...s, isSpeaking: false, isProcessing: false }));
            resolvePlaybackRef.current?.();
            resolvePlaybackRef.current = null;
          }
        } else if (msg.type === 'tts_error') {
          setState((s) => ({ ...s, error: msg.error, isProcessing: false, isSpeaking: false }));
          resolvePlaybackRef.current?.();
          resolvePlaybackRef.current = null;
        }
      } catch {
        // skip
      }
    };

    wsRef.current = ws;
  }, [language, playAudioBlob]);

  const disconnect = useCallback(() => {
    stopCurrentAudio();
    resolvePlaybackRef.current?.();
    resolvePlaybackRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
    streamChunksRef.current = [];
    setState({ isConnected: false, isProcessing: false, isSpeaking: false, transcript: null, error: null });
  }, [stopCurrentAudio]);

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
    stopCurrentAudio();
    setState((s) => ({ ...s, isProcessing: true, isSpeaking: false }));
    streamChunksRef.current = [];
    wsRef.current.send(JSON.stringify({ type: 'tts_stream', text, voice }));
  }, [stopCurrentAudio]);

  const speak = useCallback(
    (text: string, voice?: string): Promise<void> => {
      return new Promise<void>((resolve) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          resolve();
          return;
        }

        resolvePlaybackRef.current?.();
        resolvePlaybackRef.current = resolve;

        stopCurrentAudio();
        setState((s) => ({ ...s, isProcessing: true, isSpeaking: false }));
        streamChunksRef.current = [];
        wsRef.current.send(JSON.stringify({ type: 'tts_stream', text, voice: voice ?? 'alloy' }));
      });
    },
    [stopCurrentAudio],
  );

  const clearTranscript = useCallback(() => {
    setState((s) => ({ ...s, transcript: null }));
  }, []);

  useEffect(() => {
    return () => {
      stopCurrentAudio();
      resolvePlaybackRef.current?.();
      resolvePlaybackRef.current = null;
      wsRef.current?.close();
    };
  }, [stopCurrentAudio]);

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
