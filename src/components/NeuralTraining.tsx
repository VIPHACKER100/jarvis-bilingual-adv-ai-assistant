import React, { FC, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Mic2, Save, Play, Settings2, BarChart3, Binary, Waves } from 'lucide-react';
import { VoiceProfile } from '../types/api';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

import { useJarvisBridge } from '../hooks/useJarvisBridge';

export const NeuralTraining: FC = () => {
  const { getVoiceProfiles, updateVoiceProfile, trainVoiceProfile } = useJarvisBridge();
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<VoiceProfile | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfiles = async () => {
    try {
      const res = await getVoiceProfiles();
      if (res.success) {
        setProfiles(res.profiles);
        if (!activeProfile && res.profiles.length > 0) {
          setActiveProfile(res.profiles.find(p => p.is_active) || res.profiles[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch voice profiles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [getVoiceProfiles]);

  const startTraining = async () => {
    if (!activeProfile) return;
    setIsTraining(true);
    setProgress(0);
    
    try {
      await trainVoiceProfile(activeProfile.id);
      // Simulate progress for UI feedback
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsTraining(false);
            return 100;
          }
          return prev + 1;
        });
      }, 500);
    } catch (err) {
      console.error('Training failed:', err);
      setIsTraining(false);
    }
  };

  const updateWeight = async (param: keyof VoiceProfile, val: number) => {
    if (!activeProfile) return;
    const updated = { ...activeProfile, [param]: val };
    setActiveProfile(updated);
    
    try {
      await updateVoiceProfile(activeProfile.id, { [param]: val });
    } catch (err) {
      console.error('Failed to update weight:', err);
    }
  };
  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-neural-purple/10 border border-neural-purple/20 flex items-center justify-center text-neural-purple">
              <Brain className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold font-display uppercase tracking-tighter text-foreground">
              Neural_Training_Interface
            </h1>
          </div>
          <p className="text-foreground-muted text-sm font-mono uppercase tracking-widest opacity-60">
            Synaptic Weight Calibration // v3.9.0_Core_B8
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-mono text-foreground-subtle uppercase">Engine_Status</p>
            <p className="text-sm font-bold text-success">SYNAPTIC_SYNC_ACTIVE</p>
          </div>
          <Button 
            variant="neon" 
            className="gap-2 bg-neural-purple hover:bg-neural-purple/80 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
            disabled={isTraining || !activeProfile}
            onClick={startTraining}
          >
            {isTraining ? <Waves className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4" />}
            {isTraining ? 'TRAINING_IN_PROGRESS...' : 'START_MODEL_TRAINING'}
          </Button>
        </div>
      </div>

      {isTraining && (
        <Card className="border-neural-purple/30 bg-neural-purple/5 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-neural-purple font-bold">OPTIMIZING_NEURAL_WEIGHTS...</span>
            <span className="text-xs font-mono text-neural-purple">{progress}%</span>
          </div>
          <div className="h-2 w-full bg-background-base rounded-full overflow-hidden border border-neural-purple/20">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-neural-purple shadow-[0_0_10px_rgba(168,85,247,0.5)]"
            />
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Voice Profile Selector */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-xs font-mono text-foreground-subtle uppercase tracking-widest flex items-center gap-2">
            <Mic2 className="w-3 h-3" /> Voice_Profiles
          </h3>
          <div className="space-y-3">
            {isLoading ? (
              [1,2,3].map(i => <div key={i} className="h-16 w-full bg-background-elevated animate-pulse rounded-xl border border-border-subtle" />)
            ) : (
              profiles.map(profile => (
                <button
                  key={profile.id}
                  onClick={() => setActiveProfile(profile)}
                  className={`w-full text-left p-4 rounded-xl border transition-all group ${
                    activeProfile?.id === profile.id 
                    ? 'bg-neural-purple/10 border-neural-purple/40 shadow-sm' 
                    : 'bg-background-elevated border-border-default hover:border-border-hover'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-bold uppercase tracking-wide ${activeProfile?.id === profile.id ? 'text-neural-purple' : 'text-foreground'}`}>
                        {profile.name}
                      </p>
                      <p className="text-[10px] font-mono text-foreground-subtle uppercase">{profile.lang} // {profile.accent}</p>
                    </div>
                    {profile.is_active && (
                      <Badge variant="ghost" className="bg-success/5 border-success/20 text-success text-[8px]">ACTIVE</Badge>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Calibration Panel */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-8 border-border-default bg-background-elevated/30 backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h3 className="text-xs font-mono text-foreground-subtle uppercase tracking-widest flex items-center gap-2">
                  <Binary className="w-3 h-3" /> Synthesis_Core
                </h3>
                
                <div className="space-y-4">
                  <TunerSlider 
                    label="Vocal_Pitch" 
                    value={activeProfile?.pitch || 1.0} 
                    onChange={(val) => updateWeight('pitch', val)}
                  />
                  <TunerSlider 
                    label="Synthesis_Rate" 
                    value={activeProfile?.rate || 1.0} 
                    onChange={(val) => updateWeight('rate', val)}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xs font-mono text-foreground-subtle uppercase tracking-widest flex items-center gap-2">
                  <BarChart3 className="w-3 h-3" /> Logic_Bias
                </h3>
                
                <div className="space-y-4">
                  <TunerSlider 
                    label="Emotion_Weight" 
                    value={activeProfile?.emotion_weight || 0.5} 
                    color="bg-secondary" 
                    onChange={(val) => updateWeight('emotion_weight', val)}
                  />
                  <TunerSlider 
                    label="Reasoning_Depth" 
                    value={activeProfile?.logic_weight || 0.8} 
                    color="bg-neural-purple" 
                    onChange={(val) => updateWeight('logic_weight', val)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-border-default flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-1">
                <p className="text-xs font-mono text-foreground-subtle uppercase">ESTIMATED_RE-TRAIN_TIME</p>
                <p className="text-sm font-bold text-foreground">~ 12 Minutes (Local CPU)</p>
              </div>
              <div className="flex gap-4">
                <Button 
                  variant="ghost" 
                  className="text-foreground-muted border border-border-default hover:bg-foreground/5"
                  onClick={() => fetchProfiles()}
                >
                  Discard_Changes
                </Button>
                <Button 
                  variant="secondary" 
                  className="gap-2 border-neural-purple/20 text-neural-purple hover:bg-neural-purple/5"
                  onClick={startTraining}
                >
                  <Save className="w-4 h-4" />
                  Save_&_Apply
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const TunerSlider: FC<{ label: string, value: number, color?: string, onChange: (val: number) => void }> = ({ label, value, color = 'bg-cyber-cyan', onChange }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <label className="text-[10px] font-mono text-foreground-muted uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-3">
        <button 
          onClick={() => onChange(Math.max(0.1, value - 0.05))}
          className="text-foreground-subtle hover:text-cyber-cyan transition-colors"
        >
          -
        </button>
        <span className="text-[10px] font-mono text-foreground font-bold w-12 text-center">{value.toFixed(2)}</span>
        <button 
          onClick={() => onChange(Math.min(2.0, value + 0.05))}
          className="text-foreground-subtle hover:text-cyber-cyan transition-colors"
        >
          +
        </button>
      </div>
    </div>
    <div 
      className="h-1.5 w-full bg-background-base rounded-full border border-border-default p-0.5 overflow-hidden cursor-pointer"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = x / rect.width;
        onChange(Number((pct * 2).toFixed(2)));
      }}
    >
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${(value / 2) * 100}%` }}
        className={`h-full ${color} rounded-full`}
      />
    </div>
  </div>
);
