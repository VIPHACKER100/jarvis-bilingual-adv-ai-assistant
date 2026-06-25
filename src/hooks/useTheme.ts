/**
 * Theme Management Hook
 * 
 * Provides theme configuration and management functionality for the JARVIS interface.
 * Integrates with the centralized theme system to ensure consistent styling.
 * 
 * Requirements addressed:
 * - 1.1-1.6: Cyberpunk color palette management
 * - Theme switching and persistence
 * - CSS custom properties application
 */

import { useEffect, useState, useCallback } from 'react';
import { theme, ThemeMode, applyTheme, getTheme, type ThemeColors } from '../styles/theme';

// ══════════════════════════════════════════════════════════════════════
// Theme Storage Key
// ══════════════════════════════════════════════════════════════════════

const THEME_STORAGE_KEY = 'jarvis-theme-mode';

// ══════════════════════════════════════════════════════════════════════
// Theme Hook Interface
// ══════════════════════════════════════════════════════════════════════

export interface UseThemeReturn {
  /** Current theme mode */
  mode: ThemeMode;
  
  /** Current theme colors */
  colors: ThemeColors;
  
  /** Whether the current theme is dark */
  isDark: boolean;
  
  /** Whether the current theme is light */
  isLight: boolean;
  
  /** Switch to dark theme */
  setDark: () => void;
  
  /** Switch to light theme */
  setLight: () => void;
  
  /** Toggle between dark and light themes */
  toggle: () => void;
  
  /** Set specific theme mode */
  setMode: (mode: ThemeMode) => void;
  
  /** Get theme value by path (e.g., 'colors.primary.DEFAULT') */
  getThemeValue: (path: string) => string | undefined;
  
  /** Check if system prefers dark mode */
  systemPrefersDark: boolean;
}

// ══════════════════════════════════════════════════════════════════════
// Theme Hook Implementation
// ══════════════════════════════════════════════════════════════════════

export function useTheme(): UseThemeReturn {
  // System preference detection
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true; // Default to dark on SSR
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Current theme mode state
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return theme.config.defaultMode;
    
    // Try to get saved theme from localStorage
    const savedMode = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode;
    if (savedMode && theme.config.modes.includes(savedMode)) {
      return savedMode;
    }
    
    // Fall back to system preference or default
    return systemPrefersDark ? 'dark' : theme.config.defaultMode;
  });

  // Current theme colors
  const colors = getTheme(mode);
  
  // Computed properties
  const isDark = mode === 'dark';
  const isLight = mode === 'light';

  // ══════════════════════════════════════════════════════════════════════
  // Theme Mode Setters
  // ══════════════════════════════════════════════════════════════════════

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    
    // Persist to localStorage
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
    
    // Apply theme to DOM
    applyTheme(newMode);
  }, []);

  const setDark = useCallback(() => setMode('dark'), [setMode]);
  const setLight = useCallback(() => setMode('light'), [setMode]);
  
  const toggle = useCallback(() => {
    setMode(isDark ? 'light' : 'dark');
  }, [isDark, setMode]);

  // ══════════════════════════════════════════════════════════════════════
  // Theme Value Getter
  // ══════════════════════════════════════════════════════════════════════

  const getThemeValue = useCallback((path: string): string | undefined => {
    const parts = path.split('.');
    let current: any = colors;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    
    return typeof current === 'string' ? current : undefined;
  }, [colors]);

  // ══════════════════════════════════════════════════════════════════════
  // Effects
  // ══════════════════════════════════════════════════════════════════════

  // Listen for system color scheme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply theme on mode change
  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  // Initial theme application
  useEffect(() => {
    applyTheme(mode);
  }, []);

  return {
    mode,
    colors,
    isDark,
    isLight,
    setDark,
    setLight,
    toggle,
    setMode,
    getThemeValue,
    systemPrefersDark,
  };
}

// ══════════════════════════════════════════════════════════════════════
// Theme Utilities for Components
// ══════════════════════════════════════════════════════════════════════

/**
 * Get CSS class names for theme-aware styling
 */
export function useThemeClasses() {
  const { isDark, isLight } = useTheme();
  
  return {
    isDark,
    isLight,
    themeClass: isDark ? 'theme-dark' : 'theme-light',
    bgClass: 'bg-background-base',
    textClass: 'text-text-primary',
    borderClass: 'border-border-default',
  };
}

/**
 * Hook for getting responsive breakpoint information
 */
export function useBreakpoint() {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<keyof typeof theme.breakpoints>('desktop');
  
  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width < theme.breakpoints.mobile) {
        setCurrentBreakpoint('mobile');
      } else if (width < theme.breakpoints.tablet) {
        setCurrentBreakpoint('tablet');  
      } else if (width < theme.breakpoints.desktop) {
        setCurrentBreakpoint('desktop');
      } else {
        setCurrentBreakpoint('wide');
      }
    };
    
    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);
  
  return {
    current: currentBreakpoint,
    isMobile: currentBreakpoint === 'mobile',
    isTablet: currentBreakpoint === 'tablet',
    isDesktop: currentBreakpoint === 'desktop',
    isWide: currentBreakpoint === 'wide',
    breakpoints: theme.breakpoints,
  };
}

/**
 * Hook for animation configurations
 */
export function useAnimationConfig() {
  return {
    duration: theme.animation.duration,
    easing: theme.animation.easing,
    transition: theme.animation.transition,
  };
}

/**
 * Hook for accessing spacing values
 */
export function useSpacing() {
  return {
    spacing: theme.spacing,
    grid: theme.components,
  };
}

export default useTheme;