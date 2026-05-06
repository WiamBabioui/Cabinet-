import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl bg-white rounded-3xl shadow-premium overflow-hidden flex min-h-[600px]"
      >
        <div className="hidden lg:flex flex-1 bg-primary relative overflow-hidden p-12 flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/3 translate-y-1/3"></div>
          
          <div className="relative z-10">
            <h1 className="text-4xl font-bold text-white mb-4">Smart Medical Cabinet</h1>
            <p className="text-white/80 text-lg max-w-md">The modern approach to managing your healthcare facility with efficiency and care.</p>
          </div>

          <div className="relative z-10">
            <div className="p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <p className="text-white font-medium italic">"This system has revolutionized how we track patient histories and manage daily appointments."</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                <div>
                  <h4 className="text-white font-bold text-sm">Dr. Sarah Johnson</h4>
                  <span className="text-white/60 text-xs uppercase tracking-wider">Chief Medical Officer</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-8 lg:p-16 flex flex-col justify-center">
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
};

export default AuthLayout;
