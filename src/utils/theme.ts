/**
 * JARVIS Neural Interface - Theme Utilities
 * 
 * Utility functions for working with the theme system, including
 * color manipulation, responsive helpers, and component styling.
 * 
 * Requirements addressed:
 * - 1.1-1.6: Color palette utilities
 * - 13.5: Spacing calculations
 * - 6.1, 6.2: Animation helpers
 */

import { theme } from '../styles/theme';

// ══════════════════════════════════════════════════════════════════════
// Color Utilities
// ══════════════════════════════════════════════════════════════════════

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Create rgba color with opacity
 */
export function withOpacity(color: string, opacity: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}

/**
 * Get status color based on status type (Requirements 1.4, 8.2)
 */
export function getStatusColor(status: 'success' | 'warning' | 'error' | 'info' | 'normal'): string {
  const colors = theme.colors;
  
  switch (status) {
    case 'success':
      return colors.success.DEFAULT;
    case 'warning':
      return colors.warning.DEFAULT;
    case 'error':
      return colors.error.DEFAULT;
    case 'info':
      return colors.primary.DEFAULT;
    case 'normal':
    default:
      return colors.text.secondary;
  }
}

/**
 * Get glow color for status
 */
export function getStatusGlow(status: 'success' | 'warning' | 'error' | 'info' | 'primary'): string {
  const colors = theme.colors;
  
  switch (status) {
    case 'success':
      return colors.success.glow;
    case 'warning':
      return colors.warning.glow;
    case 'error':
      return colors.error.glow;
    case 'info':
    case 'primary':
      return colors.primary.glow;
    default:
      return colors.primary.glow;
  }
}

/**
 * Generate gradient background string
 */
export function createGradient(
  direction: string,
  stops: Array<{ color: string; position?: string }>
): string {
  const gradientStops = stops
    .map(stop => `${stop.color}${stop.position ? ` ${stop.position}` : ''}`)
    .join(', ');
  
  return `linear-gradient(${direction}, ${gradientStops})`;
}

// ══════════════════════════════════════════════════════════════════════
// Spacing Utilities (Requirement 13.5 - 8px Grid System)
// ══════════════════════════════════════════════════════════════════════

/**
 * Calculate spacing based on 8px grid system
 */
export function spacing(multiplier: number): string {
  return `${multiplier * 8}px`;
}

/**
 * Get spacing value from theme
 */
export function getSpacing(size: keyof typeof theme.spacing): string {
  return theme.spacing[size];
}

/**
 * Create responsive spacing classes
 */
export function responsiveSpacing(
  mobile: keyof typeof theme.spacing,
  tablet?: keyof typeof theme.spacing,
  desktop?: keyof typeof theme.spacing
): string {
  let classes = `p-${mobile}`;
  
  if (tablet) {
    classes += ` tablet:p-${tablet}`;
  }
  
  if (desktop) {
    classes += ` desktop:p-${desktop}`;
  }
  
  return classes;
}

// ══════════════════════════════════════════════════════════════════════
// Animation Utilities (Requirements 6.1, 6.2, 6.4)
// ══════════════════════════════════════════════════════════════════════

/**
 * Create transition string with theme timing
 */
export function createTransition(
  properties: string[],
  duration: keyof typeof theme.animation.duration = 'normal',
  easing: keyof typeof theme.animation.easing = 'expo'
): string {
  const durationValue = theme.animation.duration[duration];
  const easingValue = theme.animation.easing[easing];
  
  return properties
    .map(prop => `${prop} ${durationValue} ${easingValue}`)
    .join(', ');
}

/**
 * Get animation duration value
 */
export function getAnimationDuration(duration: keyof typeof theme.animation.duration): string {
  return theme.animation.duration[duration];
}

/**
 * Create CSS animation string
 */
export function createAnimation(
  name: string,
  duration: string = theme.animation.duration.normal,
  easing: string = theme.animation.easing.expo,
  iterations: number | 'infinite' = 1,
  direction: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse' = 'normal'
): string {
  return `${name} ${duration} ${easing} ${iterations} ${direction}`;
}

// ══════════════════════════════════════════════════════════════════════
// Responsive Utilities (Requirements 3.2, 3.3, 3.4)
// ══════════════════════════════════════════════════════════════════════

/**
 * Check if screen size matches breakpoint
 */
export function matchesBreakpoint(breakpoint: keyof typeof theme.breakpoints): boolean {
  if (typeof window === 'undefined') return false;
  
  const breakpointValue = theme.breakpoints[breakpoint];
  return window.innerWidth >= breakpointValue;
}

/**
 * Get current breakpoint
 */
export function getCurrentBreakpoint(): keyof typeof theme.breakpoints {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  
  if (width < theme.breakpoints.mobile) {
    return 'mobile';
  } else if (width < theme.breakpoints.tablet) {
    return 'tablet';
  } else if (width < theme.breakpoints.desktop) {
    return 'desktop';
  } else {
    return 'wide';
  }
}

/**
 * Create responsive class names
 */
export function createResponsiveClasses(
  mobile: string,
  tablet?: string,
  desktop?: string,
  wide?: string
): string {
  let classes = mobile;
  
  if (tablet) {
    classes += ` tablet:${tablet}`;
  }
  
  if (desktop) {
    classes += ` desktop:${desktop}`;
  }
  
  if (wide) {
    classes += ` wide:${wide}`;
  }
  
  return classes;
}

