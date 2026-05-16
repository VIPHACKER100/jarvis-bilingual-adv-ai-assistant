import React, { FC } from 'react';
import { ExternalLink, Globe, Code2, Briefcase, Camera } from 'lucide-react';
import { APP_VERSION } from '../../config';

const SOCIAL_LINKS = [
  { label: 'Website', href: 'https://aryanahirwar.in', Icon: Globe },
  { label: 'GitHub', href: 'https://github.com/viphacker100', Icon: Code2 },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/viphacker100', Icon: Briefcase },
  { label: 'Instagram', href: 'https://instagram.com/viphacker100', Icon: Camera },
];

export const Footer: FC = () => {
  return (
    <footer className="relative w-full flex flex-col items-center space-y-5 z-20 mt-auto py-10 bg-background-deep/80 backdrop-blur-sm border-t border-border-default">
      <div className="flex flex-wrap justify-center gap-4">
        {SOCIAL_LINKS.map(({ label, href, Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit ${label}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border-default text-foreground-muted hover:text-accent hover:border-accent/30 hover:bg-surface-hover transition-all group text-[10px] md:text-xs font-mono tracking-widest uppercase"
          >
            <Icon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>{label}</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
          </a>
        ))}
      </div>
      <div className="text-foreground-muted/40 text-[8px] md:text-[9px] tracking-[0.4em] font-light uppercase text-center px-4 leading-loose">
        VIPHACKER100 OS {APP_VERSION} | DESIGNED & DEVELOPED BY <br className="md:hidden" />
        <span className="text-foreground-muted/60 font-bold border-b border-border-default">VIPHACKER100 (ARYAN AHIRWAR)</span>
      </div>
    </footer>
  );
};
