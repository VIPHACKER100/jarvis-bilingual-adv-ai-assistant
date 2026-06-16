import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'hi';
}

export const PermissionModal: React.FC<PermissionModalProps> = ({ isOpen, onClose, language }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="hud-panel border-security-rose/40 max-w-md w-full p-8 shadow-[0_0_80px_rgba(255,59,105,0.15)] relative overflow-hidden bg-security-rose/[0.02]"
      >
        {/* Optical Scanning Flourish */}
        <div className="absolute inset-0 scanline opacity-20 pointer-events-none" />
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-security-rose/40" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-security-rose/40" />

        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-sm bg-security-rose/10 flex items-center justify-center border border-security-rose/30 relative">
              <AlertTriangle className="w-5 h-5 text-security-rose animate-pulse" />
              <div className="absolute inset-0 bg-security-rose/5 animate-ping rounded-sm" />
            </div>
            <div>
              <h2 className="label-caps text-xs text-security-rose tracking-[0.3em] font-bold">
                System_Access_Fault
              </h2>
              <p className="label-caps text-[8px] opacity-40 font-mono mt-1">Severity: Critical // Protocol: Auth_Required</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-foreground-subtle hover:text-security-rose transition-colors p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnostic Feed */}
        <div className="space-y-6">
          <div className="p-4 bg-security-rose/5 border-l-2 border-security-rose/50 rounded-r-sm">
             <p className="label-caps text-[10px] text-security-rose font-bold tracking-widest">
               {language === 'hi' 
                 ? "त्रुटि: माइक्रोफ़ोन अनुमति अस्वीकृत" 
                 : "Access_Denied: MIC_INPUT_STREAM_LOCKED"}
             </p>
          </div>
          
          <p className="text-sm text-foreground/80 leading-relaxed font-sans px-2">
             {language === 'hi'
               ? "JARVIS को सक्रिय होने के लिए ऑडियो इनपुट की आवश्यकता है। कृपया अपने ब्राउज़र सेटिंग्स में माइक्रोफ़ोन की अनुमति दें।"
               : "Neural processing initialization failed. JARVIS requires high-fidelity audio stream privileges to engage voice heuristic models. Please authorize microphone access in system settings."}
          </p>

          {/* Technical Telemetry Bits */}
          <div className="grid grid-cols-2 gap-4 mt-8 opacity-40">
            <div className="flex flex-col gap-1">
              <span className="label-caps text-[7px] tracking-widest">Error_Code: 0x80070005</span>
              <div className="h-1 w-full bg-security-rose/20 rounded-full" />
            </div>
            <div className="flex flex-col gap-1 text-right">
              <span className="label-caps text-[7px] tracking-widest">Node: MIC_LOCKED</span>
              <div className="h-1 w-full bg-security-rose/20 rounded-full" />
            </div>
          </div>
        </div>

        {/* Tactical Footer */}
        <div className="mt-10 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-security-rose/10 hover:bg-security-rose/20 text-security-rose border border-security-rose/30 rounded-sm text-[10px] tracking-[0.3em] transition-all uppercase font-bold font-mono shadow-[0_0_15px_rgba(255,59,105,0.1)] hover:shadow-[0_0_25px_rgba(255,59,105,0.2)]"
          >
            {language === 'hi' ? "स्वीकार करें" : "Acknowledge_Error"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};