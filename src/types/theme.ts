/**
 * JARVIS Neural Interface - Theme Type Definitions
 * 
 * Type definitions for the theme system to ensure type safety
 * across the application when working with design tokens.
 */

import type { theme } from '../styles/theme';

// ══════════════════════════════════════════════════════════════════════
// Core Theme Types
// ══════════════════════════════════════════════════════════════════════

export type ThemeMode = 'dark' | 'light';

export type ThemeColors = typeof theme.colors;
export type ThemeSpacing = typeof theme.spacing;
export type ThemeAnimation = typeof theme.animation;
export type ThemeTypography = typeof theme.typography;
export type ThemeBreakpoints = typeof theme.breakpoints;
export type ThemeComponents = typeof theme.components;

// ══════════════════════════════════════════════════════════════════════
// Color System Types
// ══════════════════════════════════════════════════════════════════════

export type ColorScale = {
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
  DEFAULT: string;
};

export type SemanticColors = {
  DEFAULT: string;
  50: string;
  500: string;
  600: string;
  soft: string;
  glow: string;
  rgb: string;
};

export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'normal';
export type StatusVariant = 'default' | 'soft' | 'glow';

// ══════════════════════════════════════════════════════════════════════
// Component Variant Types
// ══════════════════════════════════════════════════════════════════════

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type CardVariant = 'default' | 'elevated' | 'glass';
export type InputState = 'default' | 'error' | 'focus';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'accent' | 'cyan';

// ══════════════════════════════════════════════════════════════════════
// Layout and Spacing Types
// ══════════════════════════════════════════════════════════════════════

export type SpacingKey = keyof ThemeSpacing;
export type BreakpointKey = keyof ThemeBreakpoints;

export type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type FlexDirection = 'row' | 'col';
export type FlexAlign = 'start' | 'center' | 'end' | 'stretch';
export type FlexJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

// ══════════════════════════════════════════════════════════════════════
// Animation Types
// ══════════════════════════════════════════════════════════════════════

export type AnimationDuration = keyof ThemeAnimation['duration'];
export type AnimationEasing = keyof ThemeAnimation['easing'];
export type AnimationDirection = 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';

// ══════════════════════════════════════════════════════════════════════
// Typography Types
// ══════════════════════════════════════════════════════════════════════

export type FontSize = keyof ThemeTypography['fontSize'];
export type FontWeight = keyof ThemeTypography['fontWeight'];
export type FontFamily = keyof ThemeTypography['fontFamily'];
export type LineHeight = keyof ThemeTypography['lineHeight'];
export type LetterSpacing = keyof ThemeTypography['letterSpacing'];

export type HeadingLevel = 1 | 2 | 3 | 4;

// ══════════════════════════════════════════════════════════════════════
// Component Prop Types
// ══════════════════════════════════════════════════════════════════════

export interface ThemeProps {
  /** Theme mode (dark/light) */
  theme?: ThemeMode;
  
  /** Custom className for theme-aware styling */
  className?: string;
  
  /** Override theme colors for specific component */
  colors?: Partial<ThemeColors>;
}

export interface ResponsiveProps {
  /** Mobile breakpoint value */
  mobile?: string | number;
  
  /** Tablet breakpoint value */
  tablet?: string | number;
  
  /** Desktop breakpoint value */
  desktop?: string | number;
  
  /** Wide desktop breakpoint value */
  wide?: string | number;
}

export interface SpacingProps {
  /** Padding (all sides) */
  p?: SpacingKey;
  
  /** Padding X (left & right) */
  px?: SpacingKey;
  
  /** Padding Y (top & bottom) */
  py?: SpacingKey;
  
  /** Padding top */
  pt?: SpacingKey;
  
  /** Padding right */
  pr?: SpacingKey;
  
  /** Padding bottom */
  pb?: SpacingKey;
  
  /** Padding left */
  pl?: SpacingKey;
  
  /** Margin (all sides) */
  m?: SpacingKey;
  
  /** Margin X (left & right) */
  mx?: SpacingKey;
  
