import React from 'react';

const Button = React.forwardRef(({ className = '', variant = 'default', size = 'md', ...props }, ref) => {
  const variants = {
    default: 'bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-semibold',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold',
    outline: 'border border-slate-600 hover:border-slate-500 bg-transparent text-slate-200 hover:bg-slate-800/30 font-semibold',
    ghost: 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/30 font-semibold',
    destructive: 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 font-semibold',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-lg',
  };

  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export { Button };
