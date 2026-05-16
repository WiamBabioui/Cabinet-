import React from 'react';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

const Card = ({ children, title, subtitle, icon: Icon, className, headerAction }) => {
  return (
    <motion.div 
      whileHover={{ y: -4, boxShadow: '0 20px 40px -8px rgba(124,92,255,0.12)' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={twMerge('glass-card p-6 overflow-hidden', className)}
    >
      {(title || subtitle || Icon) && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {Icon && (
              <div className="p-3 bg-gradient-to-br from-purple/10 to-emerald/10 text-purple rounded-2xl border border-purple/10">
                <Icon size={24} />
              </div>
            )}
            <div>
              {title && <h3 className="text-lg font-bold text-slate-800">{title}</h3>}
              {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
            </div>
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      {children}
    </motion.div>
  );
};

export default Card;
