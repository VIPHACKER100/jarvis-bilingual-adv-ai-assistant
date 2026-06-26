import { useEffect, useRef, useState, useCallback } from 'react';
import {
  AUDIO_WS_URL,
  API_KEY,
  WS_BASE_RECONNECT_DELAY,
  WS_MAX_RECONNECT_DELAY,
  WS_MAX_RECONNECT_ATTEMPTS,
} from '@/config';
import type { AudioWSIncoming, AudioWSOutgoing } from '@/types/api';

export interface UseAudioWSReturn {
  isConnected: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  transcript: string;
  audioLevel: number;
  sendStt: (audioBase64: string) => void;
  requestTts: (text: string, voice?: string) => void;
  requestTtsStream: (text: string, voice?: string) => void;
  playAudioBlob: (blob: Blob) => void;
  stopCurrentAudio: () => void;
}

export function useAudioWS(language: string = 'en'): UseAudioWSReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioLevel, _setAudioLevel] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isIntentionalRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Uint8Array[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const playBlobRef = useRef<(blob: Blob) => void>((_blob) => {});

  const handleIncomingRef = useRef<(msg: AudioWSIncoming) => void>((_msg) => {});

  const scheduleReconnectRef = useRef<() => void>(() => {});

  const connectRef = useRef<() => void>(() => {});

  const stopCurrentAudio = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.onended = null;
      a.onerror = null;
      audioRef.current = null;
    }
    if (mountedRef.current) {
      setIsSpeaking(false);
    }
  }, []);

  playBlobRef.current = (blob: Blob) => {
    stopCurrentAudio();
    const url = URL.createObjectURL(blob);
    const a = new Audio(url);
    audioRef.current = a;
    if (mountedRef.current) {
      setIsSpeaking(true);
    }
    a.onended = () => {
      URL.revokeObjectURL(url);
      audioRef.current = null;
      if (mountedRef.current) {
        setIsSpeaking(false);
      }
    };
    a.onerror = () => {
      URL.revokeObjectURL(url);
      audioRef.current = null;
      if (mountedRef.current) {
        setIsSpeaking(false);
      }
    };
    a.play().catch(() => {
      URL.revokeObjectURL(url);
      audioRef.current = null;
      if (mountedRef.current) {
        setIsSpeaking(false);
      }
    });
  };

  handleIncomingRef.current = (msg: AudioWSIncoming) => {
    switch (msg.type) {
      case 'stt_result': {
        setTranscript(msg.text ?? '');
        setIsListening(false);
        break;
      }
      case 'tts_audio': {
        if (!msg.audio) break;
        const binary = Uint8Array.from(atob(msg.audio), (c) => c.charCodeAt(0));
        const blob = new Blob([binary], { type: `audio/${msg.format ?? 'mp3'}` });
        playBlobRef.current(blob);
        break;
      }
      case 'tts_chunk': {
        if (!msg.audio) break;
        chunksRef.current.push(
          Uint8Array.from(atob(msg.audio), (c) => c.charCodeAt(0)),
        );
        break;
      }
      case 'tts_end': {
        if (chunksRef.current.length === 0) break;
        const totalLength = chunksRef.current.reduce((sum, c) => sum + c.length, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunksRef.current) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }
        chunksRef.current = [];
        const blob = new Blob([combined], { type: 'audio/mp3' });
        playBlobRef.current(blob);
        break;
      }
      case 'tts_error': {
        if (mountedRef.current) {
          setIsSpeaking(false);
        }
        break;
      }
      case 'error': {
        if (mountedRef.current) {
          setIsListening(false);
          setIsSpeaking(false);
        }
        break;
      }
      case 'pong': {
        break;
      }
    }
  };

  scheduleReconnectRef.current = () => {
    if (reconnectAttemptsRef.current >= WS_MAX_RECONNECT_ATTEMPTS) return;
    const delay = Math.min(
      WS_BASE_RECONNECT_DELAY * 2 ** reconnectAttemptsRef.current,
      WS_MAX_RECONNECT_DELAY,
    );
    reconnectAttemptsRef.current++;
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      if (mountedRef.current) {
        connectRef.current();
      }
    }, delay);
  };

  connectRef.current = () => {
    if (
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    isIntentionalRef.current = false;

    try {
      let url = `${AUDIO_WS_URL}?language=${encodeURIComponent(language)}`;
      if (API_KEY) {
        url += `&api_key=${encodeURIComponent(API_KEY)}`;
      }

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        reconnectAttemptsRef.current = 0;
        setIsConnected(true);
      };

      ws.onmessage = (event: MessageEvent) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data as string) as AudioWSIncoming;
          handleIncomingRef.current(msg);
        } catch {
          // skip malformed frames
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (!mountedRef.current) return;
        setIsConnected(false);
        if (!isIntentionalRef.current) {
          scheduleReconnectRef.current();
        }
      };

      ws.onerror = () => {};
    } catch {
      if (mountedRef.current) {
        setIsConnected(false);
        scheduleReconnectRef.current();
      }
    }
  };

  useEffect(() => {
    connectRef.current();
    return () => {
      isIntentionalRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      stopCurrentAudio();
    };
  }, [stopCurrentAudio]);

  const sendStt = useCallback(
    (audioBase64: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      const msg: AudioWSOutgoing = {
        type: 'stt',
        audio: audioBase64,
        language,
      };
      wsRef.current.send(JSON.stringify(msg));
      setIsListening(true);
      setTranscript('');
    },
    [language],
  );

  const requestTts = useCallback(
    (text: string, voice?: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      const msg: AudioWSOutgoing = {
        type: 'tts',
        text,
        voice,
        language,
      };
      wsRef.current.send(JSON.stringify(msg));
    },
    [language],
  );

  const requestTtsStream = useCallback(
    (text: string, voice?: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      const msg: AudioWSOutgoing = {
        type: 'tts_stream',
        text,
        voice,
        language,
      };
      wsRef.current.send(JSON.stringify(msg));
    },
    [language],
  );

  const playAudioBlob = useCallback((blob: Blob) => {
    playBlobRef.current(blob);
  }, []);

  return {
    isConnected,
    isSpeaking,
    isListening,
    transcript,
    audioLevel,
    sendStt,
    requestTts,
    requestTtsStream,
    playAudioBlob,
    stopCurrentAudio,
  };
}

export default useAudioWS;
