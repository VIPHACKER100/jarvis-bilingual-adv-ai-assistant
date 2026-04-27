import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'hi';
}

export const PermissionModal: React.FC<PermissionModalProps> = ({ isOpen, onClose, language }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="glass-panel border-red-500/30 max-w-md w-full p-6 shadow-[0_0_50px_rgba(239,68,68,0.1)] relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <h2 className="text-xs font-bold text-red-500 tracking-[0.3em] uppercase font-mono">
              System_Restriction
            </h2>
          </div>
          <button onClick={onClose} className="text-foreground-muted hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-3 bg-red-500/5 border-l-2 border-red-500/50 rounded-r-lg">
             <p className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-tight">
               {language === 'hi' 
                 ? "त्रुटि: माइक्रोफ़ोन अनुमति अस्वीकृत" 
                 : "Access_Denied: MIC_INPUT_LOCKED"}
             </p>
          </div>
          
          <p className="text-sm text-foreground/80 leading-relaxed font-sans">
             {language === 'hi'
               ? "JARVIS को सक्रिय होने के लिए ऑडियो इनपुट की आवश्यकता है। कृपया अपने ब्राउज़र सेटिंग्स में माइक्रोफ़ोन की अनुमति दें।"
               : "JARVIS requires audio input execution privileges to initialize neural patterns. Please update your browser site settings to allow microphone access."}
          </p>
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-[10px] tracking-widest transition-all uppercase font-bold font-mono"
          >
            {language === 'hi' ? "ठीक है" : "Acknowledge"}
          </button>
        </div>
      </div>
    </div>
  );
};