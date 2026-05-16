import { useRef, useCallback } from 'react';
import { AppMode, Language, CommandResult } from '../types';
import { voiceService } from '../services/voiceService';
import { sfx } from '../utils/audioUtils';
import { useJarvisStore } from '../store/jarvisStore';
import { useNotifications } from '../context/NotificationContext';

export const useVoiceController = (sendCommand: (text: string, language: 'en' | 'hi' | 'hinglish') => void) => {
  const { 
    mode, setMode, 
    language, 
    setTranscript, 
    addToHistory, 
    settings, 
    isActive, setIsActive,
    setShowPermission
  } = useJarvisStore();
  
  const { addNotification } = useNotifications();
  const processingRef = useRef(false);

  const handleError = useCallback((error: string) => {
    if (error !== 'not-allowed' && error !== 'no-speech') {
      console.error("Speech Error:", error);
    }

    let userMessage = "";
    let isCritical = false;

    const errorMessages: Record<string, { en: string, hi: string }> = {
      'not-allowed': {
        en: "ACCESS DENIED. Microphone permissions required.",
        hi: "एक्सेस अस्वीकार। माइक्रोफ़ोन अनुमति की आवश्यकता है।"
      },
      'not-supported': {
        en: "Browser not supported. Use Chrome or Edge.",
        hi: "ब्राउज़र समर्थित नहीं है। कृपया क्रोम या एज का उपयोग करें।"
      },
      'network': {
        en: "Network error. Checking connectivity...",
        hi: "नेटवर्क त्रुटि। कनेक्टिविटी की जांच कर रहा हूँ..."
      },
      'audio-capture': {
        en: "Audio capture failed. Check microphone.",
        hi: "ऑडियो कैप्चर विफल। माइक्रोफ़ोन की जांच करें।"
      },
      'start-failed': {
        en: "Initialization failed. Please refresh page.",
        hi: "आरंभ करने में विफल। कृपया पेज रिफ्रेश करें।"
      }
    };

    if (error === 'no-speech') {
      if (isActive) {
        startListening();
        return;
      }
    } else if (error === 'aborted') {
      processingRef.current = false;
      return;
    } else if (errorMessages[error]) {
      const isHindi = language === Language.HINDI;
      userMessage = isHindi ? errorMessages[error].hi : errorMessages[error].en;
      isCritical = true;
      
      if (error === 'not-allowed') {
        setShowPermission(true);
      }
    } else {
      userMessage = language === Language.HINDI
        ? `सिस्टम त्रुटि: ${error}`
        : `System Error: ${error}`;
      isCritical = true;
    }

    if (isCritical) {
      setMode(AppMode.IDLE);
      setIsActive(false);
      setTranscript(userMessage);

      const speakLang = language === Language.HINGLISH ? 'hinglish' : (language === Language.HINDI ? 'hi' : 'en');
      voiceService.speak(userMessage, speakLang as any);

      addToHistory({
        transcript: "",
        response: userMessage,
        actionType: "ERROR",
        language: language === Language.HINDI ? 'hi' : 'en',
        timestamp: Date.now(),
        isSystemMessage: true
      });
    }

    processingRef.current = false;
  }, [isActive, language, setMode, setIsActive, setTranscript, addToHistory, setShowPermission]);

  const handleCommandResult = useCallback(async (text: string, isFinal: boolean) => {
    setTranscript(text);

    if (isFinal && !processingRef.current) {
      const lowerText = text.toLowerCase().trim();
      
      if (settings?.wake_word_enabled) {
        const phrase = settings.wake_word_phrase?.toLowerCase() || 'jarvis';
        if (!lowerText.includes(phrase)) {
          if (isActive) startListening();
          return;
        }
        
        if (lowerText === phrase || lowerText === phrase + '.') {
           addNotification({
             type: 'system',
             title: 'Voice Activated',
             message: 'System is now listening for your command, sir.',
             duration: 2000
           });
           sfx.playBlip();
        }
        
        const cleanText = lowerText.replace(phrase, '').trim();
        if (!cleanText) {
          if (isActive) startListening();
          return;
        }
        
        text = cleanText;
      }

      processingRef.current = true;
      setMode(AppMode.PROCESSING);

      const langCode =
        language === Language.HINGLISH ? 'hinglish' :
          language === Language.HINDI ? 'hi' : 'en';
      sendCommand(text, langCode as any);
    }
  }, [settings, isActive, language, sendCommand, setTranscript, setMode, addNotification]);

  const startListening = useCallback(() => {
    // We check isActive from store, but we might need a ref if called from effect
    if (!useJarvisStore.getState().isActive) return;

    setMode(AppMode.LISTENING);
    setTranscript("");

    voiceService.startListening(
      handleCommandResult,
      () => {
        if (useJarvisStore.getState().isActive && !processingRef.current) {
          setTimeout(() => startListening(), 100);
        }
      },
      handleError
    );
  }, [handleCommandResult, handleError, setMode, setTranscript]);

  const stopListening = useCallback(() => {
    setIsActive(false);
    setMode(AppMode.IDLE);
    voiceService.stopListening();
    processingRef.current = false;
  }, [setIsActive, setMode]);

  const toggleActivation = useCallback(() => {
    const currentActive = useJarvisStore.getState().isActive;
    if (currentActive) {
      stopListening();
    } else {
      setIsActive(true);
      // Logic to start listening after state update
      // Since we use store state in startListening, we can call it soon
      setTimeout(() => startListening(), 10);
    }
  }, [startListening, stopListening, setIsActive]);

  return {
    startListening,
    stopListening,
    toggleActivation,
    processingRef
  };
};
