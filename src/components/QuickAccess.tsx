import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, Zap, FolderOpen, Layout, Palette, MessageCircle,
  Smartphone, MousePointer2, Image, Power, Activity, Key,
} from 'lucide-react';
import { useJarvisStore } from '../store/jarvisStore';
import { CloudSettingsModal } from './CloudSettings';

const QUICK_ACTIONS = [
  { icon: Brain, label: 'Neural Core', action: 'memory', color: 'accent' as const },
  { icon: Zap, label: 'Automations', action: 'automation', color: 'purple' as const },
  { icon: FolderOpen, label: 'Files', action: 'files', color: 'cyan' as const },
  { icon: Layout, label: 'Windows', action: 'windows', color: 'emerald' as const },
  { icon: Palette, label: 'Personality', action: 'personality', color: 'pink' as const },
  { icon: MessageCircle, label: 'WhatsApp', action: 'whatsapp', color: 'green' as const },
  { icon: Smartphone, label: 'Sync', action: 'sync', color: 'blue' as const },
  { icon: MousePointer2, label: 'Input', action: 'input', color: 'amber' as const },
  { icon: Image, label: 'Media Tools', action: 'media', color: 'purple' as const },
  { icon: Power, label: 'System', action: 'system', color: 'red' as const },
  { icon: Activity, label: 'Performance', action: 'performance', color: 'cyan' as const },
];

const COLOR_MAP: Record<string, string> = {
  accent: 'var(--accent-rgb)',
  purple: '139,92,246',
  cyan: '34,211,218',
  emerald: '52,211,153',
  pink: '236,72,153',
  green: '74,222,128',
  blue: '96,165,250',
  amber: '251,191,36',
  red: '248,113,113',
};

export const QuickAccess: FC = () => {
  const {
    setShowMemory, setShowAutomation,
    setShowFileBrowser, setShowWindowManager,
    setShowPersonality, setShowWhatsApp,
    setShowDeviceSync, setShowInputSimulator,
    setShowMediaTools, setShowSystemControls,
    setShowPerformanceMonitor,
  } = useJarvisStore();
  const [showCloudKeys, setShowCloudKeys] = useState(false);

  const handleAction = (action: string) => {
    switch (action) {
      case 'memory': setShowMemory(true); break;
      case 'automation': setShowAutomation(true); break;
      case 'files': setShowFileBrowser(true); break;
      case 'windows': setShowWindowManager(true); break;
      case 'personality': setShowPersonality(true); break;
      case 'whatsapp': setShowWhatsApp(true); break;
      case 'sync': setShowDeviceSync(true); break;
      case 'input': setShowInputSimulator(true); break;
      case 'media': setShowMediaTools(true); break;
      case 'system': setShowSystemControls(true); break;
      case 'performance': setShowPerformanceMonitor(true); break;
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="fixed bottom-6 right-6 z-30 flex flex-col-reverse sm:flex-row gap-2 max-w-[90vw] flex-wrap justify-end"
      >
        {/* Cloud API Keys Button */}
        <button
          onClick={() => setShowCloudKeys(true)}
          className="glass-panel px-3 py-2 rounded-xl transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(var(--accent-rgb),0.2)] flex items-center justify-center gap-2 text-[10px] font-mono tracking-wide group shrink-0"
          title="Manage API Keys"
          aria-label="Open API Key manager"
        >
          <Key className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-foreground-muted" />
          <span className="hidden md:inline text-foreground-muted">Keys</span>
        </button>

        {/* Quick action buttons */}
        {QUICK_ACTIONS.map(({ icon: Icon, label, action, color }) => (
          <button
            key={action}
            onClick={() => handleAction(action)}
            className="glass-panel px-3 py-2 rounded-xl transition-all hover:-translate-y-1 flex items-center justify-center gap-2 text-[10px] font-mono tracking-wide group shrink-0"
            style={{
              boxShadow: `0 0 0 0 rgba(${COLOR_MAP[color]},0)`,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = `0 4px 20px rgba(${COLOR_MAP[color]},0.25)`;
              e.currentTarget.style.borderColor = `rgba(${COLOR_MAP[color]},0.5)`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '';
            }}
            title={label}
            aria-label={`Open ${label}`}
          >
            <Icon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span className="hidden md:inline">{label}</span>
          </button>
        ))}
      </motion.div>

      <CloudSettingsModal isOpen={showCloudKeys} onClose={() => setShowCloudKeys(false)} />
    </>
  );
};
