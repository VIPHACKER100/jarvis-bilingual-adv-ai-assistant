import { useState, useCallback, useEffect, useRef } from 'react';
import type { AppLanguage } from './useSpeechRecognition';
import { SPEECH_LOCALES } from './useSpeechRecognition';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
  }, []);

  const speak = useCallback((text: string, lang: AppLanguage = 'en') => {
    if (!text) return;

    // Cancel any current speaking
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const locale = SPEECH_LOCALES[lang];

    // Prefer a voice matching the response language, fall back to
    // JARVIS's signature English voice
    const voicesNow = voicesRef.current;
    const langPrefix = locale.split('-')[0] ?? 'en';
    const preferredVoice =
      voicesNow.find(v => v.lang === locale) ||
      voicesNow.find(v => v.lang.startsWith(langPrefix)) ||
      voicesNow.find(v => v.name.includes('Google US English')) ||
      voicesNow.find(v => v.lang === 'en-US') ||
      voicesNow[0];

    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.lang = locale;

    utterance.pitch = 0.9; // Slightly lower for Jarvis feel
    utterance.rate = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, isSpeaking, stopSpeaking };
};
