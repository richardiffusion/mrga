import React from 'react';
import { cn } from '@/lib/utils';

const Slider = React.forwardRef(({ className, value, onValueChange, max = 100, step = 1, ...props }, ref) => {
  const handleChange = (e) => {
    onValueChange && onValueChange([parseInt(e.target.value)]);
  };

  return (
    <div className={cn('relative flex w-full touch-none select-none items-center', className)}>
      <input
        ref={ref}
        type="range"
        min="0"
        max={max}
        step={step}
        value={value ? value[0] : 0}
        onChange={handleChange}
        className="relative flex w-full cursor-pointer appearance-none rounded-full h-2 bg-gray-200"
        {...props}
      />
      <div 
        className="absolute h-2 bg-purple-500 rounded-full"
        style={{ width: `${(value ? value[0] : 0) / max * 100}%` }}
      />
    </div>
  );
});

Slider.displayName = 'Slider';

export { Slider };