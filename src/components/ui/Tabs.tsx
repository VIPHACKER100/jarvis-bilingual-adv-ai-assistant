import React, { FC } from 'react';
import { motion } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'underline' | 'pill';
}

export const Tabs: FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  variant = 'underline'
}) => {
  return (
    <div className={`flex items-center gap-1 border-b border-border-subtle mb-6 ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              isActive ? 'text-accent' : 'text-foreground-subtle hover:text-foreground'
            }`}
          >
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            <span className="uppercase tracking-widest text-[10px] font-mono">{tab.label}</span>
            
            {isActive && variant === 'underline' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-accent shadow-[0_0_8px_rgba(94,106,210,0.5)]"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            
            {isActive && variant === 'pill' && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-accent/10 rounded-lg -z-10"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
