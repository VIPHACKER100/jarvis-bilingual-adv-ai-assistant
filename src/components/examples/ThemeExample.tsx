/**
 * Theme System Example Component
 * 
 * Demonstrates the usage of the JARVIS Neural Interface theme system,
 * including colors, spacing, animations, and responsive design.
 * 
 * This component serves as both documentation and testing for the theme system.
 */

import { FC } from 'react';
import { useTheme, useBreakpoint, useAnimationConfig } from '../../hooks/useTheme';
import { themeUtils } from '../../utils/theme';

export const ThemeExample: FC = () => {
  const { colors, isDark, toggle, getThemeValue } = useTheme();
  const { current: breakpoint, isMobile, isTablet, isDesktop } = useBreakpoint();
  const { duration, easing } = useAnimationConfig();

  return (
    <div className="min-h-screen bg-background-base text-text-primary p-8">
      <div className="container-fluid space-y-8">
        
        {/* Header Section */}
        <header className="text-center space-y-4">
          <h1 className={themeUtils.headingClasses(1)}>
            JARVIS Neural Interface Theme System
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Cyberpunk color palette with Iron Man HUD aesthetics. 
            Comprehensive design tokens for consistent theming across all components.
          </p>
          
          {/* Theme Toggle */}
          <button
            onClick={toggle}
            className={themeUtils.getButtonVariant('primary')}
            style={{
              transition: `all ${duration.normal} ${easing.expo}`,
            }}
          >
            Switch to {isDark ? 'Light' : 'Dark'} Theme
          </button>
        </header>

        {/* Breakpoint Information */}
        <section className={themeUtils.getCardStyles('glass')}>
          <div className="p-6">
            <h2 className={themeUtils.headingClasses(2)}>
              Current Breakpoint: {breakpoint}
            </h2>
            <div className="mt-4 grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-4 gap-4">
              <div className={`p-4 rounded-lg ${isMobile ? 'bg-primary-soft border-primary' : 'bg-surface'} border`}>
                <div className={themeUtils.labelClasses()}>Mobile</div>
                <div className="text-sm mt-1">< 768px</div>
                {isMobile && <div className="text-primary text-xs mt-2">● Active</div>}
              </div>
              <div className={`p-4 rounded-lg ${isTablet ? 'bg-primary-soft border-primary' : 'bg-surface'} border`}>
                <div className={themeUtils.labelClasses()}>Tablet</div>
                <div className="text-sm mt-1">768px - 1024px</div>
                {isTablet && <div className="text-primary text-xs mt-2">● Active</div>}
              </div>
              <div className={`p-4 rounded-lg ${isDesktop ? 'bg-primary-soft border-primary' : 'bg-surface'} border`}>
                <div className={themeUtils.labelClasses()}>Desktop</div>
                <div className="text-sm mt-1">1024px - 1200px</div>
                {isDesktop && <div className="text-primary text-xs mt-2">● Active</div>}
              </div>
              <div className={`p-4 rounded-lg ${breakpoint === 'wide' ? 'bg-primary-soft border-primary' : 'bg-surface'} border`}>
                <div className={themeUtils.labelClasses()}>Wide</div>
                <div className="text-sm mt-1">> 1200px</div>
                {breakpoint === 'wide' && <div className="text-primary text-xs mt-2">● Active</div>}
              </div>
            </div>
          </div>
        </section>

        {/* Color Palette */}
        <section className={themeUtils.getCardStyles('default')}>
          <div className="p-6">
            <h2 className={themeUtils.headingClasses(2)}>
              Cyberpunk Color Palette
            </h2>
            <p className="text-text-secondary mb-6">
              Requirements 1.1-1.6: Core color system with neon accents
            </p>
            
            {/* Primary Colors */}
            <div className="space-y-6">
              <div>
                <h3 className={themeUtils.headingClasses(3)}>Primary Accent (Neon Cyan)</h3>
                <div className="grid grid-cols-2 tablet:grid-cols-4 desktop:grid-cols-6 gap-4 mt-4">
                  <ColorSwatch color={colors.primary[50]} label="primary-50" />
                  <ColorSwatch color={colors.primary[100]} label="primary-100" />
                  <ColorSwatch color={colors.primary[300]} label="primary-300" />
                  <ColorSwatch color={colors.primary.DEFAULT} label="primary" glow />
                  <ColorSwatch color={colors.primary[600]} label="primary-600" />
                  <ColorSwatch color={colors.primary[800]} label="primary-800" />
                </div>
              </div>

              {/* Secondary Colors */}
              <div>
                <h3 className={themeUtils.headingClasses(3)}>Secondary Accent (Purple)</h3>
                <div className="grid grid-cols-2 tablet:grid-cols-4 desktop:grid-cols-6 gap-4 mt-4">
                  <ColorSwatch color={colors.secondary[50]} label="secondary-50" />
                  <ColorSwatch color={colors.secondary[100]} label="secondary-100" />
                  <ColorSwatch color={colors.secondary[300]} label="secondary-300" />
                  <ColorSwatch color={colors.secondary.DEFAULT} label="secondary" glow />
                  <ColorSwatch color={colors.secondary[600]} label="secondary-600" />
                  <ColorSwatch color={colors.secondary[800]} label="secondary-800" />
                </div>
              </div>

              {/* Semantic Colors */}
              <div>
                <h3 className={themeUtils.headingClasses(3)}>Semantic Colors</h3>
                <div className="grid grid-cols-2 tablet:grid-cols-3 gap-4 mt-4">
                  <ColorSwatch color={colors.success.DEFAULT} label="Success" glow />
                  <ColorSwatch color={colors.warning.DEFAULT} label="Warning" glow />
                  <ColorSwatch color={colors.error.DEFAULT} label="Error" glow />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Component Variants */}
        <section className={themeUtils.getCardStyles('elevated')}>
          <div className="p-6">
            <h2 className={themeUtils.headingClasses(2)}>
              Component Variants
            </h2>
            <p className="text-text-secondary mb-6">
              Themed components with consistent styling
            </p>

            {/* Buttons */}
            <div className="space-y-6">
              <div>
                <h3 className={themeUtils.headingClasses(3)}>Buttons</h3>
                <div className="flex flex-wrap gap-4 mt-4">
                  <button className={themeUtils.getButtonVariant('primary')}>
                    Primary Button
                  </button>
                  <button className={themeUtils.getButtonVariant('secondary')}>
                    Secondary Button
                  </button>
                  <button className={themeUtils.getButtonVariant('ghost')}>
                    Ghost Button
                  </button>
                  <button className={themeUtils.getButtonVariant('danger')}>
                    Danger Button
                  </button>
                </div>
              </div>

              {/* Status Badges */}
              <div>
                <h3 className={themeUtils.headingClasses(3)}>Status Badges</h3>
                <div className="flex flex-wrap gap-4 mt-4">
                  <span className={themeUtils.getStatusBadge('success')}>
                    <span className={themeUtils.getLiveIndicator()}></span>
                    Success
                  </span>
                  <span className={themeUtils.getStatusBadge('warning')}>
                    Warning
                  </span>
                  <span className={themeUtils.getStatusBadge('error')}>
                    Error
                  </span>
                  <span className={themeUtils.getStatusBadge('info')}>
                    Info
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div>
                <h3 className={themeUtils.headingClasses(3)}>Card Variants</h3>
                <div className="grid grid-cols-1 tablet:grid-cols-3 gap-4 mt-4">
                  <div className={themeUtils.getCardStyles('default')}>
                    <div className="p-4">
                      <h4 className="font-semibold">Default Card</h4>
                      <p className="text-text-secondary text-sm mt-2">
                        Standard surface styling
                      </p>
                    </div>
                  </div>
                  <div className={themeUtils.getCardStyles('elevated')}>
                    <div className="p-4">
                      <h4 className="font-semibold">Elevated Card</h4>
                      <p className="text-text-secondary text-sm mt-2">
                        Higher surface with more shadow
                      </p>
                    </div>
                  </div>
                  <div className={themeUtils.getCardStyles('glass')}>
                    <div className="p-4">
                      <h4 className="font-semibold">Glass Card</h4>
                      <p className="text-text-secondary text-sm mt-2">
                        Frosted glass effect
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Animation Examples */}
        <section className={themeUtils.getCardStyles('glass')}>
          <div className="p-6">
            <h2 className={themeUtils.headingClasses(2)}>
              Animation System
            </h2>
            <p className="text-text-secondary mb-6">
              Performance-optimized animations with proper timing (Requirements 6.1, 6.2, 6.4)
            </p>

            <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-4 gap-4">
              <div className="bg-primary/20 border border-primary rounded-lg p-4 animate-fade-in">
                <div className={themeUtils.labelClasses()}>Fade In</div>
                <div className="text-sm text-text-secondary">200ms transition</div>
              </div>
              <div className="bg-secondary/20 border border-secondary rounded-lg p-4 animate-slide-up">
                <div className={themeUtils.labelClasses()}>Slide Up</div>
                <div className="text-sm text-text-secondary">Smooth entrance</div>
              </div>
              <div className="bg-success/20 border border-success rounded-lg p-4 animate-glow">
                <div className={themeUtils.labelClasses()}>Glow Effect</div>
                <div className="text-sm text-text-secondary">Infinite alternate</div>
              </div>
              <div className="bg-warning/20 border border-warning rounded-lg p-4 animate-pulse-slow">
                <div className={themeUtils.labelClasses()}>Pulse</div>
                <div className="text-sm text-text-secondary">2s duration</div>
              </div>
            </div>
          </div>
        </section>

        {/* Theme Values Debug */}
        <section className={themeUtils.getCardStyles('default')}>
          <div className="p-6">
            <h2 className={themeUtils.headingClasses(2)}>
              Theme Values Debug
            </h2>
            <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4 mt-4 font-mono text-sm">
              <div>
                <div className={themeUtils.labelClasses()}>Primary Color</div>
                <div className="text-primary">{getThemeValue('primary.DEFAULT')}</div>
              </div>
              <div>
                <div className={themeUtils.labelClasses()}>Background</div>
                <div>{getThemeValue('background.base')}</div>
              </div>
              <div>
                <div className={themeUtils.labelClasses()}>Text Primary</div>
                <div>{getThemeValue('text.primary')}</div>
              </div>
              <div>
                <div className={themeUtils.labelClasses()}>Border Default</div>
                <div>{getThemeValue('border.DEFAULT')}</div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

// Color Swatch Component
interface ColorSwatchProps {
  color: string;
  label: string;
  glow?: boolean;
}

const ColorSwatch: FC<ColorSwatchProps> = ({ color, label, glow }) => {
  return (
    <div className="text-center space-y-2">
      <div 
        className={`w-full h-16 rounded-lg border transition-all duration-200 hover:scale-105 ${
          glow ? 'shadow-glow' : 'border-border-default'
        }`}
        style={{ 
          backgroundColor: color,
          boxShadow: glow ? `0 0 20px ${color}40` : undefined
        }}
      />
      <div>
        <div className="text-xs font-mono font-semibold">{label}</div>
        <div className="text-xs text-text-secondary font-mono">{color}</div>
      </div>
    </div>
  );
};

export default ThemeExample;