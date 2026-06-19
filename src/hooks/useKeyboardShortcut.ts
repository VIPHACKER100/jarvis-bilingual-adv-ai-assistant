import { useEffect } from 'react';
import { useJarvisStore } from '../store/jarvisStore';
import { AppMode } from '../types';

export const useKeyboardShortcut = () => {
  const isActive = useJarvisStore(s => s.isActive);
  const setIsActive = useJarvisStore(s => s.setIsActive);
  const setMode = useJarvisStore(s => s.setMode);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
        e.preventDefault();
        if (isActive) {
          setIsActive(false);
          setMode(AppMode.IDLE);
        } else {
          setIsActive(true);
          setMode(AppMode.LISTENING);
        }
        return;
      }

      if (e.code === 'Escape') {
        const mode = useJarvisStore.getState().mode;
        if (mode === AppMode.SPEAKING || mode === AppMode.PROCESSING) {
          e.preventDefault();
          setMode(AppMode.IDLE);
          setIsActive(false);
          window.speechSynthesis?.cancel();
        }
        return;
      }

      if (e.code === 'KeyL' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        useJarvisStore.getState().toggleLanguage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, setIsActive, setMode]);
};
