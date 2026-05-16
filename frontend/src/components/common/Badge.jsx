import React from 'react';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

const Badge = ({ children, variant = 'info', className }) => {
  const variants = {
    success: 'bg-emerald/10 text-emerald border-emerald/20 dark:bg-emerald/20 dark:text-emerald dark:border-emerald/30',
    warning: 'bg-gold/10 text-gold border-gold/20 dark:bg-gold/20 dark:text-gold dark:border-gold/30',
    error: 'bg-coral/10 text-coral border-coral/20 dark:bg-coral/20 dark:text-coral dark:border-coral/30',
    info: 'bg-purple/10 text-purple border-purple/20 dark:bg-purple/20 dark:text-purple dark:border-purple/30',
    pending: 'bg-indigo/10 text-indigo border-indigo/20 dark:bg-indigo/30 dark:text-indigo-200 dark:border-indigo/40',
    mint: 'bg-mint/10 text-mint border-mint/20 dark:bg-mint/20 dark:text-mint dark:border-mint/30',
  };

  const dotColors = {
    success: 'bg-emerald',
    warning: 'bg-gold',
    error: 'bg-coral',
    info: 'bg-purple',
    pending: 'bg-indigo',
    mint: 'bg-mint',
  };

  return (
    <span className={twMerge(
      'px-3 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider inline-flex items-center gap-1.5 backdrop-blur-sm',
      variants[variant] || variants.info,
      className
    )}>
      <motion.span 
        animate={{ opacity: [1, 0.5, 1], scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className={twMerge("w-1.5 h-1.5 rounded-full shadow-sm", dotColors[variant] || dotColors.info)} 
      />
      {children}
    </span>
  );
};

export default Badge;
