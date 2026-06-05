import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, MessageSquare,
  Stethoscope, LogOut, ChevronLeft, ChevronRight,
  ShieldCheck, UserCircle, UserCog, HeartPulse, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, onMobileClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const displayUser = user || {};
  const rawRole = displayUser.role?.toLowerCase().trim();
  const userRole = rawRole || 'patient';

  const links = [
    {
      name: t('sidebar.dashboard'),
      icon: LayoutDashboard,
      path: userRole === 'secretaire' ? '/assistant-dashboard' : '/',
      roles: ['medecin', 'secretaire']
    },
    {
      name: t('sidebar.patients'),
      icon: Users,
      path: '/patients',
      roles: ['medecin', 'secretaire']
    },
    {
      name: t('sidebar.appointments'),
      icon: Calendar,
      path: '/appointments',
      roles: ['medecin', 'secretaire', 'patient']
    },
    {
      name: t('sidebar.consultation'),
      icon: Stethoscope,
      path: '/consultation',
      roles: ['medecin']
    },
    {
      name: t('sidebar.chat'),
      icon: MessageSquare,
      path: '/chat',
      roles: ['medecin', 'secretaire', 'patient']
    },
    {
      name: t('sidebar.profile'),
      icon: UserCog,
      path: '/profile',
      roles: ['medecin', 'secretaire', 'patient']
    },
    {
      name: t('sidebar.patient_portal'),
      icon: UserCircle,
      path: '/patient-portal',
      roles: ['patient']
    },
  ];

  const filteredLinks = links.filter(link =>
    link.roles.some(role => role.toLowerCase() === userRole)
  );

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const isRtl = i18n.language === 'ar';

  const handleNavClick = () => {
    // Close mobile sidebar when a link is clicked
    onMobileClose?.();
  };

  return (
    <>
      {/* ── Desktop Sidebar (lg+): fixed, always visible ── */}
      <aside className={twMerge(
        "hidden lg:flex fixed top-4 bottom-4 transition-all duration-500 ease-in-out z-50 flex-col rounded-3xl overflow-hidden glass-sidebar",
        isRtl ? 'right-4' : 'left-4',
        isCollapsed ? 'w-20' : 'w-72'
      )}>
        {/* Logo */}
        <div className="p-6 flex items-center justify-between overflow-hidden relative">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 z-10"
              >
                <div className="w-10 h-10 bg-gradient-to-tr from-purple to-mint rounded-2xl flex items-center justify-center text-indigo shadow-glow-emerald">
                  <HeartPulse size={22} strokeWidth={2.5} />
                </div>
                <span className="font-black text-2xl text-slate-800 dark:text-white tracking-tighter">
                  Cabinet<span className="text-purple">+</span>
                </span>
              </motion.div>
            )}
            {isCollapsed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-10 h-10 bg-gradient-to-tr from-purple to-mint text-indigo rounded-2xl flex items-center justify-center mx-auto shadow-glow-emerald z-10"
              >
                <HeartPulse size={22} strokeWidth={2.5} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed?.(!isCollapsed)}
          className={twMerge(
            "absolute top-8 w-6 h-12 bg-white/40 dark:bg-indigo/40 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-full shadow-soft flex items-center justify-center text-slate-500 hover:text-purple hover:border-purple/50 transition-all duration-300 z-50",
            isRtl ? 'left-[-12px]' : 'right-[-12px]'
          )}
        >
          {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
        </button>

        {/* Navigation */}
        <SidebarNav filteredLinks={filteredLinks} isCollapsed={isCollapsed} t={t} onNavClick={handleNavClick} />

        {/* Profile + Logout */}
        <SidebarProfile
          displayUser={displayUser}
          isCollapsed={isCollapsed}
          userRole={userRole}
          t={t}
          handleLogout={handleLogout}
        />
      </aside>

      {/* ── Mobile Sidebar (< lg): off-canvas drawer ── */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            key="mobile-sidebar"
            initial={{ x: isRtl ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: isRtl ? '100%' : '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={twMerge(
              "lg:hidden fixed top-0 bottom-0 w-72 z-50 flex flex-col glass-sidebar rounded-none sm:rounded-3xl",
              isRtl ? 'right-0 sm:right-4 sm:top-4 sm:bottom-4' : 'left-0 sm:left-4 sm:top-4 sm:bottom-4'
            )}
          >
            {/* Mobile Header with Close */}
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-purple to-mint rounded-2xl flex items-center justify-center text-indigo shadow-glow-emerald">
                  <HeartPulse size={22} strokeWidth={2.5} />
                </div>
                <span className="font-black text-xl text-slate-800 tracking-tighter">
                  Cabinet<span className="text-purple">+</span>
                </span>
              </div>
              <button
                onClick={onMobileClose}
                className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-slate-100/50 text-slate-400 hover:text-slate-700 transition-all"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Navigation */}
            <SidebarNav filteredLinks={filteredLinks} isCollapsed={false} t={t} onNavClick={handleNavClick} />

            {/* Profile + Logout */}
            <SidebarProfile
              displayUser={displayUser}
              isCollapsed={false}
              userRole={userRole}
              t={t}
              handleLogout={handleLogout}
            />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

/* ── Shared sub-components ── */

const SidebarNav = ({ filteredLinks, isCollapsed, t, onNavClick }) => (
  <nav className="flex-1 px-4 space-y-1.5 mt-2 overflow-y-auto custom-scrollbar relative z-10">
    {filteredLinks.map((link) => (
      <NavLink
        key={link.name}
        to={link.path}
        end={link.path === '/'}
        onClick={onNavClick}
        className={({ isActive }) => twMerge(
          "flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 relative group overflow-hidden",
          isActive ? 'text-white shadow-lg shadow-purple/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white',
          isCollapsed ? 'justify-center px-0' : ''
        )}
        title={isCollapsed ? link.name : ''}
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <motion.div
                layoutId="sidebar-active-bg"
                className="absolute inset-0 bg-gradient-to-r from-purple to-[#9b82ff] rounded-2xl"
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <div className="relative z-10 flex items-center gap-4 w-full">
              <motion.div whileHover={{ scale: 1.1, rotate: isActive ? 0 : 10 }} className={isCollapsed ? "mx-auto" : ""}>
                <link.icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? 'text-white' : 'group-hover:text-purple transition-colors'}
                />
              </motion.div>
              {!isCollapsed && <span className="tracking-tight whitespace-nowrap">{link.name}</span>}
            </div>
          </>
        )}
      </NavLink>
    ))}
  </nav>
);

