import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const DashboardLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { i18n } = useTranslation();
  const location = useLocation();
  const isRtl = i18n.language === 'ar';

  // New sidebar widths: collapsed = 80px (w-20), expanded = 288px (w-72)
  // Plus 16px margin on left and 16px gap = total offset needed
  const sidebarWidth = isCollapsed ? '112px' : '320px';

  return (
    <div className={`min-h-screen bg-slate-50/50 dark:bg-[#0f1123] flex ${isRtl ? 'font-arabic' : 'font-sans'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <div 
        className="flex-1 flex flex-col transition-all duration-500 ease-in-out relative z-10" 
        style={{ 
          paddingRight: isRtl ? sidebarWidth : 0,
          paddingLeft: !isRtl ? sidebarWidth : 0 
        }}
      >
        <Navbar />
        
        <main className="p-8 md:p-10 flex-1 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-[1600px] mx-auto"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};


export default DashboardLayout;
