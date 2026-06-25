/**
 * JARVIS Neural Interface - Centralized Theme Configuration
 * 
 * This file provides the central theme configuration that bridges CSS custom properties
 * and TypeScript/JavaScript usage, ensuring consistency across the application.
 * 
 * Requirements addressed:
 * - 1.1-1.6: Cyberpunk color palette implementation
 * - 13.5: 8px grid system spacing
 * - 6.1, 6.2, 6.4: Animation timing and performance
 * - 3.2, 3.3, 3.4: Responsive breakpoints
 */

// ══════════════════════════════════════════════════════════════════════
// Theme Mode Management
// ══════════════════════════════════════════════════════════════════════

export type ThemeMode = 'dark' | 'light';

export const themeConfig = {
  defaultMode: 'dark' as ThemeMode,
  modes: ['dark', 'light'] as const,
} as const;

// ══════════════════════════════════════════════════════════════════════
// Core Theme Definition
// ══════════════════════════════════════════════════════════════════════

export interface ThemeColors {
  // Background colors (Requirement 1.1)
  background: {
    deep: string;
    base: string;
    elevated: string;
    overlay: string;
    card: string;
  };

  // Primary accent (Requirement 1.2)
  primary: {
    DEFAULT: string;
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    bright: string;
    dark: string;
    soft: string;
    glow: string;
    rgb: string;
  };

  // Secondary accent (Requirement 1.3)
  secondary: {
    DEFAULT: string;
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    dark: string;
    soft: string;
    glow: string;
    rgb: string;
  };

  // Semantic colors (Requirement 1.4)
  success: {
    DEFAULT: string;
    50: string;
    500: string;
    600: string;
    soft: string;
    glow: string;
    rgb: string;
  };

  warning: {
    DEFAULT: string;
    50: string;
    500: string;
    600: string;
    soft: string;
    glow: string;
    rgb: string;
  };

  error: {
    DEFAULT: string;
    50: string;
    500: string;
    600: string;
    soft: string;
    glow: string;
    rgb: string;
  };

  // Text colors (Requirement 1.5)
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
    accent: string;
  };

  // Border colors (Requirement 1.6)
  border: {
    DEFAULT: string;
    hover: string;
    accent: string;
    subtle: string;
    focus: string;
  };

  // Surface colors
  surface: {
    DEFAULT: string;
    hover: string;
    low: string;
    mid: string;
    high: string;
    elevated: string;
  };
}

// ══════════════════════════════════════════════════════════════════════
// Dark Theme (Default) - Cyberpunk Palette
// ══════════════════════════════════════════════════════════════════════

