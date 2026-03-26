import { FC, useEffect, useState } from 'react';

interface VisionOverlayProps {
  isOpen: boolean;
  content: string;
  onClose: () => void;
  metadata?: any;
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
    <div className="fixed inset-0 z-[120] pointer-events-none flex items-center justify-center p-8 bg-cyan-950/20 backdrop-blur-[2px]">
      <div className="absolute inset-0 border-[20px] border-cyan-500/10 animate-pulse pointer-events-none" />
      
      {/* Corner Brackets */}
      <div className="absolute top-10 left-10 w-20 h-20 border-t-2 border-l-2 border-cyan-400" />
      <div className="absolute top-10 right-10 w-20 h-20 border-t-2 border-r-2 border-cyan-400" />
      <div className="absolute bottom-10 left-10 w-20 h-20 border-b-2 border-l-2 border-cyan-400" />
      <div className="absolute bottom-10 right-10 w-20 h-20 border-b-2 border-r-2 border-cyan-400" />

      {/* Target Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center">
        <div className="w-full h-px bg-cyan-400/50" />
        <div className="h-full w-px bg-cyan-400/50 absolute" />
        <div className="w-4 h-4 border border-cyan-400 animate-ping absolute" />
      </div>

      <div className="bg-black/80 border border-cyan-500/30 rounded-xl max-w-2xl w-full p-8 relative overflow-hidden pointer-events-auto shadow-[0_0_50px_rgba(6,182,212,0.2)]">
        {/* Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-px neon-glow-line" />
        
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col">
            <h3 className="text-xl font-bold tracking-[0.2em] text-white flex items-center gap-3">
              <span className="text-cyan-400 font-mono">VISION_EXTRACT</span>
              <span className="text-xs bg-cyan-500/20 px-2 py-0.5 rounded text-cyan-300">PROTOCOL_Active</span>
            </h3>
            <span className="text-[10px] text-cyan-500/60 font-mono uppercase mt-1">OCR Analytics // Data Stream 4-ZETA</span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-600 hover:text-white transition-all bg-white/5 p-2 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="bg-slate-900/50 border border-white/5 rounded-lg p-5 min-h-[200px] max-h-[400px] overflow-y-auto custom-scrollbar relative">
          <div className="font-mono text-cyan-200 text-sm leading-relaxed whitespace-pre-wrap">
            {displayText}
            {cursorVisible && <span className="w-2 h-4 bg-cyan-400 inline-block ml-1" />}
          </div>
          
          {metadata && (
            <div className="mt-8 pt-4 border-t border-white/5 grid grid-cols-2 gap-4 text-[9px] font-mono text-cyan-500 uppercase tracking-widest">
              <div>Source: {metadata.source || 'SCREEN_CAPTURE'}</div>
              <div>Confidence: {metadata.confidence || '98.2%'}</div>
              <div>Language: {metadata.language || 'DETECTION_AUTO'}</div>
              <div>Timestamp: {new Date().toLocaleTimeString()}</div>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-4">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(content);
              onClose();
            }}
            className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-widest rounded transition-all shadow-lg shadow-cyan-500/20"
          >
            Copy Data
          </button>
          <button 
            onClick={onClose}
            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-widest rounded transition-all border border-white/5"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
