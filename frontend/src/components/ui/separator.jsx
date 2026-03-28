import React from 'react';

const Separator = React.forwardRef(({ className = '', orientation = 'horizontal', ...props }, ref) => (
  <div
    ref={ref}
    className={`shrink-0 bg-slate-700/30 ${
      orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px'
    } ${className}`}
    {...props}
  />
));
Separator.displayName = 'Separator';

export { Separator };
