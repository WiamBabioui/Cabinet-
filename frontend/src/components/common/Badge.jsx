import React from 'react';
import { twMerge } from 'tailwind-merge';

const Badge = ({ children, variant = 'info', className }) => {
  const variants = {
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    pending: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span className={twMerge(
      'px-2.5 py-0.5 rounded-full text-xs font-semibold border lowercase',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};

export default Badge;
