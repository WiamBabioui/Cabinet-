import React from 'react';
import { twMerge } from 'tailwind-merge';

const Card = ({ children, title, subtitle, icon: Icon, className, headerAction }) => {
  return (
    <div className={twMerge('premium-card p-6 overflow-hidden', className)}>
      {(title || subtitle || Icon) && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {Icon && (
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
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
    </div>
  );
};

export default Card;