export const darkTheme: ThemeColors = {
  background: {
    deep: '#050A12',
    base: '#050A12',
    elevated: '#0D1522',
    overlay: 'rgba(5, 10, 18, 0.92)',
    card: 'rgba(13, 21, 34, 0.8)',
  },

  primary: {
    DEFAULT: '#00D4FF',
    50: '#E6F9FF',
    100: '#CCF3FF',
    200: '#99E7FF',
    300: '#66DBFF',
    400: '#33CFFF',
    500: '#00D4FF',
    600: '#00A8CC',
    700: '#007A99',
    800: '#004C66',
    900: '#001E33',
    bright: '#33DFFF',
    dark: '#00A8CC',
    soft: 'rgba(0, 212, 255, 0.08)',
    glow: 'rgba(0, 212, 255, 0.35)',
    rgb: '0, 212, 255',
  },

  secondary: {
    DEFAULT: '#8B5CF6',
    50: '#F3F0FF',
    100: '#E7E0FF',
    200: '#CFC2FF',
    300: '#B7A3FF',
    400: '#9F85FF',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
    dark: '#7C3AED',
    soft: 'rgba(139, 92, 246, 0.08)',
    glow: 'rgba(139, 92, 246, 0.25)',
    rgb: '139, 92, 246',
  },

  success: {
    DEFAULT: '#00E58B',
    50: '#E6FFF5',
    500: '#00E58B',
    600: '#00B86F',
    soft: 'rgba(0, 229, 139, 0.12)',
    glow: 'rgba(0, 229, 139, 0.25)',
    rgb: '0, 229, 139',
  },

  warning: {
    DEFAULT: '#FFB020',
    50: '#FFF9E6',
    500: '#FFB020',
    600: '#E6991D',
    soft: 'rgba(255, 176, 32, 0.12)',
    glow: 'rgba(255, 176, 32, 0.25)',
    rgb: '255, 176, 32',
  },

  error: {
    DEFAULT: '#FF4D67',
    50: '#FFE6EA',
    500: '#FF4D67',
    600: '#E6445C',
    soft: 'rgba(255, 77, 103, 0.12)',
    glow: 'rgba(255, 77, 103, 0.25)',
    rgb: '255, 77, 103',
  },

  text: {
    primary: '#E6EDF7',
    secondary: '#94A3B8',
    muted: 'rgba(230, 237, 247, 0.55)',
    inverse: '#1A1D24',
    accent: '#00D4FF',
  },

  border: {
    DEFAULT: 'rgba(255, 255, 255, 0.08)',
    hover: 'rgba(255, 255, 255, 0.12)',
    accent: 'rgba(0, 212, 255, 0.35)',
    subtle: 'rgba(255, 255, 255, 0.05)',
    focus: 'rgba(0, 212, 255, 0.6)',
  },

  surface: {
    DEFAULT: 'rgba(255, 255, 255, 0.05)',
    hover: 'rgba(255, 255, 255, 0.08)',
    low: 'rgba(255, 255, 255, 0.03)',
    mid: 'rgba(255, 255, 255, 0.06)',
    high: 'rgba(255, 255, 255, 0.10)',
    elevated: '#1E293B',
  },
};

// ══════════════════════════════════════════════════════════════════════
// Spacing System - 8px Grid (Requirement 13.5)
// ══════════════════════════════════════════════════════════════════════

export const spacing = {
  // Base multipliers of 8px
  0: '0px',
  0.5: '2px',     // 0.25 * 8px = 2px
  1: '4px',       // 0.5 * 8px = 4px
  1.5: '6px',     // 0.75 * 8px = 6px
  2: '8px',       // 1 * 8px = 8px (base unit)
  2.5: '10px',    // 1.25 * 8px = 10px
  3: '12px',      // 1.5 * 8px = 12px
  3.5: '14px',    // 1.75 * 8px = 14px
  4: '16px',      // 2 * 8px = 16px
  5: '20px',      // 2.5 * 8px = 20px
  6: '24px',      // 3 * 8px = 24px
  7: '28px',      // 3.5 * 8px = 28px
  8: '32px',      // 4 * 8px = 32px
  9: '36px',      // 4.5 * 8px = 36px
  10: '40px',     // 5 * 8px = 40px
  12: '48px',     // 6 * 8px = 48px
  14: '56px',     // 7 * 8px = 56px
  16: '64px',     // 8 * 8px = 64px
  18: '72px',     // 9 * 8px = 72px (header height - Requirement 2.1)
  20: '80px',     // 10 * 8px = 80px
  24: '96px',     // 12 * 8px = 96px
  28: '112px',    // 14 * 8px = 112px
  32: '128px',    // 16 * 8px = 128px
  36: '144px',    // 18 * 8px = 144px
  40: '160px',    // 20 * 8px = 160px
  44: '176px',    // 22 * 8px = 176px
  48: '192px',    // 24 * 8px = 192px
  52: '208px',    // 26 * 8px = 208px
  56: '224px',    // 28 * 8px = 224px
  60: '240px',    // 30 * 8px = 240px
  64: '256px',    // 32 * 8px = 256px
  72: '288px',    // 36 * 8px = 288px
  80: '320px',    // 40 * 8px = 320px
  96: '384px',    // 48 * 8px = 384px
} as const;

// ══════════════════════════════════════════════════════════════════════
// Animation Configuration (Requirements 6.1, 6.2, 6.4)
// ══════════════════════════════════════════════════════════════════════

