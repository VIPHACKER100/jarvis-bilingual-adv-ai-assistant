import { useEffect } from 'react';
import { useJarvisStore } from '../store/jarvisStore';
import { useNotifications } from '../context/NotificationContext';
import { sfx } from '../utils/audioUtils';
import { AppMode, Language } from '../types';
import { voiceService } from '../services/voiceService';

export const useJarvisSync = () => {
  const { 
    lastResponse, 
    volume, setVolume, 
    setVisionData, 
    setCurrentSuggestion,
    addToHistory,
    transcript, setTranscript,
    setMode,
    isActive,
    language
  } = useJarvisStore();
  
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (lastResponse) {
      // Clear transcript as execution is complete (v3.7.1)
      setTranscript('');

      // Volume updates
      if (lastResponse.command_key === 'volume_up' && lastResponse.success) {
        setVolume(lastResponse.volume || Math.min(volume + 10, 100));
        sfx.playBlip();
      } else if (lastResponse.command_key === 'volume_down' && lastResponse.success) {
        setVolume(lastResponse.volume || Math.max(volume - 10, 0));
        sfx.playBlip();
      }

      // Macros
      if (lastResponse.action_type === 'MACRO_STARTED' && lastResponse.success) {
        addNotification({
          type: 'system',
          title: 'Macro Sequence Triggered',
          message: `Executing [${lastResponse.macro_name}]`,
          duration: 3000
        });
        sfx.playBlip();
      }

      // OCR/Vision
      if (lastResponse.command_key.includes('ocr') || lastResponse.command_key === 'get_selected_text') {
        if (lastResponse.success && lastResponse.response) {
          setVisionData({
            isOpen: true,
            content: lastResponse.response,
            metadata: lastResponse.data
          });
          sfx.playBlip();
        }
      }

      // Suggestions
      if (lastResponse.suggestion) {
        setCurrentSuggestion(lastResponse.suggestion);
        setTimeout(() => {
          setCurrentSuggestion(null); // Simple clear, or use the check from App.tsx
        }, 8000);
      }

      // History
      addToHistory({
        transcript: transcript,
        response: lastResponse.response,
        actionType: lastResponse.command_key.toUpperCase(),
        language: lastResponse.language,
        timestamp: Date.now()
      });

      // Speak
      setMode(AppMode.SPEAKING);
      voiceService.speak(lastResponse.response, lastResponse.language);

      // We handle the resume logic in the voice controller or here
      // App.tsx had a setTimeout for 2000ms
    }
  }, [lastResponse]);
};
