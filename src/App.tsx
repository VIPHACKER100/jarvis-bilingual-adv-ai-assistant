import { FC, lazy, Suspense, useEffect } from 'react';
import { motion } from 'framer-motion';
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
import { NotificationCenter } from './components/NotificationCenter';
import { CommandPalette } from './components/CommandPalette';
import { NeuralNetwork } from './components/NeuralNetwork';

const JarvisModals = lazy(() => import('./components/JarvisModals').then(m => ({ default: m.JarvisModals })));
const AuditTimeline = lazy(() => import('./components/AuditTimeline').then(m => ({ default: m.AuditTimeline })));
const DeviceSyncHub = lazy(() => import('./components/DeviceSyncHub').then(m => ({ default: m.DeviceSyncHub })));
const NeuralTraining = lazy(() => import('./components/NeuralTraining').then(m => ({ default: m.NeuralTraining })));

const viewFallback = (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
      <span className="text-xs font-mono text-foreground-subtle uppercase tracking-widest">Loading View...</span>
    </div>
  </div>
);

const App: FC = () => {
  useTheme();
  useJarvisSync();

  const {
    isConnected, connectionStatus, mode, language,
    addToHistory, setSettings, isAgentThinking,
    activeTacticalView,
  } = useJarvisStore();

  const bridge = useJarvisBridge();
  const { toggleActivation } = useVoiceController(bridge.sendCommand);
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (isConnected) {
      addNotification({
        type: 'success',
        title: 'System Online',
        message: 'Neural bridge established with JARVIS backend.',
        duration: 4000,
      });
    } else if (connectionStatus === 'disconnected') {
      addNotification({
        type: 'error',
        title: 'System Offline',
        message: 'Backend link interrupted. Re-syncing...',
        duration: 0,
      });
    }
  }, [isConnected, connectionStatus]);

  useEffect(() => {
    addToHistory({
      transcript: 'System Booting...',
      response: 'JARVIS Neural Interface Loaded. Calibration complete.',
      actionType: 'SYSTEM',
      language: 'en',
      timestamp: Date.now(),
      isSystemMessage: true,
    });

    apiClient.getSettings().then((res) => {
      if (res.success) setSettings(res.settings);
    });

    voiceService.setLanguage(language);
    return () => voiceService.stopListening();
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col bg-background-base">
      <NotificationCenter />
      <CommandPalette />

      <div className="linear-bg" />
      <div className="grid-overlay" />
      <NeuralNetwork isActive={isAgentThinking || mode !== AppMode.IDLE} />

      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.08, 0.15, 0.08],
          x: [0, 60, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="ambient-blob w-[800px] h-[800px] bg-cyber-cyan top-[-250px] left-1/2 -translate-x-1/2 blur-[160px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.04, 0.1, 0.04],
          x: [0, -50, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        className="ambient-blob w-[600px] h-[600px] bg-cyber-pink bottom-[-120px] right-[-120px] blur-[140px]"
      />

      <Header />

      <motion.div
        key={activeTacticalView}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
        className="flex-1 w-full pt-20 pb-20"
      >
        {activeTacticalView === 'HUD' && (
          <div className="container-fluid flex flex-col items-center gap-8 mt-4">
            <MainHUD onToggleActivation={toggleActivation} />
            <div className="w-full max-w-6xl space-y-6">
              <StatusPanels />
              <AdvancedTools />
            </div>
          </div>
        )}
        {activeTacticalView === 'TIMELINE' && (
          <Suspense fallback={viewFallback}>
            <AuditTimeline />
          </Suspense>
        )}
        {activeTacticalView === 'SYNC' && (
          <Suspense fallback={viewFallback}>
            <DeviceSyncHub />
          </Suspense>
        )}
        {activeTacticalView === 'TRAINING' && (
          <Suspense fallback={viewFallback}>
            <NeuralTraining />
          </Suspense>
        )}
      </motion.div>

      <QuickAccess />
      <Footer />
      <Suspense fallback={null}>
        <JarvisModals />
      </Suspense>
    </div>
  );
};

export default App;
