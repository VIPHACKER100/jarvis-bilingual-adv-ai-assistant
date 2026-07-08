import { useState, useEffect, useRef, useCallback } from 'react';

// Type definition for Web Speech API which might be prefixed in some browsers
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

export const useSpeechRecognition = (onResult: (transcript: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
    const SpeechRecognitionConstructor = SpeechRecognition || webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setError("Speech Recognition API not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionConstructor();
    recognition.continuous = false; // We want single command processing for better accuracy then restart
    recognition.interimResults = false;
    recognition.lang = 'en-US';

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
             console.log("Restart attempted too quickly");
          }
      } else {
          setIsListening(false);
      }
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      onResult(transcript);
    };

    recognition.onerror = (event: any) => {
      // Handle "no-speech" gracefully (it happens if the user stays silent)
      if (event.error === 'no-speech') {
        // If it's just no-speech, we might want to keep listening loop alive
        // handled by onend usually, but good to not flag as critical error
        return;
      }
      
      console.error("Speech Error:", event.error);
      setError(event.error);
      setIsListening(false);
      
      // If permission is denied, we must stop the loop completely
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
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
  }, [onResult]);

  const startListening = useCallback(() => {
    setError(null); // Clear previous errors on new attempt
    if (recognitionRef.current) {
      recognitionRef.current.shouldListen = true;
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.log("Recognition start error (likely already started):", e);
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