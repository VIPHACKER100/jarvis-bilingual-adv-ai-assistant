import { FC, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Mic, Shield } from 'lucide-react';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'hi';
}

export const PermissionModal: FC<PermissionModalProps> = ({ isOpen, onClose, language }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const isHindi = language === 'hi';

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background-deep/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label={isHindi ? "माइक्रोफ़ोन अनुमति" : "Microphone Permission"}
        >
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: [0.19, 1, 0.22, 1] }}
            className="relative w-full max-w-md border border-red-500/40 rounded-xl overflow-hidden shadow-[0_0_60px_rgba(239,68,68,0.15)] bg-surface-low"
          >
            <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.03)_1px,transparent_1px)] bg-[size:4px_4px] pointer-events-none" />

            <div className="relative z-10 p-6">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/30">
                    <Shield className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-red-400 tracking-wider font-mono flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 animate-pulse" />
                      SYSTEM ALERT
                    </h2>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-foreground-muted hover:text-foreground transition-all"
                  title={isHindi ? "बंद करें" : "Close"}
                  aria-label={isHindi ? "डायलॉग बंद करें" : "Close dialog"}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="font-mono text-sm border-l-2 border-red-500/30 pl-3 text-red-300">
                  {isHindi
                    ? "CRITICAL: माइक्रोफ़ोन एक्सेस अस्वीकार कर दिया गया।"
                    : "CRITICAL: Microphone access denied."}
                </p>

                <div className="flex items-start gap-3 p-3 bg-background-deep/50 border border-border-default rounded-lg">
                  <Mic className="w-5 h-5 text-foreground-muted mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground-muted leading-relaxed">
                    {isHindi
                      ? "JARVIS को सक्रिय होने के लिए ऑडियो इनपुट की आवश्यकता है। कृपया अपने ब्राउज़र सेटिंग्स (URL बार में लॉक आइकन) में माइक्रोफ़ोन की अनुमति दें और पुनः प्रयास करें।"
                      : "JARVIS requires audio input execution privileges. Please update your browser site settings (Lock icon in URL bar) to allow microphone access and re-initialize."}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleClose}
                  className="px-5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/40 rounded-lg text-xs tracking-wider transition-all uppercase font-bold font-mono"
                  title={isHindi ? "समझ गया" : "Acknowledge"}
                  aria-label={isHindi ? "स्वीकार करें" : "Acknowledge"}
                >
                  {isHindi ? "समझ गया" : "ACKNOWLEDGE"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