export const animation = {
  // Duration (Requirement 6.1 - 200ms, 6.4 - 100ms)
  duration: {
    instant: '0ms',
    fastest: '50ms',
    fast: '100ms',      // User interaction feedback (Requirement 6.4)
    normal: '200ms',    // Standard transitions (Requirement 6.1)
    slow: '300ms',
    slowest: '500ms',
  },

  // Easing functions
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    expo: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    back: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Predefined transitions
  transition: {
    fast: '100ms cubic-bezier(0.4, 0.0, 0.2, 1)',
    normal: '200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0.0, 0.2, 1)',
    all: 'all 200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
  },
} as const;

// ══════════════════════════════════════════════════════════════════════
// Responsive Breakpoints (Requirements 3.2, 3.3, 3.4)
// ══════════════════════════════════════════════════════════════════════

export const breakpoints = {
  mobile: 768,        // Mobile breakpoint (Requirement 3.4)
  tablet: 1024,       // Tablet breakpoint (Requirement 3.3) 
  desktop: 1200,      // Desktop breakpoint (Requirement 3.2)
  wide: 1440,         // Wide desktop
} as const;

export const mediaQueries = {
  mobile: `(max-width: ${breakpoints.mobile - 1}px)`,
  tablet: `(min-width: ${breakpoints.mobile}px) and (max-width: ${breakpoints.tablet - 1}px)`,
  desktop: `(min-width: ${breakpoints.tablet}px)`,
  wide: `(min-width: ${breakpoints.desktop}px)`,
} as const;

// ══════════════════════════════════════════════════════════════════════
// Typography System
// ══════════════════════════════════════════════════════════════════════

export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'JetBrains Mono, Monaco, Consolas, monospace',
    display: 'Inter, system-ui, sans-serif',
  },

  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
  },

  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  lineHeight: {
    none: 1,
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.08em',
  },
} as const;

// ══════════════════════════════════════════════════════════════════════
// Component Specifications
// ══════════════════════════════════════════════════════════════════════

export const components = {
  // Header component (Requirement 2.1)
  header: {
    height: spacing[18], // 72px
    padding: spacing[6], // 24px
    background: darkTheme.background.elevated,
    border: darkTheme.border.DEFAULT,
  },

  // Metrics cards (Requirement 2.2)
  metricsCard: {
    minHeight: '120px',
    padding: spacing[4], // 16px
    borderRadius: '12px',
    background: darkTheme.surface.DEFAULT,
  },

  // AI Core (Requirement 2.3)
  aiCore: {
    size: '200px',
    padding: spacing[6], // 24px
    borderRadius: '50%',
  },

  // Buttons
  button: {
    height: {
      sm: '32px',
      md: '40px',
      lg: '48px',
    },
    padding: {
      sm: `${spacing[2]} ${spacing[4]}`,   // 8px 16px
      md: `${spacing[3]} ${spacing[6]}`,   // 12px 24px
      lg: `${spacing[4]} ${spacing[8]}`,   // 16px 32px
    },
    borderRadius: spacing[2], // 8px
  },

  // Cards
  card: {
    padding: spacing[6],      // 24px
    borderRadius: spacing[4], // 16px
    background: darkTheme.surface.DEFAULT,
    border: darkTheme.border.DEFAULT,
  },

  // Inputs
  input: {
    height: '40px',
    padding: `${spacing[3]} ${spacing[4]}`, // 12px 16px
    borderRadius: spacing[2], // 8px
    background: darkTheme.background.elevated,
    border: darkTheme.border.DEFAULT,
  },
} as const;

// ══════════════════════════════════════════════════════════════════════
// Theme Utilities
// ══════════════════════════════════════════════════════════════════════

/**
 * Generate CSS custom properties for the theme
 */
