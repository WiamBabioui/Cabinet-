import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className, 
  isLoading, 
  icon: Icon,
  ...props 
}) => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'border-2 border-slate-200 text-slate-700 hover:border-purple hover:text-purple hover:bg-purple/5 dark:border-slate-700 dark:text-slate-300 dark:hover:border-purple dark:hover:bg-purple/10',
    ghost: 'text-slate-600 hover:bg-slate-50 hover:text-purple dark:text-slate-400 dark:hover:bg-indigo/30',
    danger: 'bg-gradient-to-r from-coral to-rose-500 text-white shadow-lg shadow-coral/30 hover:shadow-xl hover:shadow-coral/40',
    glass: 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-xl',
    md: 'px-6 py-3 rounded-2xl',
    lg: 'px-8 py-4 text-lg rounded-2xl font-bold',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      className={twMerge(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 ease-out disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {variant !== 'ghost' && children && <span>Chargement...</span>}
        </div>
      ) : (
        <>
          {Icon && <motion.div whileHover={{ rotate: 15 }}><Icon size={size === 'sm' ? 16 : 20} /></motion.div>}
          {children}
        </>
      )}
    </motion.button>
  );
};

export default Button;
