import React from 'react';
import { useTranslation } from 'react-i18next';

const Logo = ({ size = 'md', className, showText = true }) => {
  const { t } = useTranslation();
  const isSm = size === 'sm';
  const isLg = size === 'lg';
  const maskId = React.useId().replace(/:/g, '-');
  
  const sizeClass = isSm ? 'w-9 h-9' : isLg ? 'w-14 h-14' : 'w-11 h-11';
  
  return (
    <div className={`flex items-center gap-3 w-fit select-none ${className || 'text-purple dark:text-white'}`}>
      <svg 
        viewBox="0 0 100 100" 
        className={`${sizeClass} flex-shrink-0 transition-all duration-300`}
        style={{ fill: 'none' }}
      >
        <defs>
          <mask id={`mask-${maskId}`}>
            {/* Keeping everything in white visible */}
            <rect x="0" y="0" width="100" height="100" fill="white" />
            
            {/* Cut out a gap around the plus sign using black */}
            <g stroke="black" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round">
              <line x1="46" y1="50" x2="82" y2="50" />
              <line x1="64" y1="32" x2="64" y2="68" />
            </g>
          </mask>
        </defs>
        
        {/* The "C" shape */}
        <path 
          d="M 69,36 A 18,18 0 0 0 51,18 L 39,18 A 21,21 0 0 0 18,39 L 18,61 A 21,21 0 0 0 39,82 L 51,82 A 18,18 0 0 0 69,64" 
          stroke="currentColor" 
          strokeWidth="16" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          mask={`url(#mask-${maskId})`} 
        />
        
        {/* The medical "+" shape */}
        <g stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round">
          <line x1="46" y1="50" x2="82" y2="50" />
          <line x1="64" y1="32" x2="64" y2="68" />
        </g>
      </svg>
      {showText && (
        <span className={`
          font-serif font-black tracking-tight text-current
          ${isSm ? 'text-xl' : isLg ? 'text-4xl' : 'text-2xl'}
        `}>
          Cabinet<span className="text-emerald">+</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