  /** Margin Y (top & bottom) */
  my?: SpacingKey;
  
  /** Margin top */
  mt?: SpacingKey;
  
  /** Margin right */
  mr?: SpacingKey;
  
  /** Margin bottom */
  mb?: SpacingKey;
  
  /** Margin left */
  ml?: SpacingKey;
  
  /** Gap for flex/grid layouts */
  gap?: SpacingKey;
}

export interface AnimationProps {
  /** Animation duration */
  duration?: AnimationDuration;
  
  /** Animation easing function */
  easing?: AnimationEasing;
  
  /** Animation delay */
  delay?: string;
  
  /** Animation iteration count */
  iterations?: number | 'infinite';
  
  /** Animation direction */
  direction?: AnimationDirection;
}

// ══════════════════════════════════════════════════════════════════════
// Utility Types
// ══════════════════════════════════════════════════════════════════════

/**
 * Extract color keys from theme
 */
export type ColorKey = keyof ThemeColors;

/**
 * Extract nested color keys (e.g., 'primary.500')
 */
export type ColorPath = 
  | 'primary.DEFAULT' | 'primary.50' | 'primary.100' | 'primary.500' | 'primary.600'
  | 'secondary.DEFAULT' | 'secondary.50' | 'secondary.500' | 'secondary.600'
  | 'success.DEFAULT' | 'success.50' | 'success.500' | 'success.600'
  | 'warning.DEFAULT' | 'warning.50' | 'warning.500' | 'warning.600'
  | 'error.DEFAULT' | 'error.50' | 'error.500' | 'error.600'
  | 'text.primary' | 'text.secondary' | 'text.muted'
  | 'background.base' | 'background.elevated' | 'background.card'
  | 'border.DEFAULT' | 'border.hover' | 'border.accent'
  | 'surface.DEFAULT' | 'surface.hover' | 'surface.elevated';

/**
 * CSS custom property names
 */
export type CSSCustomProperty = `--${string}`;

/**
 * Theme configuration options
 */
export interface ThemeConfig {
  /** Default theme mode */
  defaultMode: ThemeMode;
  
  /** Available theme modes */
  modes: readonly ThemeMode[];
  
  /** Storage key for persisting theme preference */
  storageKey: string;
  
  /** Whether to apply theme automatically on load */
  autoApply: boolean;
  
  /** Whether to listen for system theme changes */
  respectSystemPreference: boolean;
}

/**
 * Theme context value
 */
export interface ThemeContextValue {
  /** Current theme mode */
  mode: ThemeMode;
  
  /** Current theme colors */
  colors: ThemeColors;
  
  /** Set theme mode */
  setMode: (mode: ThemeMode) => void;
  
  /** Toggle between light and dark */
  toggleMode: () => void;
  
  /** Whether current theme is dark */
  isDark: boolean;
  
  /** Whether current theme is light */
  isLight: boolean;
  
  /** Get theme value by path */
  getThemeValue: (path: string) => string | undefined;
  
  /** System preference for dark mode */
  systemPrefersDark: boolean;
}

// ══════════════════════════════════════════════════════════════════════
// CSS-in-JS Types
// ══════════════════════════════════════════════════════════════════════

export interface CSSObject {
  [key: string]: string | number | CSSObject;
}

export interface ResponsiveCSSObject {
  mobile?: CSSObject;
  tablet?: CSSObject;
  desktop?: CSSObject;
  wide?: CSSObject;
}

// ══════════════════════════════════════════════════════════════════════
// Event Types
// ══════════════════════════════════════════════════════════════════════

export interface ThemeChangeEvent {
  /** Previous theme mode */
  previousMode: ThemeMode;
  
  /** New theme mode */
  newMode: ThemeMode;
  
  /** Whether change was triggered by system preference */
  triggeredBySystem: boolean;
  
  /** Timestamp of change */
  timestamp: number;
}

// ══════════════════════════════════════════════════════════════════════
// Export all types
// ══════════════════════════════════════════════════════════════════════

export type {
  // Re-export main theme type
  theme as Theme,
};

// Default export for convenience
export default ThemeColors;