const SidebarProfile = ({ displayUser, isCollapsed, userRole, t, handleLogout }) => (
  <div className="p-4 mt-auto relative z-10">
    <div className={twMerge(
      "p-4 bg-white/30 dark:bg-indigo/30 backdrop-blur-md rounded-3xl transition-all duration-300 border border-white/40 dark:border-white/10 shadow-glass",
      isCollapsed ? 'flex justify-center flex-col items-center gap-4' : 'block'
    )}>
      {!isCollapsed ? (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-tr from-coral to-gold rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-glow flex-shrink-0 hover:scale-110 transition-transform cursor-pointer overflow-hidden">
            {displayUser.photo_url ? (
              <img src={displayUser.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{displayUser.prenom?.charAt(0) || '?'}{displayUser.nom?.charAt(0) || ''}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-800 dark:text-white truncate leading-none mb-1.5">
              {displayUser.prenom || ''} {displayUser.nom || ''}
            </p>
            <div className="flex items-center gap-1.5">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-1.5 h-1.5 rounded-full bg-emerald"
              />
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                {userRole ? t(`roles.${userRole}`) : '...'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-10 h-10 bg-gradient-to-tr from-coral to-gold rounded-xl flex items-center justify-center text-white font-black text-xs shadow-glow cursor-pointer overflow-hidden">
          {displayUser.photo_url ? (
            <img src={displayUser.photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span>{displayUser.prenom?.charAt(0) || '?'}{displayUser.nom?.charAt(0) || ''}</span>
          )}
        </div>
      )}

      <button
        onClick={handleLogout}
        className={twMerge(
          "w-full flex items-center gap-3 mt-4 p-3 text-coral hover:bg-coral/10 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest group",
          isCollapsed ? 'justify-center p-2 mt-0' : ''
        )}
      >
        <motion.div whileHover={{ x: -3 }}>
          <LogOut size={isCollapsed ? 18 : 16} strokeWidth={2.5} className="group-hover:text-rose-500" />
        </motion.div>
        {!isCollapsed && <span>{t('sidebar.logout')}</span>}
      </button>
    </div>
  </div>
);

export default Sidebar;
