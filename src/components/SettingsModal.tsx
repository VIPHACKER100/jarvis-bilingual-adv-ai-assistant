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
      title="Neural_Registry_Configuration // v3.9.0"
      size="lg"
    >
      <div className="flex flex-col h-full min-h-[520px]">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px flex-1 bg-border-subtle" />
          <Tabs 
            tabs={tabs} 
            activeTab={activeTab} 
            onChange={setActiveTab} 
            variant="pill"
          />
          <div className="h-px flex-1 bg-border-subtle" />
        </div>

        <div className="flex-1">
          {!localSettings ? (
            <div className="flex flex-col items-center justify-center h-64 gap-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-2 border-accent/20 rounded-full animate-ping" />
                <div className="absolute inset-2 border-2 border-accent/40 rounded-full animate-spin-slow" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <RotateCcw className="w-6 h-6 text-accent animate-pulse" />
                </div>
              </div>
              <p className="label-caps text-[10px] text-accent tracking-[0.4em]">Heuristic_Sync_Initializing...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(4px)' }}
                transition={{ duration: 0.2 }}
                className="space-y-10"
              >
                {activeTab === 'general' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <SettingGroup title="Node_Localization">
                      <div className="hud-panel p-4 bg-accent/[0.02] border-accent/10">
                        <p className="label-caps text-[9px] text-foreground-muted mb-3">Primary_Input_Protocol</p>
                        <div className="flex items-center justify-between p-3 bg-background-deep border border-border-default rounded-sm">
                          <span className="text-xs font-mono font-bold text-accent">{localSettings.language.toUpperCase()} // MASTER</span>
                          <Globe className="w-4 h-4 text-accent/40" />
                        </div>
                      </div>
                      <div className="hud-panel p-4 bg-accent/[0.02] border-accent/10">
                        <p className="label-caps text-[9px] text-foreground-muted mb-3">Build_Signature</p>
                        <div className="flex items-center justify-between p-3 bg-background-deep border border-border-default rounded-sm">
                          <span className="text-xs font-mono font-bold opacity-60 text-foreground-subtle">v3.9.0_STABLE_TACTICAL</span>
                          <Check className="w-4 h-4 text-success/40" />
                        </div>
                      </div>
                    </SettingGroup>
                    <SettingGroup title="Heuristic_Triggers">
                      <ToggleItem 
                        label="Neural_Wake_Word" 
                        description="Autonomous listening for active trigger"
                        enabled={localSettings.wake_word_enabled}
                        onToggle={() => setLocalSettings({...localSettings, wake_word_enabled: !localSettings.wake_word_enabled})}
                      />
                      <div className="hud-panel p-4 bg-accent/[0.02] border-accent/10 mt-2">
                        <p className="label-caps text-[9px] text-foreground-muted mb-3">Trigger_Pattern</p>
                        <Input 
                          value={localSettings.wake_word_phrase}
                          onChange={e => setLocalSettings({...localSettings, wake_word_phrase: e.target.value})}
                          className="!bg-background-deep !border-border-default font-mono text-sm uppercase tracking-widest text-accent"
                        />
                      </div>
                    </SettingGroup>
                  </div>
                )}

                {activeTab === 'intelligence' && (
                  <div className="space-y-8">
                    <SettingGroup title="Inference_Parameters">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="hud-panel p-5 border-accent/20 bg-accent/[0.03] relative group">
                          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-accent" />
                          <p className="label-caps text-[9px] text-accent mb-2">Core_Provider</p>
                          <p className="text-lg font-bold tracking-tight">{localSettings.llm_provider.toUpperCase()}</p>
                          <p className="text-[10px] text-foreground-muted mt-2 font-mono">Status: OPTIMAL_THROUGHPUT</p>
                        </div>
                        <ToggleItem 
                          label="Predictive_Intent" 
                          description="Allow context-aware proactive insights"
                          enabled={localSettings.proactive_enabled}
                          onToggle={() => setLocalSettings({...localSettings, proactive_enabled: !localSettings.proactive_enabled})}
                        />
                      </div>
                    </SettingGroup>
                    <div className="hud-panel p-6 border-neural-purple/20 bg-neural-purple/[0.02] flex items-center gap-6">
                      <div className="w-12 h-12 rounded-full border border-neural-purple/30 flex items-center justify-center bg-neural-purple/5">
                        <Sparkles className="w-6 h-6 text-neural-purple animate-pulse" />
                      </div>
                      <div>
                        <h4 className="label-caps text-xs text-neural-purple tracking-[0.2em] mb-1">Latency_Optimization</h4>
                        <p className="text-sm text-foreground-muted leading-relaxed">System using distributed neural pathways for sub-100ms response cycles.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'voice' && (
                  <div className="space-y-8">
                    <SettingGroup title="Acoustic_Synthesis">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ToggleItem 
                          label="Neural_TTS_Engine" 
                          description="High-fidelity response synthesis"
                          enabled={localSettings.tts_enabled}
                          onToggle={() => setLocalSettings({...localSettings, tts_enabled: !localSettings.tts_enabled})}
                        />
                        <div className="hud-panel p-5 bg-accent/[0.02] border-accent/10">
                          <p className="label-caps text-[9px] text-foreground-muted mb-4">Output_Gain_Control</p>
                          <SliderItem 
                            label="Voice_Amplitude" 
                            value={85} 
                            onChange={() => {}}
                            unit="%"
                          />
                        </div>
                      </div>
                    </SettingGroup>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-8">
                    <SettingGroup title="Override_Protocols">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ToggleItem 
                          label="Restricted_Action_Auth" 
                          description="Allow high-risk system overrides"
                          enabled={localSettings.enable_dangerous_commands}
                          onToggle={() => setLocalSettings({...localSettings, enable_dangerous_commands: !localSettings.enable_dangerous_commands})}
                        />
                        <div className="hud-panel p-5 bg-security-rose/[0.02] border-security-rose/10">
                          <p className="label-caps text-[9px] text-security-rose mb-4 font-bold">Protocol_Decay_Buffer</p>
                          <SliderItem 
                            label="Auth_Wait_Time" 
                            value={localSettings.confirmation_timeout}
                            onChange={val => setLocalSettings({...localSettings, confirmation_timeout: val})}
                            min={5}
                            max={60}
                            unit="s"
                            color="security-rose"
                          />
                        </div>
                      </div>
                    </SettingGroup>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Tactical Footer */}
        <div className="flex items-center justify-between pt-8 border-t border-border-subtle mt-10">
          <Button 
            variant="ghost" 
            className="label-caps text-[10px] tracking-widest opacity-60 hover:opacity-100"
            onClick={() => settings && setLocalSettings({ ...settings })}
            disabled={!localSettings || isSaving}
          >
            Revert_Changes
          </Button>
          <div className="flex gap-4">
            <Button variant="secondary" className="px-8 py-3 label-caps text-[10px] tracking-widest" onClick={() => setShowSettings(false)}>
              Discard
            </Button>
            <Button 
              variant="neon" 
              className="px-8 py-3 label-caps text-[10px] tracking-[0.2em] !bg-accent/10 !border-accent/40 !text-accent hover:!bg-accent/20"
              leftIcon={isSaving ? null : <Save className="w-4 h-4" />}
              isLoading={isSaving}
              disabled={!localSettings}
              onClick={handleSave}
            >
              Sync_Protocol
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

const SettingGroup: FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-1.5 bg-accent rounded-full" />
      <h4 className="label-caps text-[10px] text-accent tracking-[0.3em] font-bold">
        {title}
      </h4>
      <div className="h-px flex-1 bg-gradient-to-r from-accent/20 to-transparent" />
    </div>
    <div className="flex flex-col gap-4">
      {children}
    </div>
  </div>
);

const ToggleItem: FC<{ label: string, description: string, enabled: boolean, onToggle: () => void }> = ({ 
  label, description, enabled, onToggle 
}) => (
  <div className={`flex items-center justify-between gap-6 p-5 rounded-sm border transition-all duration-300 relative group ${
    enabled ? 'border-accent/30 bg-accent/[0.04]' : 'border-border-subtle bg-surface-low/30'
  }`}>
    <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-accent/40 opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="flex-1">
      <h5 className="label-caps text-[10px] tracking-widest font-bold mb-1">{label}</h5>
      <p className="text-[10px] text-foreground-muted font-mono">{description}</p>
    </div>
    <button 
      onClick={onToggle}
      className={`relative w-12 h-6 rounded-sm border transition-colors ${
        enabled ? 'bg-accent/20 border-accent' : 'bg-surface-high/50 border-border-subtle'
      }`}
    >
      <div className="absolute inset-0 scanline opacity-20" />
      <motion.div 
        animate={{ x: enabled ? 26 : 2 }}
        className={`absolute top-1 w-4 h-4 rounded-sm shadow-lg ${
          enabled ? 'bg-accent shadow-accent/40' : 'bg-foreground-subtle/50'
        }`}
      />
    </button>
  </div>
);

const SliderItem: FC<{ label: string, value: number, onChange: (val: number) => void, min?: number, max?: number, unit?: string, color?: string }> = ({ 
  label, value, onChange, min = 0, max = 100, unit = '%', color = 'accent' 
}) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h5 className="label-caps text-[9px] tracking-widest opacity-60">{label}</h5>
      <span className={`text-[11px] font-mono font-bold text-${color}`}>{value}{unit}</span>
    </div>
    <div className="relative h-6 flex items-center">
      <input 
        type="range" 
        min={min} max={max} 
        value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className={`w-full h-1 bg-surface-high/50 rounded-none appearance-none accent-${color} cursor-pointer`}
      />
    </div>
  </div>
);