export function generateCSSCustomProperties(theme: ThemeColors = darkTheme): Record<string, string> {
  return {
    // Background colors
    '--background-deep': theme.background.deep,
    '--background-base': theme.background.base,
    '--background-elevated': theme.background.elevated,
    '--background-overlay': theme.background.overlay,
    '--background-card': theme.background.card,

    // Primary colors
    '--primary': theme.primary.DEFAULT,
    '--primary-50': theme.primary[50],
    '--primary-500': theme.primary[500],
    '--primary-600': theme.primary[600],
    '--primary-bright': theme.primary.bright,
    '--primary-dark': theme.primary.dark,
    '--primary-soft': theme.primary.soft,
    '--primary-glow': theme.primary.glow,
    '--primary-rgb': theme.primary.rgb,

    // Secondary colors
    '--secondary': theme.secondary.DEFAULT,
    '--secondary-500': theme.secondary[500],
    '--secondary-600': theme.secondary[600],
    '--secondary-dark': theme.secondary.dark,
    '--secondary-soft': theme.secondary.soft,
    '--secondary-glow': theme.secondary.glow,
    '--secondary-rgb': theme.secondary.rgb,

    // Semantic colors
    '--success': theme.success.DEFAULT,
    '--success-soft': theme.success.soft,
    '--success-glow': theme.success.glow,
    '--warning': theme.warning.DEFAULT,
    '--warning-soft': theme.warning.soft,
    '--warning-glow': theme.warning.glow,
    '--error': theme.error.DEFAULT,
    '--error-soft': theme.error.soft,
    '--error-glow': theme.error.glow,

    // Text colors
    '--text-primary': theme.text.primary,
    '--text-secondary': theme.text.secondary,
    '--text-muted': theme.text.muted,
    '--text-inverse': theme.text.inverse,
    '--text-accent': theme.text.accent,

    // Border colors
    '--border-default': theme.border.DEFAULT,
    '--border-hover': theme.border.hover,
    '--border-accent': theme.border.accent,
    '--border-subtle': theme.border.subtle,
    '--border-focus': theme.border.focus,

    // Surface colors
    '--surface': theme.surface.DEFAULT,
    '--surface-hover': theme.surface.hover,
    '--surface-low': theme.surface.low,
    '--surface-mid': theme.surface.mid,
    '--surface-high': theme.surface.high,
    '--surface-elevated': theme.surface.elevated,

    // Spacing (8px grid system)
    '--space-0': spacing[0],
    '--space-1': spacing[1],
    '--space-2': spacing[2],
    '--space-3': spacing[3],
    '--space-4': spacing[4],
    '--space-6': spacing[6],
    '--space-8': spacing[8],
    '--space-12': spacing[12],
    '--space-16': spacing[16],
    '--space-18': spacing[18],

    // Animation
    '--transition-fast': animation.transition.fast,
    '--transition-normal': animation.transition.normal,
    '--transition-slow': animation.transition.slow,

    // Typography
    '--font-sans': typography.fontFamily.sans,
    '--font-mono': typography.fontFamily.mono,
  };
}

/**
 * Apply theme to document root
 */
export function applyTheme(mode: ThemeMode = 'dark'): void {
  const theme = mode === 'dark' ? darkTheme : darkTheme; // Light theme would be implemented here
  const customProperties = generateCSSCustomProperties(theme);
  
  const root = document.documentElement;
  
  // Apply CSS custom properties
  Object.entries(customProperties).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
  
  // Add theme class to body
  document.body.className = document.body.className.replace(/theme-\w+/g, '');
  document.body.classList.add(`theme-${mode}`);
}

/**
 * Get current theme values for use in JavaScript/TypeScript
 */
export function getTheme(mode: ThemeMode = 'dark'): ThemeColors {
  return mode === 'dark' ? darkTheme : darkTheme; // Light theme would be implemented here
}

// Default export
export const theme = {
  colors: darkTheme,
  spacing,
  animation,
  breakpoints,
  mediaQueries,
  typography,
  components,
  config: themeConfig,
  utils: {
    generateCSSCustomProperties,
    applyTheme,
    getTheme,
  },
} as const;

export default theme;