import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const Modal = ({ isOpen, onClose, title, children, className }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={twMerge(
            'relative bg-white rounded-3xl shadow-premium w-full max-w-lg overflow-hidden',
            className
          )}
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h3 className="text-xl font-bold text-slate-800">{title}</h3>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-6">
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default Modal;
