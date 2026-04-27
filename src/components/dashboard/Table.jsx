import React from 'react';
import { twMerge } from 'tailwind-merge';

const Table = ({ headers, children, className }) => {
  return (
    <div className={twMerge('overflow-x-auto', className)}>
      <table className="w-full">
        <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
          <tr>
            {headers.map((header, idx) => (
              <th 
                key={idx} 
                className={twMerge(
                  'px-6 py-4 text-left',
                  idx === 0 && 'rounded-l-xl',
                  idx === headers.length - 1 && 'rounded-r-xl'
                )}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {children}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
