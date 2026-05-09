import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const DashboardLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const marginStyle = isRtl 
    ? { marginRight: isCollapsed ? '80px' : '288px', marginLeft: 0 }
    : { marginLeft: isCollapsed ? '80px' : '288px', marginRight: 0 };

  return (
    <div className="min-h-screen bg-slate-50 flex" dir={isRtl ? 'rtl' : 'ltr'}>
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div 
        className="flex-1 flex flex-col transition-all duration-300" 
        style={marginStyle}
      >
        <Navbar />
        <main className="p-8 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={window.location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto"
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
