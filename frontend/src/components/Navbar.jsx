import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, Mail, LogOut, User, Settings, ChevronDown, X, Sparkles, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import LanguageSwitcher from './common/LanguageSwitcher';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Dropdown Notifications ───────────────────────────────────────────────────
const NotificationsDropdown = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data.notifications);
      } catch (err) {
        console.error('Failed to fetch notifications');
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute end-0 top-16 w-96 bg-white/80 backdrop-blur-2xl rounded-3xl shadow-glow border border-white/50 z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/30 bg-gradient-to-r from-purple/5 to-transparent">
        <h3 className="font-black text-slate-800 text-base tracking-tight flex items-center gap-2">
          <Bell size={16} className="text-purple" /> {t('nav.notifications')}
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100/80 rounded-xl transition-colors">
          <X size={18} className="text-slate-400" />
        </button>
      </div>
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
             <div className="w-10 h-10 border-4 border-purple/20 border-t-purple rounded-full animate-spin" />
             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t('nav.loading')}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-purple/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple/30">
               <Bell size={32} />
            </div>
            <p className="text-sm font-bold text-slate-400">{t('nav.no_notifs')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/50">
            {notifications.map((n) => (
              <div key={n._id} className={`px-6 py-4 hover:bg-purple/5 transition-all cursor-pointer group ${!n.isRead ? 'bg-purple/5' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${!n.isRead ? 'bg-purple shadow-glow' : 'bg-slate-200'}`} />
                  <div>
                    <p className="text-sm font-bold text-slate-800 group-hover:text-purple transition-colors">{n.title}</p>
                    <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="px-6 py-4 border-t border-white/30 bg-slate-50/50 text-center">
        <button className="text-xs font-black text-purple uppercase tracking-widest hover:text-purple/70 transition-colors">
          {t('nav.view_all')}
        </button>
      </div>
    </motion.div>
  );
};

// ─── Dropdown Messages ────────────────────────────────────────────────────────
const MessagesDropdown = ({ onClose }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchConvs = async () => {
      try {
        const res = await api.get('/chat/conversations');
        setConversations(res.data.conversations.slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch conversations');
      } finally {
        setLoading(false);
      }
    };
    fetchConvs();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute end-0 top-16 w-96 bg-white/80 backdrop-blur-2xl rounded-3xl shadow-glow border border-white/50 z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/30 bg-gradient-to-r from-emerald/5 to-transparent">
        <h3 className="font-black text-slate-800 text-base tracking-tight flex items-center gap-2">
          <Mail size={16} className="text-emerald" /> {t('nav.recent_messages')}
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100/80 rounded-xl transition-colors">
          <X size={18} className="text-slate-400" />
        </button>
      </div>
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
             <div className="w-10 h-10 border-4 border-emerald/20 border-t-emerald rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-emerald/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald/30">
               <Mail size={32} />
            </div>
            <p className="text-sm font-bold text-slate-400">{t('nav.no_messages')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/50">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => { navigate('/chat', { state: { contactId: conv.other_user.id } }); onClose(); }}
                className="w-full px-6 py-4 hover:bg-emerald/5 border-b border-slate-50 flex items-center gap-4 text-left transition-all group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-emerald to-mint rounded-2xl flex items-center justify-center text-indigo font-black text-xs overflow-hidden shrink-0 group-hover:scale-110 transition-transform duration-300">
                  {conv.other_user.photo_url ? (
                    <img src={conv.other_user.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : conv.other_user.prenom.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <p className="text-sm font-black text-slate-800 truncate leading-none group-hover:text-emerald transition-colors">{conv.other_user.prenom} {conv.other_user.nom}</p>
                    <span className="text-[10px] font-bold text-slate-400 shrink-0 uppercase tracking-tighter">{new Date(conv.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 truncate leading-relaxed">{conv.lastMessage?.text}</p>
                </div>
                {conv.unread_count > 0 && (
                  <div className="w-2.5 h-2.5 bg-emerald rounded-full shrink-0 shadow-glow-emerald ring-4 ring-emerald/10 animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="px-6 py-4 border-t border-white/30 bg-slate-50/50 text-center">
        <button 
          onClick={() => { navigate('/chat'); onClose(); }}
          className="text-xs font-black text-emerald uppercase tracking-widest hover:text-emerald/70 transition-colors"
        >
          {t('nav.open_chat')}
        </button>
      </div>
    </motion.div>
  );
};

// ─── Dropdown Profil ──────────────────────────────────────────────────────────
const ProfileDropdown = ({ user, onClose, onLogout }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute end-0 top-16 w-72 bg-white/80 backdrop-blur-2xl rounded-3xl shadow-glow border border-white/50 z-50 overflow-hidden"
    >
      <div className="p-6 bg-gradient-to-br from-purple/10 via-coral/5 to-transparent border-b border-white/30">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-coral to-gold rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-glow">
            {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-black text-slate-800 text-base truncate leading-none mb-1">
              {user?.prenom} {user?.nom}
            </p>
            <p className="text-[11px] font-bold text-slate-400 truncate uppercase tracking-wider">{user?.email}</p>
            <div className="flex items-center gap-1.5 mt-2">
               <div className="w-1.5 h-1.5 bg-emerald rounded-full shadow-glow-emerald" />
               <span className="text-[10px] font-black text-purple uppercase tracking-widest">
                 {t(`roles.${user?.role}`)}
               </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3">
        <button
          onClick={() => { navigate('/profile'); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-purple/5 hover:text-purple rounded-2xl transition-all"
        >
          <User size={18} className="text-slate-400" />
          {t('nav.profile')}
        </button>
        <button
          onClick={() => { navigate('/profile'); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-purple/5 hover:text-purple rounded-2xl transition-all"
        >
          <Settings size={18} className="text-slate-400" />
          {t('nav.settings')}
        </button>
      </div>

      <div className="p-3 border-t border-white/30">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-black text-coral hover:bg-coral/10 rounded-2xl transition-all uppercase tracking-widest group"
        >
          <motion.div whileHover={{ x: -3 }}><LogOut size={18} strokeWidth={2.5} /></motion.div>
          {t('nav.logout')}
        </button>
      </div>
    </motion.div>
  );
};

// ─── Navbar Principale ────────────────────────────────────────────────────────
const Navbar = () => {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const [showNotifs,   setShowNotifs]   = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showProfile,  setShowProfile]  = useState(false);
  const [notifCount,   setNotifCount]   = useState(0);
  const [msgCount,     setMsgCount]     = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [notifRes, chatRes] = await Promise.all([
          api.get('/notifications'),
          api.get('/chat/conversations')
        ]);
        setNotifCount(notifRes.data.unread || 0);
        const totalUnreadMsg = chatRes.data.conversations.reduce((acc, conv) => acc + (conv.unread_count || 0), 0);
        setMsgCount(totalUnreadMsg);
      } catch (err) {
        console.error('Failed to fetch navbar counts');
      }
    };
    
    if (user) {
      fetchCounts();
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      const handleNotification = () => {
        setNotifCount(prev => prev + 1);
      };

      const handleMessage = () => {
        if (location.pathname !== '/chat') {
          setMsgCount(prev => prev + 1);
        }
      };

      socket.on('new_notification', handleNotification);
      socket.on('receive_message', handleMessage);

      return () => {
        socket.off('new_notification', handleNotification);
        socket.off('receive_message', handleMessage);
      };
    }
  }, [socket, location.pathname]);

  const navRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setShowNotifs(false);
        setShowMessages(false);
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const NavIconButton = ({ onClick, active, children, count, color = 'purple' }) => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`p-3 rounded-2xl transition-all duration-300 relative group ${
        active
          ? `bg-gradient-to-br from-${color} to-${color}/70 text-white shadow-lg`
          : 'text-slate-500 hover:bg-white/50 hover:text-slate-800 hover:shadow-glass'
      }`}
    >
      {children}
      {count > 0 && (
        <span className={`absolute -top-1 -end-1 w-5 h-5 bg-coral text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white shadow-sm`}>
          {count}
        </span>
      )}
    </motion.button>
  );

  return (
    <header className="h-20 bg-white/60 backdrop-blur-xl border-b border-white/30 flex items-center justify-between px-8 sticky top-0 z-40 shadow-glass">
      {/* Search Bar */}
      <div className="flex items-center gap-4 bg-white/40 backdrop-blur-md px-5 py-3 rounded-2xl w-full max-w-md border border-white/50 transition-all duration-300 focus-within:bg-white/80 focus-within:ring-4 focus-within:ring-purple/15 focus-within:border-purple/30 focus-within:shadow-glass group">
        <Search size={18} className="text-slate-400 group-focus-within:text-purple transition-colors flex-shrink-0" strokeWidth={2.5} />
        <input
          type="text"
          placeholder={t('nav.search')}
          className="bg-transparent border-none outline-none text-sm font-bold w-full placeholder:text-slate-400 placeholder:font-medium text-slate-700"
        />
        <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-slate-100/80 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-200/50 flex-shrink-0">
           ⌘ K
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2" ref={navRef}>
        
        {/* Messages */}
        <div className="relative">
          <NavIconButton onClick={() => { setShowMessages(!showMessages); setShowNotifs(false); setShowProfile(false); }} active={showMessages} count={msgCount} color="emerald">
            <Mail size={22} strokeWidth={showMessages ? 2.5 : 2} />
          </NavIconButton>
          <AnimatePresence>
            {showMessages && <MessagesDropdown onClose={() => setShowMessages(false)} />}
          </AnimatePresence>
        </div>

        {/* Notifications */}
        <div className="relative">
          <NavIconButton onClick={() => { setShowNotifs(!showNotifs); setShowMessages(false); setShowProfile(false); }} active={showNotifs} count={notifCount} color="purple">
            <Bell size={22} strokeWidth={showNotifs ? 2.5 : 2} />
          </NavIconButton>
          <AnimatePresence>
            {showNotifs && <NotificationsDropdown onClose={() => setShowNotifs(false)} />}
          </AnimatePresence>
        </div>

        <div className="w-[1px] h-8 bg-slate-200/50 mx-2 hidden md:block" />

        {/* Language & Profile */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); setShowMessages(false); }}
            className={`flex items-center gap-3 p-1.5 pe-4 rounded-2xl transition-all duration-300 group ${
              showProfile ? 'bg-purple/10 ring-4 ring-purple/10 border border-purple/20' : 'bg-white/30 hover:bg-white/60 border border-white/50 hover:border-white/80 hover:shadow-glass'
            }`}
          >
            <div className="w-10 h-10 bg-gradient-to-tr from-coral to-gold rounded-xl flex items-center justify-center font-black text-white text-sm shadow-glow transition-transform duration-300 group-hover:scale-110">
              {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-sm font-black text-slate-800 leading-none mb-1 flex items-center gap-2">
                {user?.prenom} {user?.nom}
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${showProfile ? 'rotate-180' : ''}`} />
              </p>
              <div className="flex items-center gap-1.5">
                 <motion.div animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-1.5 h-1.5 rounded-full bg-emerald" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   {t(`roles.${user?.role}`)}
                 </span>
              </div>
            </div>
          </motion.button>
        </div>

        <AnimatePresence>
          {showProfile && (
            <ProfileDropdown
              user={user}
              onClose={() => setShowProfile(false)}
              onLogout={handleLogout}
            />
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Navbar;
