import { FC } from 'react';
import { useJarvisStore } from '../../store/jarvisStore';
import { APP_VERSION } from '../../config';

export const Footer: FC = () => {
  const { language } = useJarvisStore();

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-border-subtle bg-background-overlay/60 backdrop-blur-md">
      <div className="container-fluid flex items-center justify-between h-10">
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-mono text-foreground-subtle uppercase tracking-wider">
            JARVIS v{APP_VERSION}
          </span>
          <span className="text-[9px] font-mono text-foreground-subtle uppercase tracking-wider">
            Neural Core Active
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-mono text-foreground-subtle uppercase tracking-wider">
            Lang: <span className="text-foreground font-semibold">{language}</span>
          </span>
          <span className="text-[9px] font-mono text-foreground-subtle uppercase tracking-wider">
            Runtime: Vite
          </span>
        </div>
      </div>
    </footer>
  );
};
