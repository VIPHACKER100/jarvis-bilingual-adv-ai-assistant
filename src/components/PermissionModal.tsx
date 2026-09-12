import React from 'react';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'hi';
}

export const PermissionModal: React.FC<PermissionModalProps> = ({ isOpen, onClose, language }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border-2 border-red-500/50 rounded-lg max-w-md w-full p-6 shadow-[0_0_50px_rgba(239,68,68,0.3)] relative overflow-hidden">
        {/* Scanline effect inside modal */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.05)_1px,transparent_1px)] bg-[size:4px_4px] pointer-events-none"></div>
        
        <h2 className="text-xl md:text-2xl font-bold text-red-500 tracking-widest mb-4 flex items-center gap-2 font-mono">
          <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          SYSTEM ALERT
        </h2>

        <div className="space-y-4 text-slate-300 relative z-10 font-sans">
          <p className="font-mono text-sm border-l-2 border-red-500/30 pl-3 text-red-200">
             {language === 'hi' 
               ? "CRITICAL: माइक्रोफ़ोन एक्सेस अस्वीकार कर दिया गया।" 
               : "CRITICAL: Microphone access denied."}
          </p>
          
          <p className="text-sm leading-relaxed">
             {language === 'hi'
               ? "JARVIS को सक्रिय होने के लिए ऑडियो इनपुट की आवश्यकता है। कृपया अपने ब्राउज़र सेटिंग्स (URL बार में लॉक आइकन) में माइक्रोफ़ोन की अनुमति दें और पुनः प्रयास करें।"
               : "JARVIS requires audio input execution privileges. Please update your browser site settings (Lock icon in URL bar) to allow microphone access and re-initialize."}
          </p>
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 px-6 py-2 rounded text-sm tracking-wider transition-colors uppercase font-bold font-mono"
          >
            {language === 'hi' ? "समझ गया" : "ACKNOWLEDGE"}
          </button>
        </div>
      </div>
    </div>
  );
};