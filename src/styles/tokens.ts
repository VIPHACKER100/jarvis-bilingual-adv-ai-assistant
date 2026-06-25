/**
 * JARVIS Neural Interface Design Tokens
 * 
 * Comprehensive design system tokens that support the cyberpunk theme
 * with Iron Man HUD aesthetics per Requirements 1.1-1.6
 */

// ══════════════════════════════════════════════════════════════════════
// Color Tokens - Cyberpunk Palette (Requirements 1.1-1.6)
// ══════════════════════════════════════════════════════════════════════

export const colors = {
  // Core Background Colors (Requirement 1.1)
  background: {
    deep: '#050A12',      // Primary background
    base: '#050A12',      // Base background
    elevated: '#0D1522',  // Surface color
    overlay: 'rgba(5, 10, 18, 0.92)',
    card: 'rgba(13, 21, 34, 0.8)',
  },

  // Primary Accent Colors (Requirement 1.2)
  primary: {
    DEFAULT: '#00D4FF',   // Neon cyan primary
    50: '#E6F9FF',
    100: '#CCF3FF',
    200: '#99E7FF',
    300: '#66DBFF',
    400: '#33CFFF',
    500: '#00D4FF',       // Base
    600: '#00A8CC',
    700: '#007A99',
    800: '#004C66',
    900: '#001E33',
    bright: '#33DFFF',
    soft: 'rgba(0, 212, 255, 0.08)',
    glow: 'rgba(0, 212, 255, 0.35)',
    rgb: '0, 212, 255',
  },

  // Secondary Accent Colors (Requirement 1.3)
  secondary: {
    DEFAULT: '#8B5CF6',   // Purple secondary
    50: '#F3F0FF',
    100: '#E7E0FF',
    200: '#CFC2FF',
    300: '#B7A3FF',
    400: '#9F85FF',
    500: '#8B5CF6',       // Base
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
    soft: 'rgba(139, 92, 246, 0.08)',
    glow: 'rgba(139, 92, 246, 0.25)',
    rgb: '139, 92, 246',
  },

  // Semantic Colors (Requirement 1.4)
  success: {
    DEFAULT: '#00E58B',   // Success green
    50: '#E6FFF5',
    100: '#CCFFEB',
    200: '#99FFD7',
    300: '#66FFC3',
    400: '#33FFAF',
    500: '#00E58B',       // Base
    600: '#00B86F',
    700: '#008A53',
    800: '#005C37',
    900: '#002E1B',
    soft: 'rgba(0, 229, 139, 0.12)',
    glow: 'rgba(0, 229, 139, 0.25)',
    rgb: '0, 229, 139',
  },

  warning: {
    DEFAULT: '#FFB020',   // Warning orange
    50: '#FFF9E6',
    100: '#FFF3CC',
    200: '#FFE799',
    300: '#FFDB66',
    400: '#FFCF33',
    500: '#FFB020',       // Base
    600: '#E6991D',
    700: '#CC831A',
    800: '#B36C17',
    900: '#995614',
    soft: 'rgba(255, 176, 32, 0.12)',
    glow: 'rgba(255, 176, 32, 0.25)',
    rgb: '255, 176, 32',
  },

  error: {
    DEFAULT: '#FF4D67',   // Error red
    50: '#FFE6EA',
    100: '#FFCCD4',
    200: '#FF99A9',
    300: '#FF667E',
    400: '#FF3353',
    500: '#FF4D67',       // Base
    600: '#E6445C',
    700: '#CC3B51',
    800: '#B33246',
    900: '#99293B',
    soft: 'rgba(255, 77, 103, 0.12)',
    glow: 'rgba(255, 77, 103, 0.25)',
    rgb: '255, 77, 103',
  },

  // Text Colors (Requirement 1.5)
  text: {
    primary: '#E6EDF7',   // Primary text
    secondary: '#94A3B8', // Secondary text
    muted: 'rgba(230, 237, 247, 0.55)',
    inverse: '#1A1D24',
    accent: '#00D4FF',
  },

  // Border Colors (Requirement 1.6)
  border: {
    DEFAULT: 'rgba(255, 255, 255, 0.08)',  // Default border
    hover: 'rgba(255, 255, 255, 0.12)',
    accent: 'rgba(0, 212, 255, 0.35)',
    subtle: 'rgba(255, 255, 255, 0.05)',
    focus: 'rgba(0, 212, 255, 0.6)',
  },

  // Surface Colors for layered components
  surface: {
    DEFAULT: 'rgba(255, 255, 255, 0.05)',
    hover: 'rgba(255, 255, 255, 0.08)',
    low: 'rgba(255, 255, 255, 0.03)',
    mid: 'rgba(255, 255, 255, 0.06)',
    high: 'rgba(255, 255, 255, 0.10)',
    glass: 'linear-gradient(135deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.025) 100%)',
  },

  // Special effect colors
  glow: {
    primary: 'rgba(0, 212, 255, 0.35)',
    secondary: 'rgba(139, 92, 246, 0.25)',
    success: 'rgba(0, 229, 139, 0.25)',
    warning: 'rgba(255, 176, 32, 0.25)',
    error: 'rgba(255, 77, 103, 0.25)',
  },
} as const;

