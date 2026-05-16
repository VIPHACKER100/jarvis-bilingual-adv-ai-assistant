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

          <div className="pt-8 border-t border-border-default flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-xs font-mono text-foreground-subtle">ESTIMATED_RE-TRAIN_TIME</p>
              <p className="text-sm font-bold text-foreground">~ 12 Minutes (Local CPU)</p>
            </div>
            <Button 
              variant="ghost" 
              className="text-neural-purple border border-neural-purple/20 hover:bg-neural-purple/5"
              onClick={() => fetchProfiles()}
            >
              Reset_Weights
            </Button>
          </div>
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
