import { useEffect, useRef, useState, useCallback } from 'react';

export interface VoiceCommandHookReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSpeaking: boolean;
  isSupported: boolean;
  startListening: (language?: string) => void;
  stopListening: () => void;
}

export function useVoiceCommands(): VoiceCommandHookReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      return;
    }

    setIsSupported(true);
    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (!mountedRef.current) return;
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result) continue;
        const alt = result[0];
        if (!alt) continue;
        if (result.isFinal) {
          finalTranscript += alt.transcript;
        } else {
          interim += alt.transcript;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (!mountedRef.current) return;
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      setIsListening(false);
    };

    recognition.onend = () => {
      if (!mountedRef.current) return;
      setIsListening(false);
    };

    recognition.onspeechstart = () => {
      if (mountedRef.current) {
        setIsSpeaking(true);
      }
    };

    recognition.onspeechend = () => {
      if (mountedRef.current) {
        setIsSpeaking(false);
      }
    };

    return () => {
      try {
        recognition.abort();
      } catch {
        // ignore abort errors during cleanup
      }
      recognitionRef.current = null;
    };
  }, []);

  const startListening = useCallback((language?: string) => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (language) {
      recognition.lang = language;
    }

    try {
      recognition.start();
      if (mountedRef.current) {
        setIsListening(true);
        setTranscript('');
        setInterimTranscript('');
      }
    } catch {
      // recognition may already be running
    }
  }, []);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    try {
      recognition.stop();
    } catch {
      // recognition may already be stopped
    }
    if (mountedRef.current) {
      setIsListening(false);
    }
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSpeaking,
    isSupported,
    startListening,
    stopListening,
  };
}

export default useVoiceCommands;
