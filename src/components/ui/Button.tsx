import { forwardRef, type ReactNode, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-display font-semibold tracking-wider uppercase transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 disabled:opacity-50 disabled:pointer-events-none';
    const variants: Record<string, string> = {
      primary: 'bg-cyan-600/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/50 backdrop-blur-sm hover:shadow-[0_0_15px_rgba(0,212,255,0.15)]',
      secondary: 'bg-slate-800/50 text-slate-200 hover:bg-slate-700/50 border border-slate-700 backdrop-blur-sm',
      ghost: 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200',
      danger: 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50 backdrop-blur-sm',
      success: 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/50 backdrop-blur-sm',
    };
    const sizes: Record<string, string> = { sm: 'h-8 px-3 text-xs rounded-md', md: 'h-10 px-4 py-2 text-sm rounded-lg', lg: 'h-12 px-8 text-base rounded-lg' };

    return (
      <button ref={ref} className={[base, variants[variant], sizes[size], className].filter(Boolean).join(' ')} disabled={loading || props.disabled} {...props}>
        {loading ? <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
