import { FC, lazy, Suspense, useEffect } from 'react';
import { motion } from 'framer-motion';

import { useTheme } from './hooks/useTheme';
import { useJarvisStore } from './store/jarvisStore';
import { useJarvisSync } from './hooks/useJarvisSync';
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut';
import { useNotifications } from './context/NotificationContext';
import { voiceService } from './services/voiceService';
import { apiClient } from './services/apiClient';

import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { NeuralInterfaceDashboard } from './components/NeuralInterfaceDashboard';
import { QuickAccess } from './components/QuickAccess';
import { NotificationCenter } from './components/NotificationCenter';
import { CommandPalette } from './components/CommandPalette';
import { CommandInput } from './components/CommandInput';
import { AmbientBackground } from './components/AmbientBackground';

const JarvisModals = lazy(() => import('./components/JarvisModals').then(m => ({ default: m.JarvisModals })));
const AuditTimeline = lazy(() => import('./components/AuditTimeline').then(m => ({ default: m.AuditTimeline })));
const DeviceSyncHub = lazy(() => import('./components/DeviceSyncHub').then(m => ({ default: m.DeviceSyncHub })));
const NeuralTraining = lazy(() => import('./components/NeuralTraining').then(m => ({ default: m.NeuralTraining })));
const FileBrowser = lazy(() => import('./components/FileBrowser').then(m => ({ default: m.FileBrowser })));
const WindowManager = lazy(() => import('./components/WindowManager').then(m => ({ default: m.WindowManager })));

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
  useKeyboardShortcut();

  const {
    isConnected, connectionStatus, language,
    addToHistory, setSettings,
    activeTacticalView,
  } = useJarvisStore();

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

  useEffect(() => {
    voiceService.setLanguage(language);
  }, [language]);

  return (
    <div className="relative min-h-screen flex flex-col bg-background-base">
      <AmbientBackground />
      <NotificationCenter />
      <CommandPalette />

      <Header />

      <motion.div
        key={activeTacticalView}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 w-full pt-20 pb-20"
      >
        {activeTacticalView === 'HUD' && (
          <NeuralInterfaceDashboard />
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
        {activeTacticalView === 'FILES' && (
          <Suspense fallback={viewFallback}>
            <FileBrowser />
          </Suspense>
        )}
        {activeTacticalView === 'WINDOWS' && (
          <Suspense fallback={viewFallback}>
            <WindowManager />
          </Suspense>
        )}
      </motion.div>

      <QuickAccess />
      <CommandInput />
      <Footer />
      <Suspense fallback={null}>
        <JarvisModals />
      </Suspense>
    </div>
  );
};

export default App;
