import { useState, useCallback, useEffect } from 'react';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
  }, []);

  const speak = useCallback((text: string) => {
    if (!text) return;
    
    // Cancel any current speaking
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find a "system" sounding voice (e.g., Google US English, or similar)
    const preferredVoice = voices.find(v => v.name.includes('Google US English')) || 
                           voices.find(v => v.lang === 'en-US') || 
                           voices[0];
    
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.pitch = 0.9; // Slightly lower for Jarvis feel
    utterance.rate = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [voices]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, isSpeaking, stopSpeaking };
};