import React, { FC } from 'react';
import { useJarvisStore } from '../store/jarvisStore';
import { useJarvisBridge } from '../hooks/useJarvisBridge';
import PermissionModal from './modals/PermissionModal';
import ConfirmationModal from './modals/ConfirmationModal';
import MemoryViewer from './modals/MemoryViewer';
import AutomationDashboard from './modals/AutomationDashboard';
import SettingsModal from './modals/SettingsModal';
import VisionOverlay from './VisionOverlay';
import { Language } from '../types';

export const JarvisModals: FC = () => {
  const { 
    language, setLanguage,
    showSettings, setShowSettings,
    showMemory, setShowMemory,
    showAutomation, setShowAutomation,
    showPermission, setShowPermission,
    pendingConfirmation,
    visionData, setVisionData,
    setSettings
  } = useJarvisStore();
  
  const { confirmCommand } = useJarvisBridge();

  return (
    <>
      <PermissionModal
        isOpen={showPermission}
        onClose={() => setShowPermission(false)}
        language={language === Language.HINDI ? 'hi' : 'en'}
      />

      <ConfirmationModal
        isOpen={!!pendingConfirmation}
        confirmation={pendingConfirmation}
        onConfirm={() => confirmCommand(true)}
        onCancel={() => confirmCommand(false)}
      />

      <MemoryViewer
        isOpen={showMemory}
        onClose={() => setShowMemory(false)}
      />

      <AutomationDashboard
        isOpen={showAutomation}
        onClose={() => setShowAutomation(false)}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSettingsUpdated={(updated) => {
          setSettings(updated);
          if (updated.language === 'en') setLanguage(Language.ENGLISH);
          else if (updated.language === 'hi') setLanguage(Language.HINDI);
          else if (updated.language === 'hinglish') setLanguage(Language.HINGLISH);
        }}
      />

      <VisionOverlay 
        isOpen={visionData.isOpen}
        content={visionData.content}
        metadata={visionData.metadata}
        onClose={() => setVisionData({ ...visionData, isOpen: false })}
      />
    </>
  );
};
