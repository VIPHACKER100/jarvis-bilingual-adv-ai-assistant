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
  variant = 'underline',
}) => {
  if (tabs.length === 0) return null;

  return (
    <div
      className={`flex items-center gap-1 ${
        variant === 'underline' ? 'border-b border-border-subtle' : ''
      } ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[-2px] ${
              isActive ? 'text-accent' : 'text-foreground-subtle hover:text-foreground'
            }`}
          >
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.08em]">
              {tab.label}
            </span>
            {isActive && variant === 'underline' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]"
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
            {isActive && variant === 'pill' && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-accent/10 rounded-lg -z-10"
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
