import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  type = 'button',
  ...props
}, ref) => {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover focus:ring-primary/30',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate/30',
    outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate/30',
    ghost: 'text-slate-700 hover:bg-slate-100 focus:ring-slate/30',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red/30',
    verification: 'bg-verification-text text-white hover:bg-verification-text/90 focus:ring-verification/30',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
    icon: 'p-2.5',
  };

  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-lg
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors
  `;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;