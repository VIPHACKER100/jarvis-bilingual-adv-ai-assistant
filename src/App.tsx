import React, { FC, useEffect } from 'react';
import { AppMode } from './types';
import { useTheme } from './hooks/useTheme';
import { useJarvisStore } from './store/jarvisStore';
import { useJarvisBridge } from './hooks/useJarvisBridge';
import { useVoiceController } from './hooks/useVoiceController';
import { useJarvisSync } from './hooks/useJarvisSync';
import { useNotifications } from './context/NotificationContext';
import { voiceService } from './services/voiceService';
import { apiClient } from './services/apiClient';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MainHUD } from './components/MainHUD';
import { StatusPanels } from './components/StatusPanels';
import { AdvancedTools } from './components/AdvancedTools';
import { QuickAccess } from './components/QuickAccess';
import { JarvisModals } from './components/JarvisModals';
import { NotificationCenter } from './components/NotificationCenter';

const App: FC = () => {
  useTheme();
  useJarvisSync();

  const {
    isConnected, connectionStatus, lastResponse, bridgeError
  } = useJarvisStore();

  const {
    sendCommand,
    confirmCommand,
    reconnect,
    requestStatus
  } = useJarvisBridge();
  
  const { 
    toggleActivation, 
    startListening,
    processingRef 
  } = useVoiceController(sendCommand);

  const { 
    language, setLanguage,
    addToHistory,
    setShowPermission,
    setSettings,
    setMode,
    isActive
  } = useJarvisStore();

  const { addNotification } = useNotifications();

  // Connection notifications
  useEffect(() => {
    if (isConnected) {
      addNotification({
        type: 'success',
        title: 'System Online',
        message: 'Neural bridge established with JARVIS backend.',
        duration: 4000
      });
    } else if (connectionStatus === 'disconnected') {
      addNotification({
        type: 'error',
        title: 'System Offline',
        message: 'Backend connection lost. Retrying...',
        duration: 0
      });
    }
  }, [isConnected, connectionStatus, addNotification]);

  // Initial setup
  useEffect(() => {
    // Permission check
    if (navigator.permissions?.query) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then((ps) => {
          if (ps.state === 'denied') {
            setShowPermission(true);
            addNotification({
              type: 'error',
              title: 'Permission Denied',
              message: 'Microphone access is restricted.',
              duration: 8000
            });
          }
        });
    }

    // Init log
    addToHistory({
      transcript: "System Init...",
      response: "JARVIS Online. Waiting for activation.",
      actionType: "SYSTEM",
      language: 'en',
      timestamp: Date.now(),
      isSystemMessage: true
    });

    // Load settings
    apiClient.getSettings().then(res => {
      if (res.success) setSettings(res.settings);
    });

    voiceService.setLanguage(language);

    return () => voiceService.stopListening();
  }, []);

  // Sync language with voice service
  useEffect(() => {
    voiceService.setLanguage(language);
  }, [language]);

  // Handle resume after speaking
  useEffect(() => {
    if (lastResponse) {
      const timer = setTimeout(() => {
        processingRef.current = false;
        if (isActive) startListening();
        else setMode(AppMode.IDLE);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [lastResponse, isActive, startListening, setMode]);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden select-none">
      <NotificationCenter />
      
      <div className="linear-bg"></div>
      <div className="grid-overlay"></div>
      <div className="ambient-blob w-[800px] h-[800px] bg-accent/20 top-[-200px] left-1/2 -translate-x-1/2 blur-[150px]"></div>
      <div className="ambient-blob w-[600px] h-[600px] bg-purple-500/10 bottom-[-100px] right-[-100px] blur-[120px] delay-neg-5s"></div>

      <Header />

      <MainHUD onToggleActivation={toggleActivation} />

      <div className="flex flex-col gap-16 w-full max-w-4xl px-4 py-6">
        <StatusPanels />
        <AdvancedTools />
      </div>

      <QuickAccess />
      <Footer />
      <JarvisModals />
    </div>
  );
};

export default App;
