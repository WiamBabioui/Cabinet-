import React, { useId } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

const Input = ({ 
  label, 
  error, 
  icon: Icon, 
  className, 
  containerClassName,
  id,
  name,
  ...props 
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const inputName = name || inputId;

  return (
    <div className={twMerge("flex flex-col gap-1 w-full", containerClassName)}>
      <div className="relative group">
        {Icon && (
          <div className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 peer-focus:text-purple transition-all duration-300 group-focus-within:scale-110 z-10">
            <Icon size={18} strokeWidth={2.5} />
          </div>
        )}
        <input
          id={inputId}
          name={inputName}
          placeholder=" "
          className={twMerge(
            'peer w-full bg-white/50 border border-slate-200/50 rounded-2xl px-5 pt-10 pb-3 outline-none transition-all duration-300 font-medium text-slate-700',
            'focus:bg-white focus:border-purple focus:ring-4 focus:ring-purple/20 backdrop-blur-md',
            'dark:bg-indigo/50 dark:border-white/10 dark:text-slate-100 dark:focus:bg-indigo/80',
            Icon && 'ps-12',
            error && 'border-coral focus:border-coral focus:ring-coral/20',
            className
          )}
          {...props}
        />
        {label && (
          <label 
            htmlFor={inputId} 
            className={twMerge(
              "absolute start-5 top-5 text-slate-400 text-sm transition-all duration-300 pointer-events-none origin-[0] font-medium",
              Icon && "start-12",
              // Floating state: when focused OR when not empty (placeholder not shown)
              "peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-purple peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-widest",
              "peer-[:not(:placeholder-shown)]:-translate-y-3 peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-widest",
              "dark:text-slate-500 dark:peer-focus:text-purple"
            )}
          >
            {label}
          </label>
        )}
      </div>
      {error && (
        <motion.span 
          initial={{ opacity: 0, y: -5 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-xs font-medium text-coral ms-1 flex items-center gap-1 mt-1"
        >
          <span className="w-1 h-1 bg-coral rounded-full" /> {error}
        </motion.span>
      )}
    </div>
  );
};

export default Input;
