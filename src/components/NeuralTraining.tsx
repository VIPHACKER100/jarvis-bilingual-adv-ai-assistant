import React, { FC, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Mic2, Save, Play, Settings2, BarChart3, Binary, Waves } from 'lucide-react';
import { VoiceProfile } from '../types/api';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

export const NeuralTraining: FC = () => {
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<VoiceProfile | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const mockProfiles: VoiceProfile[] = [
      {
        id: 'vp-01',
        name: 'JARVIS_PRIME',
        gender: 'MALE',
        base_model: 'ElevenLabs_v2',
        pitch: 1.05,
        rate: 0.95,
        emotion_weight: 0.2,
        logic_weight: 0.8,
        last_trained: '2026-05-14T10:00:00Z',
        is_active: true
      },
      {
        id: 'vp-02',
        name: 'FRIDAY_OVERRIDE',
        gender: 'FEMALE',
        base_model: 'Neural_TTS_x64',
        pitch: 1.2,
        rate: 1.1,
        emotion_weight: 0.5,
        logic_weight: 0.5,
        last_trained: '2026-05-01T12:00:00Z',
        is_active: false
      }
    ];
    setProfiles(mockProfiles);
    setActiveProfile(mockProfiles[0]);
  }, []);

  const startTraining = () => {
    setIsTraining(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-neural-purple" />
            <h1 className="text-2xl font-display font-bold tracking-tight uppercase">Neural_Voice_Training</h1>
          </div>
          <p className="text-foreground-muted text-sm font-mono uppercase tracking-widest opacity-60">
            Voice Synthesis & Logic Weight Tuner // v3.9.0
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" className="gap-2">
            <Save className="w-4 h-4" />
            Export_Model
          </Button>
          <Button 
            variant="neon" 
            className={`gap-2 ${isTraining ? 'opacity-50' : ''}`}
            onClick={startTraining}
            disabled={isTraining}
          >
            <Play className={`w-4 h-4 ${isTraining ? 'animate-spin' : ''}`} />
            {isTraining ? 'TRAINING...' : 'INIT_TRAINING'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile List */}
        <div className="space-y-6">
          <h2 className="text-sm font-mono text-neural-purple uppercase tracking-[0.2em] font-bold">Voice_Profiles</h2>
          <div className="space-y-3">
            {profiles.map(profile => (
              <Card 
                key={profile.id}
                onClick={() => setActiveProfile(profile)}
                className={`cursor-pointer transition-all border-l-4 ${
                  activeProfile?.id === profile.id 
                  ? 'border-l-neural-purple bg-neural-purple/5 border-neural-purple/20' 
                  : 'border-l-transparent'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    activeProfile?.id === profile.id ? 'bg-neural-purple/20 text-neural-purple' : 'bg-background-base text-foreground-subtle'
                  }`}>
                    <Mic2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-mono tracking-tight">{profile.name}</h3>
                    <p className="text-[10px] text-foreground-subtle uppercase">{profile.base_model}</p>
                  </div>
                  {profile.is_active && (
                    <Badge variant="info" className="ml-auto text-[8px] px-1.5 bg-cyber-cyan/10">ACTIVE</Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <Card className="bg-background-elevated/50 border-dashed border-border-default hover:border-neural-purple/50 transition-colors cursor-pointer group">
            <div className="flex flex-col items-center py-6 gap-3">
              <div className="w-10 h-10 rounded-full bg-background-base border border-border-default flex items-center justify-center group-hover:text-neural-purple transition-colors">
                <Settings2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono text-foreground-subtle group-hover:text-foreground">CREATE_NEW_VARIANT</span>
            </div>
          </Card>
        </div>

        {/* Middle/Right Column: Tuner & Viz */}
        <div className="lg:col-span-2 space-y-8">
          {/* Waveform Visualization */}
          <Card className="bg-background-deep p-0 overflow-hidden relative h-48 border-neural-purple/20">
            <div className="absolute inset-0 flex items-center justify-center gap-1">
              {[...Array(40)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    height: isTraining ? [20, 80, 40, 90, 20] : [30, 40, 30],
                    opacity: isTraining ? [0.2, 0.8, 0.4] : 0.2
                  }}
                  transition={{ 
                    duration: 1, 
                    repeat: Infinity, 
                    delay: i * 0.05,
                    ease: "easeInOut"
                  }}
                  className="w-1 bg-neural-purple rounded-full"
                />
              ))}
            </div>
            <div className="absolute top-4 left-6 flex items-center gap-2">
              <Waves className="w-4 h-4 text-neural-purple" />
              <span className="text-[10px] font-mono text-neural-purple uppercase tracking-widest">Neural_Waveform_Buffer</span>
            </div>
            {isTraining && (
              <div className="absolute bottom-4 right-6 flex items-center gap-4">
                <span className="text-[10px] font-mono text-neural-purple uppercase">Accuracy: 94.2%</span>
                <div className="w-32 h-1 bg-background-base rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-neural-purple" 
                    animate={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Tuner Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xs font-mono text-foreground-subtle uppercase tracking-widest flex items-center gap-2">
                <Binary className="w-3 h-3" /> Voice_Parameters
              </h3>
              
              <div className="space-y-4">
                <TunerSlider label="Vocal_Pitch" value={activeProfile?.pitch || 1.0} />
                <TunerSlider label="Synthesis_Rate" value={activeProfile?.rate || 1.0} />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-mono text-foreground-subtle uppercase tracking-widest flex items-center gap-2">
                <BarChart3 className="w-3 h-3" /> Logic_Bias
              </h3>
              
              <div className="space-y-4">
                <TunerSlider label="Emotion_Weight" value={activeProfile?.emotion_weight || 0.5} color="bg-secondary" />
                <TunerSlider label="Reasoning_Depth" value={activeProfile?.logic_weight || 0.8} color="bg-neural-purple" />
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border-default flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-xs font-mono text-foreground-subtle">ESTIMATED_RE-TRAIN_TIME</p>
              <p className="text-sm font-bold text-foreground">~ 12 Minutes (Local CPU)</p>
            </div>
            <Button variant="ghost" className="text-neural-purple border border-neural-purple/20 hover:bg-neural-purple/5">
              Reset_Weights
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TunerSlider: FC<{ label: string, value: number, color?: string }> = ({ label, value, color = 'bg-cyber-cyan' }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <label className="text-[10px] font-mono text-foreground-muted uppercase tracking-wider">{label}</label>
      <span className="text-[10px] font-mono text-foreground font-bold">{value.toFixed(2)}</span>
    </div>
    <div className="h-1.5 w-full bg-background-base rounded-full border border-border-default p-0.5 overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${(value / 2) * 100}%` }}
        className={`h-full ${color} rounded-full`}
      />
    </div>
  </div>
);
