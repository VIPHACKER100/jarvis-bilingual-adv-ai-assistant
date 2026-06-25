/**
 * SidebarNav — Collapsible sidebar navigation
 *
 * Links to all views with icons and labels.
 * Collapsed mode shows only icons (with title/aria-label).
 */

import { NavLink } from 'react-router-dom';
import {
  Home,
  Settings,
  Clock,
  Smartphone,
  Bot,
  FolderOpen,
  LayoutGrid,
  Shield,
  MessageCircle,
  Monitor,
  MousePointerClick,
  Image,
  Brain,
  Info,
  ChevronLeft,
} from 'lucide-react';

interface SidebarNavProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { to: '/hud', label: 'Neural HUD', icon: <Home className="h-5 w-5" /> },
  { to: '/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
  { to: '/timeline', label: 'Timeline', icon: <Clock className="h-5 w-5" /> },
  { to: '/sync', label: 'Device Sync', icon: <Smartphone className="h-5 w-5" /> },
  { to: '/automation', label: 'Automation', icon: <Bot className="h-5 w-5" /> },
  { to: '/files', label: 'Files', icon: <FolderOpen className="h-5 w-5" /> },
  { to: '/windows', label: 'Windows', icon: <LayoutGrid className="h-5 w-5" /> },
  { to: '/security', label: 'Security', icon: <Shield className="h-5 w-5" /> },
  { to: '/whatsapp', label: 'WhatsApp', icon: <MessageCircle className="h-5 w-5" /> },
  { to: '/desktop', label: 'Desktop', icon: <Monitor className="h-5 w-5" /> },
  { to: '/input', label: 'Input', icon: <MousePointerClick className="h-5 w-5" /> },
  { to: '/media-tools', label: 'Media Tools', icon: <Image className="h-5 w-5" /> },
  { to: '/training', label: 'Training', icon: <Brain className="h-5 w-5" /> },
  { to: '/about', label: 'About', icon: <Info className="h-5 w-5" /> },
];

export function SidebarNav({ collapsed, onToggle }: SidebarNavProps) {
  return (
    <aside
      className={`flex flex-col border-r border-cyan-500/20 bg-cyber-surface/30 backdrop-blur-xl transition-all duration-300 ease-spring ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Logo area */}
      <div className="flex h-14 items-center justify-center border-b border-cyan-500/20 shrink-0">
        {collapsed ? (
          <span className="neon-text-cyan text-xl font-bold font-display">J</span>
        ) : (
          <span className="neon-text-cyan text-lg font-bold font-display tracking-widest">
            JARVIS
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-1 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={item.label}
            aria-label={item.label}
            end={item.to === '/hud'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,212,255,0.08)]'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/5 hover:border hover:border-cyan-500/10'
              }`
            }
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && (
              <span className="text-sm font-display font-semibold tracking-wide truncate">
                {item.label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-cyan-500/20 p-2 shrink-0">
        <button
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-cyan-300 hover:bg-cyan-500/5 transition-all duration-200"
        >
          <ChevronLeft
            className={`h-4 w-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
    </aside>
  );
}
