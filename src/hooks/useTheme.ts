import { useState, useEffect } from 'react';

export type ThemeName = 'cyan' | 'red' | 'green' | 'purple' | 'gold';

export interface JarvisTheme {
  name: ThemeName;
  label: string;
  description: string;
  emoji: string;
  primary: string;
  primaryRgb: string;
  glow: string;
  accent: string;
  accentRgb: string;
}

export const THEMES: JarvisTheme[] = [
  {
    name: 'cyan',
    label: 'Arc Reactor Blue',
    description: "Default JARVIS cyan — Tony Stark's signature",
    emoji: '🔵',
    primary: '#06b6d4',
    primaryRgb: '6, 182, 212',
    glow: 'rgba(6, 182, 212, 0.6)',
    accent: '#0ea5e9',
    accentRgb: '14, 165, 233',
  },
  {
    name: 'red',
    label: 'Sith Red',
    description: 'Dark side power — commanding red',
    emoji: '🔴',
    primary: '#ef4444',
    primaryRgb: '239, 68, 68',
    glow: 'rgba(239, 68, 68, 0.6)',
    accent: '#f97316',
    accentRgb: '249, 115, 22',
  },
  {
    name: 'green',
    label: 'Hulk Green',
    description: 'Gamma-powered emerald force',
    emoji: '🟢',
    primary: '#22c55e',
    primaryRgb: '34, 197, 94',
    glow: 'rgba(34, 197, 94, 0.6)',
    accent: '#86efac',
    accentRgb: '134, 239, 172',
  },
  {
    name: 'purple',
    label: 'Vibranium Purple',
    description: 'Wakandan vibranium — mystic purple',
    emoji: '🟣',
    primary: '#a855f7',
    primaryRgb: '168, 85, 247',
    glow: 'rgba(168, 85, 247, 0.6)',
    accent: '#c084fc',
    accentRgb: '192, 132, 252',
  },
  {
    name: 'gold',
    label: 'Infinity Gold',
    description: 'All-powerful infinity stone gold',
    emoji: '🟡',
    primary: '#f59e0b',
    primaryRgb: '245, 158, 11',
    glow: 'rgba(245, 158, 11, 0.6)',
    accent: '#fcd34d',
    accentRgb: '252, 211, 77',
  },
];

const STORAGE_KEY = 'jarvis-theme';

function applyTheme(theme: JarvisTheme) {
  const root = document.documentElement;
  root.style.setProperty('--neon-blue', theme.primary);
  root.style.setProperty('--neon-glow', theme.glow);
  root.style.setProperty('--neon-rgb', theme.primaryRgb);
  root.style.setProperty('--accent-color', theme.accent);
  root.style.setProperty('--accent-rgb', theme.accentRgb);
  root.setAttribute('data-theme', theme.name);
}

export function useTheme() {
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    return (localStorage.getItem(STORAGE_KEY) as ThemeName) || 'cyan';
  });

  const currentTheme = THEMES.find(t => t.name === themeName) ?? THEMES[0];

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  const changeTheme = (name: ThemeName) => {
    setThemeName(name);
    localStorage.setItem(STORAGE_KEY, name);
  };

  return { themeName, currentTheme, changeTheme, themes: THEMES };
}
