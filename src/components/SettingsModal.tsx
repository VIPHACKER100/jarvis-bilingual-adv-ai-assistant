import React, { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, User, Shield, Zap, Volume2, Globe, Palette, 
  Smartphone, Bell, Save, RotateCcw, Check, Sparkles
} from 'lucide-react';
import { useJarvisStore } from '../store/jarvisStore';
import { useNotifications } from '../context/NotificationContext';
import { apiClient } from '../services/apiClient';
import { Modal } from './ui/Modal';
import { Tabs } from './ui/Tabs';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import { JarvisSettings } from '../types/api';

export const SettingsModal: FC = () => {
  const { 
    showSettings, setShowSettings, 
    settings, setSettings,
    language 
  } = useJarvisStore();
  const { addNotification } = useNotifications();
  
  const [activeTab, setActiveTab] = useState('general');
  const [localSettings, setLocalSettings] = useState<JarvisSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (showSettings && settings) {
      setLocalSettings({ ...settings });
    }
  }, [showSettings, settings]);

  const handleSave = async () => {
    if (!localSettings) return;
    setIsSaving(true);
    try {
      const res = await apiClient.updateSettings(localSettings);
      if (res.success) {
        setSettings(localSettings);
        addNotification({
          type: 'success',
          title: 'Configuration Updated',
          message: 'System parameters have been successfully synchronized.',
        });
        setTimeout(() => setShowSettings(false), 800);
      }
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Sync Failure',
        message: 'Unable to communicate with neural backend.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: <Settings className="w-3.5 h-3.5" /> },
    { id: 'intelligence', label: 'Intelligence', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'voice', label: 'Audio', icon: <Volume2 className="w-3.5 h-3.5" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-3.5 h-3.5" /> },
  ];

  if (!showSettings) return null;

  return (
    <Modal
      isOpen={showSettings}
      onClose={() => setShowSettings(false)}
      title="System Configuration // Core_Settings"
      size="lg"
    >
      <div className="flex flex-col h-full min-h-[500px]">
        <Tabs 
          tabs={tabs} 
          activeTab={activeTab} 
          onChange={setActiveTab} 
          variant="pill"
        />

        <div className="flex-1 mt-8">
          {!localSettings ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
              <p className="text-xs font-mono text-foreground-subtle uppercase tracking-widest">Accessing Neural Registry...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {activeTab === 'general' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SettingGroup title="Identity & Localization">
                      <div className="mt-2">
                        <p className="text-[10px] font-mono text-foreground-subtle uppercase mb-2">Primary Language</p>
                        <Badge variant="accent" className="w-full justify-center py-2">
                          {localSettings.language.toUpperCase()} // ACTIVE_NODE
                        </Badge>
                      </div>
                      <div className="mt-4">
                        <p className="text-[10px] font-mono text-foreground-subtle uppercase mb-2">System Version</p>
                        <Badge variant="ghost" className="w-full justify-center py-2 opacity-50">
                          v3.9.0 // PRODUCTION
                        </Badge>
                      </div>
                    </SettingGroup>
                    <SettingGroup title="Interface Preferences">
                      <ToggleItem 
                        label="Wake Word Detection" 
                        description="Enable autonomous listening for 'JARVIS'"
                        enabled={localSettings.wake_word_enabled}
                        onToggle={() => setLocalSettings({...localSettings, wake_word_enabled: !localSettings.wake_word_enabled})}
                      />
                      <Input 
                        label="Wake Word Phrase" 
                        value={localSettings.wake_word_phrase}
                        onChange={e => setLocalSettings({...localSettings, wake_word_phrase: e.target.value})}
                        leftIcon={<Smartphone className="w-4 h-4" />}
                      />
                    </SettingGroup>
                  </div>
                )}

                {activeTab === 'intelligence' && (
                  <div className="space-y-6">
                    <SettingGroup title="Neural Processor">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-accent/20 bg-accent/5">
                          <p className="text-[10px] font-mono text-accent uppercase mb-1">Active LLM Provider</p>
                          <p className="text-sm font-bold">{localSettings.llm_provider.toUpperCase()}</p>
                        </div>
                        <ToggleItem 
                          label="Proactive Mode" 
                          description="Allow JARVIS to offer context-aware insights"
                          enabled={localSettings.proactive_enabled}
                          onToggle={() => setLocalSettings({...localSettings, proactive_enabled: !localSettings.proactive_enabled})}
                        />
                      </div>
                    </SettingGroup>
                    <Card elevation="mid" className="border-border-subtle">
                      <div className="flex items-center gap-4">
                        <Sparkles className="w-5 h-5 text-accent" />
                        <div>
                          <h4 className="text-sm font-bold">Inference Optimization</h4>
                          <p className="text-xs text-foreground-muted">System is currently utilizing high-performance neural pathways.</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {activeTab === 'voice' && (
                  <div className="space-y-6">
                    <SettingGroup title="Synthesis Parameters">
                      <ToggleItem 
                        label="Neural TTS" 
                        description="High-fidelity voice synthesis for responses"
                        enabled={localSettings.tts_enabled}
                        onToggle={() => setLocalSettings({...localSettings, tts_enabled: !localSettings.tts_enabled})}
                      />
                    </SettingGroup>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <SettingGroup title="Protocol Overrides">
                      <ToggleItem 
                        label="Dangerous Commands" 
                        description="Allow execution of high-risk system actions"
                        enabled={localSettings.enable_dangerous_commands}
                        onToggle={() => setLocalSettings({...localSettings, enable_dangerous_commands: !localSettings.enable_dangerous_commands})}
                      />
                      <SliderItem 
                        label="Confirmation Timeout" 
                        value={localSettings.confirmation_timeout}
                        onChange={val => setLocalSettings({...localSettings, confirmation_timeout: val})}
                        min={5}
                        max={60}
                        unit="s"
                      />
                    </SettingGroup>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-8 border-t border-border-subtle mt-8">
          <Button 
            variant="ghost" 
            leftIcon={<RotateCcw className="w-4 h-4" />}
            onClick={() => settings && setLocalSettings({ ...settings })}
            disabled={!localSettings || isSaving}
          >
            Reset
          </Button>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button 
              variant="neon" 
              leftIcon={isSaving ? null : <Save className="w-4 h-4" />}
              isLoading={isSaving}
              disabled={!localSettings}
              onClick={handleSave}
            >
              Sync Config
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

const SettingGroup: FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-4">
    <h4 className="text-xs font-mono font-bold text-accent uppercase tracking-[0.2em] border-b border-border-subtle pb-2">
      {title}
    </h4>
    {children}
  </div>
);

const ToggleItem: FC<{ label: string, description: string, enabled: boolean, onToggle: () => void }> = ({ 
  label, description, enabled, onToggle 
}) => (
  <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border-subtle hover:bg-surface-low transition-colors">
    <div className="flex-1">
      <h5 className="text-sm font-bold">{label}</h5>
      <p className="text-[10px] text-foreground-muted">{description}</p>
    </div>
    <button 
      onClick={onToggle}
      className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? 'bg-accent' : 'bg-surface-high'}`}
    >
      <motion.div 
        animate={{ x: enabled ? 22 : 2 }}
        className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
      />
    </button>
  </div>
);

const SliderItem: FC<{ label: string, value: number, onChange: (val: number) => void, min?: number, max?: number, unit?: string }> = ({ 
  label, value, onChange, min = 0, max = 100, unit = '%' 
}) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <h5 className="text-xs font-bold uppercase tracking-widest">{label}</h5>
      <span className="text-xs font-mono text-accent">{value}{unit}</span>
    </div>
    <input 
      type="range" 
      min={min} max={max} 
      value={value}
      onChange={e => onChange(parseInt(e.target.value))}
      className="w-full h-1 bg-surface-high rounded-full appearance-none accent-accent cursor-pointer"
    />
  </div>
);