// ══════════════════════════════════════════════════════════════════════
// Component Styling Utilities
// ══════════════════════════════════════════════════════════════════════

/**
 * Generate button variant styles
 */
export function getButtonVariant(variant: 'primary' | 'secondary' | 'ghost' | 'danger'): string {
  const base = 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200';
  
  switch (variant) {
    case 'primary':
      return `${base} bg-primary text-white hover:bg-primary-dark shadow-glow`;
    case 'secondary':
      return `${base} bg-surface border border-border-default hover:bg-surface-hover`;
    case 'ghost':
      return `${base} bg-transparent hover:bg-surface-low`;
    case 'danger':
      return `${base} bg-error-soft text-error border border-error hover:bg-error-glow`;
    default:
      return base;
  }
}

/**
 * Generate card styles
 */
export function getCardStyles(variant: 'default' | 'elevated' | 'glass' = 'default'): string {
  const base = 'rounded-xl border transition-all duration-200';
  
  switch (variant) {
    case 'elevated':
      return `${base} bg-surface-elevated border-border-hover shadow-glass-lg`;
    case 'glass':
      return `${base} bg-surface border-border-default backdrop-blur-md shadow-glass`;
    case 'default':
    default:
      return `${base} bg-surface border-border-default shadow-glass`;
  }
}

/**
 * Generate input styles
 */
export function getInputStyles(state: 'default' | 'error' | 'focus' = 'default'): string {
  const base = 'w-full px-4 py-3 rounded-lg border bg-background-elevated transition-all duration-200';
  
  switch (state) {
    case 'error':
      return `${base} border-error bg-error-soft focus:border-error focus:shadow-glow-red`;
    case 'focus':
      return `${base} border-primary shadow-glow`;
    case 'default':
    default:
      return `${base} border-border-default hover:border-border-hover focus:border-primary focus:shadow-glow`;
  }
}

// ══════════════════════════════════════════════════════════════════════
// Layout Utilities
// ══════════════════════════════════════════════════════════════════════

/**
 * Generate grid column classes for 12-column system
 */
export function gridCols(mobile: number, tablet?: number, desktop?: number): string {
  let classes = `col-span-${mobile}`;
  
  if (tablet) {
    classes += ` tablet:col-span-${tablet}`;
  }
  
  if (desktop) {
    classes += ` desktop:col-span-${desktop}`;
  }
  
  return classes;
}

/**
 * Generate flex layout classes
 */
export function flexLayout(
  direction: 'row' | 'col' = 'row',
  align: 'start' | 'center' | 'end' | 'stretch' = 'center',
  justify: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly' = 'start',
  gap: number = 4
): string {
  return `flex flex-${direction} items-${align} justify-${justify} gap-${gap}`;
}

// ══════════════════════════════════════════════════════════════════════
// Typography Utilities
// ══════════════════════════════════════════════════════════════════════

/**
 * Generate typography classes
 */
export function typography(
  size: keyof typeof theme.typography.fontSize,
  weight: string = 'normal',
  family: keyof typeof theme.typography.fontFamily = 'sans'
): string {
  return `text-${String(size)} font-${weight} font-${String(family)}`;
}

/**
 * Generate label classes (uppercase, mono, small)
 */
export function labelClasses(): string {
  return 'text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary';
}

/**
 * Generate heading classes
 */
export function headingClasses(level: 1 | 2 | 3 | 4 = 2): string {
  const sizes = {
    1: 'text-4xl font-bold',
    2: 'text-2xl font-semibold',
    3: 'text-xl font-medium',
    4: 'text-lg font-medium',
  };
  
  return `${sizes[level]} text-text-primary`;
}

// ══════════════════════════════════════════════════════════════════════
// Status and Badge Utilities
// ══════════════════════════════════════════════════════════════════════

/**
 * Generate status badge styles
 */
export function getStatusBadge(status: 'success' | 'warning' | 'error' | 'info'): string {
  const base = 'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider';
  
  switch (status) {
    case 'success':
      return `${base} bg-success-soft text-success border border-success/25`;
    case 'warning':
      return `${base} bg-warning-soft text-warning border border-warning/25`;
    case 'error':
      return `${base} bg-error-soft text-error border border-error/25`;
    case 'info':
      return `${base} bg-primary-soft text-primary border border-primary/25`;
    default:
      return base;
  }
}

/**
 * Generate live status indicator
 */
export function getLiveIndicator(): string {
  return 'w-2 h-2 rounded-full bg-success animate-pulse-fast shadow-glow-green';
}

// ══════════════════════════════════════════════════════════════════════
// Export all utilities
// ══════════════════════════════════════════════════════════════════════

export const themeUtils = {
  // Color utilities
  hexToRgb,
  withOpacity,
  getStatusColor,
  getStatusGlow,
  createGradient,
  
  // Spacing utilities
  spacing,
  getSpacing,
  responsiveSpacing,
  
  // Animation utilities
  createTransition,
  getAnimationDuration,
  createAnimation,
  
  // Responsive utilities
  matchesBreakpoint,
  getCurrentBreakpoint,
  createResponsiveClasses,
  
  // Component utilities
  getButtonVariant,
  getCardStyles,
  getInputStyles,
  
  // Layout utilities
  gridCols,
  flexLayout,
  
  // Typography utilities
  typography,
  labelClasses,
  headingClasses,
  
  // Status utilities
  getStatusBadge,
  getLiveIndicator,
} as const;

export default themeUtils;