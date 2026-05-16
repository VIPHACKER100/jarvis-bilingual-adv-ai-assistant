import React, { FC, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppMode, Language } from './types';
import { useTheme } from './hooks/useTheme';
import { useJarvisStore } from './store/jarvisStore';
import { useJarvisBridge } from './hooks/useJarvisBridge';
import { useVoiceController } from './hooks/useVoiceController';
import { useJarvisSync } from './hooks/useJarvisSync';
import { useNotifications } from './context/NotificationContext';
import { voiceService } from './services/voiceService';
import { apiClient } from './services/apiClient';

// Components
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MainHUD } from './components/MainHUD';
import { StatusPanels } from './components/StatusPanels';
import { AdvancedTools } from './components/AdvancedTools';
import { QuickAccess } from './components/QuickAccess';
import { JarvisModals } from './components/JarvisModals';
import { NotificationCenter } from './components/NotificationCenter';
import { CommandPalette } from './components/CommandPalette';
import { NeuralNetwork } from './components/NeuralNetwork';

// Tactical Views
import { AuditTimeline } from './components/AuditTimeline';
import { DeviceSyncHub } from './components/DeviceSyncHub';
import { NeuralTraining } from './components/NeuralTraining';

const App: FC = () => {
  useTheme();
  useJarvisSync();

  const {
    isConnected, connectionStatus, lastResponse, mode, isActive, language, setLanguage,
    addToHistory, setShowPermission, setSettings, setMode, isAgentThinking,
    activeTacticalView
  } = useJarvisStore();

  const { sendCommand, toggleActivation } = useVoiceController(useJarvisBridge().sendCommand);
  const { addNotification } = useNotifications();

  // Connection notifications
  useEffect(() => {
    if (isConnected) {
      addNotification({
        type: 'success',
        title: 'System Online',
        message: 'Neural bridge established with JARVIS v3.9.0 backend.',
        duration: 4000
      });
    } else if (connectionStatus === 'disconnected') {
      addNotification({
        type: 'error',
        title: 'System Offline',
        message: 'Backend link interrupted. Re-syncing...',
        duration: 0
      });
    }
  }, [isConnected, connectionStatus]);

  // Initial setup
  useEffect(() => {
    // Init log
    addToHistory({
      transcript: "System Booting...",
      response: "JARVIS Neural Interface v3.9.0 Loaded. Calibration complete.",
      actionType: "SYSTEM",
      language: 'en',
      timestamp: Date.now(),
      isSystemMessage: true
    });

    apiClient.getSettings().then(res => {
      if (res.success) setSettings(res.settings);
    });

    voiceService.setLanguage(language);
    return () => voiceService.stopListening();
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center overflow-x-hidden bg-background-base">
      {/* Global UI Layers */}
      <NotificationCenter />
      <CommandPalette />
      
      {/* Ambient Background System */}
      <div className="linear-bg" />
      <div className="grid-overlay" />
      <NeuralNetwork isActive={isAgentThinking || mode !== AppMode.IDLE} />
      
      {/* Animated Blobs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
          x: [0, 50, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="ambient-blob w-[800px] h-[800px] bg-cyber-cyan top-[-200px] left-1/2 -translate-x-1/2 blur-[160px]" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.05, 0.15, 0.05],
          x: [0, -40, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="ambient-blob w-[600px] h-[600px] bg-neural-purple bottom-[-100px] right-[-100px] blur-[140px]" 
      />

      <Header />

      <motion.div
        key={activeTacticalView}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full flex flex-col items-center pt-24 pb-32"
      >
        {activeTacticalView === 'HUD' && (
          <>
            <MainHUD onToggleActivation={toggleActivation} />
            <div className="w-full max-w-6xl px-6 space-y-24 mt-12">
              <StatusPanels />
              <AdvancedTools />
            </div>
          </>
        )}

        {activeTacticalView === 'TIMELINE' && <AuditTimeline />}
        {activeTacticalView === 'SYNC' && <DeviceSyncHub />}
        {activeTacticalView === 'TRAINING' && <NeuralTraining />}
      </motion.div>

      <QuickAccess />
      <Footer />
      <JarvisModals />
    </div>
  );
};

export default App;
