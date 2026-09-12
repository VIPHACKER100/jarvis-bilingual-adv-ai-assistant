import { useState, useEffect, useRef, useCallback } from 'react';

// Type definition for Web Speech API which might be prefixed in some browsers
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

export type AppLanguage = 'en' | 'hi' | 'hinglish';

/** App language → BCP-47 tag for the Web Speech API */
export const SPEECH_LOCALES: Record<AppLanguage, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  // Hinglish: English-India recognizer catches romanized Hindi words best
  hinglish: 'en-IN',
};

interface UseSpeechRecognitionOptions {
  onResult: (transcript: string) => void;
  lang?: AppLanguage;
}

export const useSpeechRecognition = ({
  onResult,
  lang = 'en',
}: UseSpeechRecognitionOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  // Callbacks/locale live in refs: inline options objects must not tear down
  // the recognition instance (or an active listening session) on re-render
  const onResultRef = useRef(onResult);
  const langRef = useRef(lang);

  useEffect(() => {
    onResultRef.current = onResult;
  });

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  useEffect(() => {
    const { webkitSpeechRecognition, SpeechRecognition } =
      window as unknown as IWindow;
    const SpeechRecognitionConstructor =
      SpeechRecognition || webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setError('Speech Recognition API not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognitionConstructor();
    recognition.continuous = false; // We want single command processing for better accuracy then restart
    recognition.interimResults = false;
    recognition.lang = langRef.current;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      // Logic for continuous listening:
      // If we are still supposed to be listening (shouldListen is true), restart.
      if (recognitionRef.current && recognitionRef.current.shouldListen) {
        try {
          recognition.start();
        } catch (e) {
          // If start fails here, it might be due to rapid restart denial
          console.log('Restart attempted too quickly');
        }
      } else {
        setIsListening(false);
      }
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      onResultRef.current(transcript);
    };

    recognition.onerror = (event: any) => {
      // Handle "no-speech" gracefully (it happens if the user stays silent)
      if (event.error === 'no-speech') {
        // If it's just no-speech, we might want to keep listening loop alive
        // handled by onend usually, but good to not flag as critical error
        return;
      }

      console.error('Speech Error:', event.error);
      setError(event.error);
      setIsListening(false);

      // If permission is denied, we must stop the loop completely
      if (
        event.error === 'not-allowed' ||
        event.error === 'service-not-allowed'
      ) {
        if (recognitionRef.current) recognitionRef.current.shouldListen = false;
      }
    };

    recognitionRef.current = recognition;
    recognitionRef.current.shouldListen = false;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.shouldListen = false;
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    setError(null); // Clear previous errors on new attempt
    if (recognitionRef.current) {
      recognitionRef.current.lang = SPEECH_LOCALES[langRef.current];
      recognitionRef.current.shouldListen = true;
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.log('Recognition start error (likely already started):', e);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.shouldListen = false;
      recognitionRef.current.stop();
    }
  }, []);

  return { isListening, startListening, stopListening, error };
};
