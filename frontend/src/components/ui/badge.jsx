import React from 'react';

const Badge = React.forwardRef(({ className = '', variant = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 hover:bg-cyan-500/30',
    destructive: 'bg-red-500/20 border border-red-500/40 text-red-200 hover:bg-red-500/30',
    outline: 'border border-slate-600 text-slate-300 hover:bg-slate-800/50',
    secondary: 'bg-slate-700/50 border border-slate-600/50 text-slate-200 hover:bg-slate-600/50',
    success: 'bg-green-500/20 border border-green-500/40 text-green-200 hover:bg-green-500/30',
    warning: 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-200 hover:bg-yellow-500/30',
  };

  return (
    <span
      ref={ref}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors cursor-default ${variants[variant]} ${className}`}
      {...props}
    />
  );
});
Badge.displayName = 'Badge';

export { Badge };
