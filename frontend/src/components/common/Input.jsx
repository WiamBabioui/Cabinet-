import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Input = ({ 
  label, 
  error, 
  icon: Icon, 
  className, 
  ...props 
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-semibold text-slate-700 ms-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
            <Icon size={18} />
          </div>
        )}
        <input
          className={twMerge(
            'w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none transition-all duration-200',
            'focus:border-primary focus:ring-4 focus:ring-primary/10',
            Icon && 'ps-11',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/10',
            className
          )}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-red-500 ms-1">{error}</span>}
    </div>
  );
};

export default Input;
