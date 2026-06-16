import React from 'react';
import { AlertTriangle, X, Mic, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'hi';
}

export const PermissionModal: React.FC<PermissionModalProps> = ({ isOpen, onClose, language }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-background-deep/80 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.19, 1, 0.22, 1] }}
        className="relative w-full max-w-md glass-panel--high border border-danger/30 overflow-hidden"
      >
        <div className="scanline pointer-events-none" />
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-danger-soft flex items-center justify-center border border-danger/20">
                <AlertTriangle className="w-5 h-5 text-danger" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  {language === 'hi' ? 'माइक्रोफ़ोन अनुमति' : 'Microphone Access Required'}
                </h2>
                <p className="text-xs text-foreground-muted mt-0.5">Severity: Medium</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-high text-foreground-subtle hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 p-3 mb-4 bg-danger-soft border border-danger/20 rounded-lg">
            <Mic className="w-4 h-4 text-danger flex-shrink-0" />
            <p className="text-xs text-danger font-medium">
              {language === 'hi'
                ? 'माइक्रोफ़ोन अनुमति अस्वीकृत'
                : 'Access Denied: MIC_INPUT_STREAM_LOCKED'}
            </p>
          </div>

          <p className="text-sm text-foreground-muted leading-relaxed mb-8">
            {language === 'hi'
              ? 'JARVIS को सक्रिय होने के लिए ऑडियो इनपुट की आवश्यकता है। कृपया अपने ब्राउज़र सेटिंग्स में माइक्रोफ़ोन की अनुमति दें।'
              : 'JARVIS requires microphone access for voice interaction. Please allow microphone permissions in your browser settings to enable full functionality.'}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-mono text-foreground-subtle">
              <ShieldAlert className="w-3 h-3" />
              <span>Error: 0x80070005</span>
            </div>
            <Button variant="danger" onClick={onClose} size="sm">
              {language === 'hi' ? 'स्वीकार करें' : 'Acknowledge'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
