import { FC, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, X, Target, Zap, ShieldCheck } from 'lucide-react';

export interface VisionMetadata {
  source?: string;
  confidence?: string;
  language?: string;
}

interface VisionOverlayProps {
  isOpen: boolean;
  content: string;
  onClose: () => void;
  metadata?: VisionMetadata;
}

export const VisionOverlay: FC<VisionOverlayProps> = ({ isOpen, content, onClose, metadata }) => {
  const [displayText, setDisplayText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    if (isOpen && content) {
      let i = 0;
      setDisplayText('');
      const interval = setInterval(() => {
        setDisplayText(content.substring(0, i));
        i++;
        if (i > content.length) clearInterval(interval);
      }, 10);
      return () => clearInterval(interval);
    }
  }, [isOpen, content]);

  useEffect(() => {
    const interval = setInterval(() => setCursorVisible(v => !v), 500);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-8 bg-black/40 backdrop-blur-sm overflow-hidden">
      {/* HUD Tactical Overlays */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 scanline opacity-20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
        
        {/* Corner Brackets */}
        <motion.div 
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-10 border-[1px] border-accent/10" 
        />
        <div className="absolute top-12 left-12 w-24 h-24 border-t-4 border-l-4 border-accent shadow-[0_0_20px_rgba(76,215,246,0.3)]" />
        <div className="absolute top-12 right-12 w-24 h-24 border-t-4 border-r-4 border-accent shadow-[0_0_20px_rgba(76,215,246,0.3)]" />
        <div className="absolute bottom-12 left-12 w-24 h-24 border-b-4 border-l-4 border-accent shadow-[0_0_20px_rgba(76,215,246,0.3)]" />
        <div className="absolute bottom-12 right-12 w-24 h-24 border-b-4 border-r-4 border-accent shadow-[0_0_20px_rgba(76,215,246,0.3)]" />

        {/* Dynamic Crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div className="w-[80vw] h-px bg-accent/20" />
          <div className="h-[80vh] w-px bg-accent/20 absolute" />
          <Target className="w-12 h-12 text-accent/40 animate-spin-slow absolute" />
          <div className="w-24 h-24 border-2 border-accent/20 animate-ping absolute" />
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="hud-panel max-w-2xl w-full p-8 relative overflow-hidden bg-black/60 shadow-[0_0_100px_rgba(76,215,246,0.1)]"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent animate-shimmer" />
        
        <div className="flex justify-between items-start mb-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-sm bg-accent/10 border border-accent/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-accent animate-pulse" />
              </div>
              <div>
                <h3 className="label-caps text-xl font-bold tracking-[0.3em] text-white">
                  Vision_Extraction
                </h3>
                <span className="label-caps text-[9px] text-accent font-bold tracking-[0.2em] opacity-80 flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3" />
                  Neural_Stream_Sync: Active
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-foreground-subtle hover:text-accent transition-all p-2 hover:bg-accent/10 rounded-sm border border-transparent hover:border-accent/30"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-sm p-6 min-h-[250px] max-h-[450px] overflow-y-auto custom-scrollbar relative font-mono text-accent text-sm leading-relaxed backdrop-blur-md">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.02] to-transparent pointer-events-none" />
          <p className="relative z-10 whitespace-pre-wrap">
            {displayText}
            {cursorVisible && <span className="w-2 h-4 bg-accent inline-block ml-1 shadow-[0_0_8px_var(--accent)]" />}
          </p>
        </div>

        {metadata && (
          <div className="mt-8 grid grid-cols-2 gap-y-4 gap-x-8 px-2">
            <div className="flex flex-col gap-1">
              <span className="label-caps text-[8px] opacity-40">Data_Source</span>
              <span className="text-[10px] font-mono text-accent uppercase tracking-widest">{metadata.source || 'OPTICAL_SENSOR_01'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="label-caps text-[8px] opacity-40">Confidence_Rating</span>
              <span className="text-[10px] font-mono text-accent uppercase tracking-widest">{metadata.confidence || '99.87%'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="label-caps text-[8px] opacity-40">Heuristic_Language</span>
              <span className="text-[10px] font-mono text-accent uppercase tracking-widest">{metadata.language || 'NEURAL_AUTO'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="label-caps text-[8px] opacity-40">Extraction_Epoch</span>
              <span className="text-[10px] font-mono text-accent uppercase tracking-widest">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        )}

        <div className="mt-10 flex gap-6">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(content);
              onClose();
            }}
            className="flex-1 py-4 bg-accent/10 hover:bg-accent/20 text-accent font-bold label-caps text-xs tracking-[0.2em] rounded-sm transition-all border border-accent/30 shadow-[0_0_15px_rgba(76,215,246,0.1)] flex items-center justify-center gap-3"
          >
            <Copy className="w-4 h-4" />
            Commit_To_Buffer
          </button>
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-foreground-subtle font-bold label-caps text-xs tracking-[0.2em] rounded-sm transition-all border border-white/10"
          >
            Discard_Stream
          </button>
        </div>
      </motion.div>
    </div>
  );
};
