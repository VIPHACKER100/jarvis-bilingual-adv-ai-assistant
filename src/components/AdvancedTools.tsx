import React, { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language } from '../types';
import { useJarvisStore } from '../store/jarvisStore';
import { DesktopControls } from './DesktopControls';
import { MediaTools } from './MediaTools';
import { Button } from './ui/Button';
import { ChevronDown, ChevronUp, Wrench } from 'lucide-react';

export const AdvancedTools: FC = () => {
  const { language, showAdvanced, setShowAdvanced } = useJarvisStore();
  const langCode = language === Language.HINDI ? 'hi' : 'en';

  return (
    <div className="w-full flex flex-col items-center gap-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowAdvanced(!showAdvanced)}
        leftIcon={<Wrench className="w-3.5 h-3.5" />}
        rightIcon={showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        className="text-[10px] tracking-[0.3em] uppercase opacity-60 hover:opacity-100 transition-opacity"
      >
        {showAdvanced ? 'Deactivate_Advanced_Access' : 'Activate_Advanced_Interface'}
      </Button>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl"
          >
            <DesktopControls language={langCode} />
            <MediaTools language={langCode} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