// ══════════════════════════════════════════════════════════════════════
// Spacing Tokens - 8px Grid System (Requirement 13.5)
// ══════════════════════════════════════════════════════════════════════

export const spacing = {
  0: '0',
  1: '4px',      // 0.25rem
  2: '8px',      // 0.5rem  - Base grid unit
  3: '12px',     // 0.75rem
  4: '16px',     // 1rem
  5: '20px',     // 1.25rem
  6: '24px',     // 1.5rem
  8: '32px',     // 2rem
  10: '40px',    // 2.5rem
  12: '48px',    // 3rem
  16: '64px',    // 4rem
  18: '72px',    // 4.5rem - Header height (Requirement 2.1)
  20: '80px',    // 5rem
  24: '96px',    // 6rem
  32: '128px',   // 8rem
  40: '160px',   // 10rem
  48: '192px',   // 12rem
  56: '224px',   // 14rem
  64: '256px',   // 16rem
  72: '288px',   // 18rem
  80: '320px',   // 20rem
  96: '384px',   // 24rem
} as const;

// ══════════════════════════════════════════════════════════════════════
// Animation Tokens (Requirements 6.1, 6.2, 6.4)
// ══════════════════════════════════════════════════════════════════════

export const animation = {
  // Duration tokens (Requirement 6.1 - 200ms transitions, 6.4 - 100ms response)
  duration: {
    instant: '0ms',
    fast: '100ms',      // User interaction feedback
    normal: '200ms',    // Standard transitions
    slow: '300ms',
    slowest: '500ms',
  },

  // Easing functions for smooth animations
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    expo: 'cubic-bezier(0.4, 0.0, 0.2, 1)',      // Expo easing
    back: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Back easing
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Predefined transitions
  transition: {
    fast: '100ms cubic-bezier(0.4, 0.0, 0.2, 1)',
    normal: '200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0.0, 0.2, 1)',
  },

  // Keyframe animations
  keyframes: {
    fadeIn: {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
    slideUp: {
      '0%': { transform: 'translateY(10px)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' },
    },
    slideRight: {
      '0%': { transform: 'translateX(-10px)', opacity: '0' },
      '100%': { transform: 'translateX(0)', opacity: '1' },
    },
    glow: {
      '0%': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.5)' },
      '100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.8)' },
    },
    pulse: {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.7' },
    },
    shimmer: {
      '0%': { backgroundPosition: '200% center' },
      '100%': { backgroundPosition: '-200% center' },
    },
  },
} as const;

// ══════════════════════════════════════════════════════════════════════
// Typography Tokens
// ══════════════════════════════════════════════════════════════════════

export const typography = {
  // Font families
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
    display: ['Inter', 'system-ui', 'sans-serif'],
  },

  // Font sizes with line heights
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px/16px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px/20px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px/24px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px/28px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px/28px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px/32px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px/36px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px/40px
  },

  // Font weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Line heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.08em',   // For uppercase labels
  },
} as const;

// ══════════════════════════════════════════════════════════════════════
// Layout Tokens - Responsive Breakpoints (Requirements 3.2, 3.3, 3.4)
// ══════════════════════════════════════════════════════════════════════

export const breakpoints = {
  mobile: '768px',    // Mobile devices (Requirement 3.4)
  tablet: '1024px',   // Tablet devices (Requirement 3.3)
  desktop: '1200px',  // Desktop devices (Requirement 3.2)
} as const;

// Grid system tokens
export const grid = {
  columns: 12,        // 12-column grid (Requirement 3.1)
  gap: spacing[6],    // 24px default gap
  container: {
    padding: spacing[6],   // 24px padding
    maxWidth: '1280px',    // Max container width
  },
} as const;

// ══════════════════════════════════════════════════════════════════════
// Shadow Tokens
// ══════════════════════════════════════════════════════════════════════

