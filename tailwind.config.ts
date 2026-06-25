import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ═══════ Core Background Colors (Requirement 1.1) ═══════
        background: {
          DEFAULT: '#050A12',     // Primary background
          deep: '#050A12',        // Deep background
          base: '#050A12',        // Base background
          elevated: '#0D1522',    // Surface color
          overlay: 'rgba(5, 10, 18, 0.92)',
          card: 'rgba(13, 21, 34, 0.8)',
        },
        
        // ═══════ Primary Accent Colors (Requirement 1.2) ═══════
        primary: {
          DEFAULT: '#00D4FF',     // Neon cyan primary
          50: '#E6F9FF',
          100: '#CCF3FF',
          200: '#99E7FF',
          300: '#66DBFF',
          400: '#33CFFF',
          500: '#00D4FF',         // Base
          600: '#00A8CC',
          700: '#007A99',
          800: '#004C66',
          900: '#001E33',
          bright: '#33DFFF',
          dark: '#00A8CC',
          soft: 'rgba(0, 212, 255, 0.08)',
          glow: 'rgba(0, 212, 255, 0.35)',
        },

        // ═══════ Secondary Accent Colors (Requirement 1.3) ═══════
        secondary: {
          DEFAULT: '#8B5CF6',     // Purple secondary
          50: '#F3F0FF',
          100: '#E7E0FF',
          200: '#CFC2FF',
          300: '#B7A3FF',
          400: '#9F85FF',
          500: '#8B5CF6',         // Base
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
          dark: '#7C3AED',
          soft: 'rgba(139, 92, 246, 0.08)',
          glow: 'rgba(139, 92, 246, 0.25)',
        },

        // ═══════ Semantic Colors (Requirement 1.4) ═══════
        success: {
          DEFAULT: '#00E58B',     // Success green
          50: '#E6FFF5',
          100: '#CCFFEB',
          200: '#99FFD7',
          300: '#66FFC3',
          400: '#33FFAF',
          500: '#00E58B',         // Base
          600: '#00B86F',
          700: '#008A53',
          800: '#005C37',
          900: '#002E1B',
          soft: 'rgba(0, 229, 139, 0.12)',
          glow: 'rgba(0, 229, 139, 0.25)',
        },

        warning: {
          DEFAULT: '#FFB020',     // Warning orange
          50: '#FFF9E6',
          100: '#FFF3CC',
          200: '#FFE799',
          300: '#FFDB66',
          400: '#FFCF33',
          500: '#FFB020',         // Base
          600: '#E6991D',
          700: '#CC831A',
          800: '#B36C17',
          900: '#995614',
          soft: 'rgba(255, 176, 32, 0.12)',
          glow: 'rgba(255, 176, 32, 0.25)',
        },

        error: {
          DEFAULT: '#FF4D67',     // Error red
          50: '#FFE6EA',
          100: '#FFCCD4',
          200: '#FF99A9',
          300: '#FF667E',
          400: '#FF3353',
          500: '#FF4D67',         // Base
          600: '#E6445C',
          700: '#CC3B51',
          800: '#B33246',
          900: '#99293B',
          soft: 'rgba(255, 77, 103, 0.12)',
          glow: 'rgba(255, 77, 103, 0.25)',
        },

        // ═══════ Text Colors (Requirement 1.5) ═══════
        text: {
          DEFAULT: '#E6EDF7',     // Primary text
          primary: '#E6EDF7',     // Primary text
          secondary: '#94A3B8',   // Secondary text
          muted: 'rgba(230, 237, 247, 0.55)',
          inverse: '#1A1D24',
          accent: '#00D4FF',
        },

        // Legacy text color names for compatibility
        'text-primary': '#E6EDF7',
        'text-secondary': '#94A3B8',

        // ═══════ Border Colors (Requirement 1.6) ═══════
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',  // Default border
          hover: 'rgba(255, 255, 255, 0.12)',
          accent: 'rgba(0, 212, 255, 0.35)',
          subtle: 'rgba(255, 255, 255, 0.05)',
          focus: 'rgba(0, 212, 255, 0.6)',
        },

        // ═══════ Surface Colors for Glass Effects ═══════
        surface: {
          DEFAULT: 'rgba(255, 255, 255, 0.05)',
          hover: 'rgba(255, 255, 255, 0.08)',
          low: 'rgba(255, 255, 255, 0.03)',
          mid: 'rgba(255, 255, 255, 0.06)',
          high: 'rgba(255, 255, 255, 0.10)',
          elevated: '#1E293B',
        },

        // ═══════ Additional Utility Colors ═══════
        overlay: 'rgba(0, 0, 0, 0.8)',
      },

      // ═══════ Spacing - 8px Grid System (Requirement 13.5) ═══════
      spacing: {
        '0.5': '2px',     // 0.125rem
        '1.5': '6px',     // 0.375rem
        '2.5': '10px',    // 0.625rem
        '3.5': '14px',    // 0.875rem
        '15': '60px',     // 3.75rem
        '18': '72px',     // 4.5rem - Header height (Requirement 2.1)
        '22': '88px',     // 5.5rem
        '26': '104px',    // 6.5rem
        '30': '120px',    // 7.5rem
        '68': '272px',    // 17rem
        '72': '288px',    // 18rem
        '80': '320px',    // 20rem
        '96': '384px',    // 24rem
        '128': '512px',   // 32rem
        '144': '576px',   // 36rem
      },

      // ═══════ Animations (Requirements 6.1, 6.2, 6.4) ═══════
      animation: {
        // Performance-optimized animations with proper timing
        'fade-in': 'fadeIn 200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        'fade-out': 'fadeOut 200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        'slide-up': 'slideUp 200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        'slide-down': 'slideDown 200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        'slide-right': 'slideRight 200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        'slide-left': 'slideLeft 200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        'scale-in': 'scaleIn 200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        'scale-out': 'scaleOut 200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        'glow': 'glow 1.5s ease-in-out infinite alternate',
        'pulse-slow': 'pulseSlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulseFast 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },

      // ═══════ Keyframes for Animations ═══════
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.8)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        pulseFast: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(1deg)' },
        },
      },

      // ═══════ Typography Enhancements ═══════
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }],
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0.015em' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '0.015em' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '0.015em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '0.01em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '0.01em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '0.005em' }],
        '5xl': ['3rem', { lineHeight: '3.5rem', letterSpacing: '0' }],
      },

      // ═══════ Responsive Breakpoints (Requirements 3.2, 3.3, 3.4) ═══════
      screens: {
        'xs': '480px',
        'tablet': '768px',      // Tablet devices (Requirement 3.3)
        'laptop': '1024px',     
        'desktop': '1200px',    // Desktop devices (Requirement 3.2)
        'wide': '1440px',
      },

      // ═══════ Enhanced Blur and Effects ═══════
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '12px',
        'lg': '24px',
        'xl': '40px',
      },

      // ═══════ Box Shadows for Cyberpunk Effects ═══════
      boxShadow: {
        'glow-sm': '0 0 10px rgba(0, 212, 255, 0.3)',
        'glow': '0 0 20px rgba(0, 212, 255, 0.4)',
        'glow-lg': '0 0 30px rgba(0, 212, 255, 0.5)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.4)',
        'glow-green': '0 0 20px rgba(0, 229, 139, 0.4)',
        'glow-orange': '0 0 20px rgba(255, 176, 32, 0.4)',
        'glow-red': '0 0 20px rgba(255, 77, 103, 0.4)',
        'glass': '0 0 0 1px rgba(255,255,255,0.08), 0 4px 24px rgba(0,0,0,0.4)',
        'glass-lg': '0 0 0 1px rgba(255,255,255,0.12), 0 8px 32px rgba(0,0,0,0.5)',
      },

      // ═══════ Border Radius for Consistent Design ═══════
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },

      // ═══════ Transition Durations ═══════
      transitionDuration: {
        '50': '50ms',       // Ultra fast
        '100': '100ms',     // Fast - User interaction feedback (Requirement 6.4)
        '200': '200ms',     // Normal - Standard transitions (Requirement 6.1)
        '300': '300ms',     // Slow
        '400': '400ms',
        '500': '500ms',
      },

      // ═══════ Transition Timing Functions ═══════
      transitionTimingFunction: {
        'expo': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        'back': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [],
};

export default config;