import { FC } from 'react';
import { useJarvisStore } from '../store/jarvisStore';
import { useJarvisBridge } from '../hooks/useJarvisBridge';
import { PermissionModal } from './PermissionModal';
import { ConfirmationModal } from './ConfirmationModal';
import { MemoryViewer } from './MemoryViewer';
import { AutomationDashboard } from './AutomationDashboard';
import { SettingsModal } from './SettingsModal';
import { VisionOverlay } from './VisionOverlay';
import { FileBrowser } from './FileBrowser';
import { WindowManager } from './WindowManager';
import { PersonalitySelector } from './PersonalitySelector';
import { WhatsAppPanel } from './WhatsAppPanel';
import { DeviceSyncPanel } from './DeviceSyncPanel';
import { InputSimulator } from './InputSimulator';
import { MediaToolsPanel } from './MediaToolsPanel';
import { SystemControls } from './SystemControls';
import { PerformanceMonitor } from './PerformanceMonitor';
import { Language } from '../types';

export const JarvisModals: FC = () => {
  const { 
    language,
    showMemory, setShowMemory,
    showAutomation, setShowAutomation,
    showPermission, setShowPermission,
    pendingConfirmation,
    visionData, setVisionData,
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

      <SettingsModal />

      <VisionOverlay 
        isOpen={visionData.isOpen}
        content={visionData.content}
        metadata={visionData.metadata}
        onClose={() => setVisionData({ ...visionData, isOpen: false })}
      />

      {/* Phase 4 Extended Modals */}
      <FileBrowser />
      <WindowManager />
      <PersonalitySelector />
      <WhatsAppPanel />
      <DeviceSyncPanel />
      <InputSimulator />
      <MediaToolsPanel />
      <SystemControls />
      <PerformanceMonitor />
    </>
  );
};
