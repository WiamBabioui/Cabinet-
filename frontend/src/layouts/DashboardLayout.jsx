import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const DashboardLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { i18n } = useTranslation();
  const location = useLocation();
  const isRtl = i18n.language === 'ar';

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Desktop sidebar widths: collapsed=80px, expanded=288px + 32px margin/gap
  const sidebarWidth = isCollapsed ? '112px' : '320px';

  return (
    <div
      className={`min-h-screen bg-slate-50/50 dark:bg-[#0f1123] flex ${isRtl ? 'font-arabic' : 'font-sans'}`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-indigo/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar — always rendered, mobile controlled via transform */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main content */}
      <div
        className="flex-1 flex flex-col transition-all duration-500 ease-in-out relative z-10 min-w-0"
        style={{
          // Only apply desktop sidebar offset on large screens
          paddingRight: isRtl ? undefined : undefined,
          paddingLeft: undefined,
        }}
      >
        {/* Use CSS classes for desktop offset to avoid inline style overriding on mobile */}
        <style>{`
          @media (min-width: 1024px) {
            .main-content {
              ${isRtl ? `padding-right: ${sidebarWidth}` : `padding-left: ${sidebarWidth}`};
            }
          }
        `}</style>

        <div className="main-content flex-1 flex flex-col">
          <Navbar onMenuToggle={() => setIsMobileOpen((v) => !v)} isMobileMenuOpen={isMobileOpen} />

          <main className="p-4 sm:p-6 md:p-8 lg:p-10 flex-1 overflow-x-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-[1600px] mx-auto"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
