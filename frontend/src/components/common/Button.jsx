import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
    primary: 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20',
    secondary: 'bg-secondary text-white hover:bg-secondary-dark shadow-lg shadow-secondary/20',
    outline: 'border-2 border-primary text-primary hover:bg-primary/5',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5',
    lg: 'px-8 py-3.5 text-lg',
  };

  return (
    <button
      className={twMerge(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {Icon && <Icon size={18} />}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