export const shadows = {
  none: 'none',
  sm: '0 0 0 1px rgba(255,255,255,0.06), 0 2px 20px rgba(0,0,0,0.5), 0 0 40px rgba(0,0,0,0.2)',
  md: '0 0 0 1px rgba(255,255,255,0.07), 0 4px 28px rgba(0,0,0,0.55), 0 0 60px rgba(0,0,0,0.3)',
  lg: '0 0 0 1px rgba(255,255,255,0.10), 0 8px 40px rgba(0,0,0,0.6), 0 0 80px rgba(94,106,210,0.12)',
  xl: '0 0 0 1px rgba(255,255,255,0.12), 0 12px 48px rgba(0,0,0,0.7), 0 0 100px rgba(94,106,210,0.15)',
  
  // Glow shadows for accent elements
  glow: {
    primary: '0 0 30px rgba(0, 212, 255, 0.25), 0 0 60px rgba(0, 212, 255, 0.1)',
    secondary: '0 0 30px rgba(139, 92, 246, 0.25), 0 0 60px rgba(139, 92, 246, 0.1)',
    success: '0 0 30px rgba(0, 229, 139, 0.25), 0 0 60px rgba(0, 229, 139, 0.1)',
    warning: '0 0 30px rgba(255, 176, 32, 0.25), 0 0 60px rgba(255, 176, 32, 0.1)',
    error: '0 0 30px rgba(255, 77, 103, 0.25), 0 0 60px rgba(255, 77, 103, 0.1)',
  },

  // Interactive shadows
  interactive: {
    default: '0 0 0 1px rgba(0, 212, 255, 0.3), inset 0 0 12px rgba(0, 212, 255, 0.08), 0 0 20px rgba(0, 212, 255, 0.2)',
    hover: '0 0 0 1px rgba(0, 212, 255, 0.4), inset 0 0 16px rgba(0, 212, 255, 0.12), 0 0 24px rgba(0, 212, 255, 0.3)',
    focus: '0 0 0 2px rgba(0, 212, 255, 0.15), 0 0 24px rgba(0, 212, 255, 0.2)',
  },
} as const;

// ══════════════════════════════════════════════════════════════════════
// Border Radius Tokens
// ══════════════════════════════════════════════════════════════════════

export const borderRadius = {
  none: '0',
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  '3xl': '24px',
  full: '9999px',
} as const;

// ══════════════════════════════════════════════════════════════════════
// Z-Index Tokens
// ══════════════════════════════════════════════════════════════════════

export const zIndex = {
  hide: '-1',
  auto: 'auto',
  base: '0',
  docked: '10',
  dropdown: '1000',
  sticky: '1020',
  banner: '1030',
  overlay: '1040',
  modal: '1050',
  popover: '1060',
  skipLink: '1070',
  toast: '1080',
  tooltip: '1090',
} as const;

// ══════════════════════════════════════════════════════════════════════
// Component-Specific Tokens
// ══════════════════════════════════════════════════════════════════════

export const components = {
  // Header component tokens (Requirement 2.1)
  header: {
    height: spacing[18],  // 72px
    background: colors.background.elevated,
    border: colors.border.DEFAULT,
  },

  // Button tokens
  button: {
    height: {
      sm: '32px',
      md: '40px',
      lg: '48px',
    },
    padding: {
      sm: `${spacing[2]} ${spacing[4]}`,     // 8px 16px
      md: `${spacing[3]} ${spacing[6]}`,     // 12px 24px
      lg: `${spacing[4]} ${spacing[8]}`,     // 16px 32px
    },
  },

  // Card tokens
  card: {
    padding: spacing[6],        // 24px
    borderRadius: borderRadius.xl,
    background: colors.surface.glass,
    border: colors.border.DEFAULT,
  },

  // Input tokens
  input: {
    height: '40px',
    padding: `${spacing[3]} ${spacing[4]}`,  // 12px 16px
    borderRadius: borderRadius.md,
    background: colors.background.elevated,
    border: colors.border.DEFAULT,
  },

  // Metrics card tokens (Requirement 2.2)
  metricsCard: {
    minHeight: '120px',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
  },
} as const;

// ══════════════════════════════════════════════════════════════════════
// Export Complete Design System
// ══════════════════════════════════════════════════════════════════════

export const designTokens = {
  colors,
  spacing,
  animation,
  typography,
  breakpoints,
  grid,
  shadows,
  borderRadius,
  zIndex,
  components,
} as const;

export type DesignTokens = typeof designTokens;
export type ColorTokens = typeof colors;
export type SpacingTokens = typeof spacing;
export type AnimationTokens = typeof animation;
export type TypographyTokens = typeof typography;

// Helper function to get CSS custom properties
export function getCSSCustomProperties() {
  return {
    // Colors
    '--background-deep': colors.background.deep,
    '--background-base': colors.background.base,
    '--background-elevated': colors.background.elevated,
    '--primary': colors.primary.DEFAULT,
    '--primary-rgb': colors.primary.rgb,
    '--secondary': colors.secondary.DEFAULT,
    '--secondary-rgb': colors.secondary.rgb,
    '--success': colors.success.DEFAULT,
    '--warning': colors.warning.DEFAULT,
    '--error': colors.error.DEFAULT,
    '--text-primary': colors.text.primary,
    '--text-secondary': colors.text.secondary,
    '--border-default': colors.border.DEFAULT,
    
    // Spacing (8px grid system)
    '--space-1': spacing[1],
    '--space-2': spacing[2],
    '--space-3': spacing[3],
    '--space-4': spacing[4],
    '--space-6': spacing[6],
    '--space-8': spacing[8],
    '--space-12': spacing[12],
    '--space-16': spacing[16],
    
    // Animation
    '--transition-fast': animation.transition.fast,
    '--transition-normal': animation.transition.normal,
    '--transition-slow': animation.transition.slow,
    
    // Typography
    '--font-sans': typography.fontFamily.sans.join(', '),
    '--font-mono': typography.fontFamily.mono.join(', '),
  };
}