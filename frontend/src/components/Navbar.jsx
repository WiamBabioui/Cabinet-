import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, Mail, LogOut, User, Settings, ChevronDown, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// ─── Dropdown Notifications ───────────────────────────────────────────────────
const NotificationsDropdown = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pour l'instant on affiche des notifs vides — Dev B connectera l'API
    setLoading(false);
    setNotifications([]);
  }, []);

  return (
    <div className="absolute right-0 top-14 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
          <X size={16} />
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-slate-400 text-sm">Chargement...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell size={32} className="text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Aucune notification</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={`px-4 py-3 hover:bg-slate-50 border-b border-slate-50 ${!n.lu ? 'bg-primary/5' : ''}`}>
              <p className="text-sm font-semibold text-slate-700">{n.titre}</p>
              <p className="text-xs text-slate-400 mt-0.5">{n.corps}</p>
            </div>
          ))
        )}
      </div>
      <div className="px-4 py-3 border-t border-slate-100">
        <button className="text-xs font-semibold text-primary hover:underline w-full text-center">
          Voir toutes les notifications
        </button>
      </div>
    </div>
  );
};

// ─── Dropdown Messages ────────────────────────────────────────────────────────
const MessagesDropdown = ({ onClose }) => (
  <div className="absolute right-0 top-14 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
      <h3 className="font-bold text-slate-800 text-sm">Messages</h3>
      <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
        <X size={16} />
      </button>
    </div>
    <div className="p-8 text-center">
      <Mail size={32} className="text-slate-200 mx-auto mb-3" />
      <p className="text-sm text-slate-400">Aucun message</p>
    </div>
    <div className="px-4 py-3 border-t border-slate-100">
      <button className="text-xs font-semibold text-primary hover:underline w-full text-center">
        Ouvrir le chat
      </button>
    </div>
  </div>
);

// ─── Dropdown Profil ──────────────────────────────────────────────────────────
const ProfileDropdown = ({ user, onClose, onLogout }) => {
  const navigate = useNavigate();

  const roleLabel = {
    medecin:    'Médecin',
    secretaire: 'Secrétaire',
    admin:      'Administrateur',
    patient:    'Patient',
  };

  return (
    <div className="absolute right-0 top-14 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
      {/* En-tête profil */}
      <div className="px-4 py-4 bg-gradient-to-br from-primary/5 to-primary/10 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center font-bold text-lg">
            {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">
              {user?.prenom} {user?.nom}
            </p>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <span className="inline-block mt-1 text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {roleLabel[user?.role] || user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-2">
        <button
          onClick={() => { navigate('/profile'); onClose(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
        >
          <User size={16} className="text-slate-400" />
          Mon Profil
        </button>
        <button
          onClick={() => { navigate('/profile'); onClose(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
        >
          <Settings size={16} className="text-slate-400" />
          Paramètres
        </button>
      </div>

      <div className="p-2 border-t border-slate-100">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </div>
  );
};

// ─── Navbar Principale ────────────────────────────────────────────────────────
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showNotifs,   setShowNotifs]   = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showProfile,  setShowProfile]  = useState(false);
  const [notifCount,   setNotifCount]   = useState(0);

  const navRef = useRef(null);

  // Fermer dropdowns si clic extérieur
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

  const roleLabel = {
    medecin:    'Médecin',
    secretaire: 'Secrétaire',
    admin:      'Administrateur',
    patient:    'Patient',
  };

  const toggleNotifs = () => {
    setShowNotifs(!showNotifs);
    setShowMessages(false);
    setShowProfile(false);
  };

  const toggleMessages = () => {
    setShowMessages(!showMessages);
    setShowNotifs(false);
    setShowProfile(false);
  };

  const toggleProfile = () => {
    setShowProfile(!showProfile);
    setShowNotifs(false);
    setShowMessages(false);
  };

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-40">

      {/* Barre de recherche */}
      <div className="flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-2xl w-full max-w-md border border-slate-100 transition-all focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary/30">
        <Search size={20} className="text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher patients, fichiers..."
          className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400"
        />
      </div>

      {/* Actions droite */}
      <div className="flex items-center gap-4" ref={navRef}>

        {/* ── Messages ── */}
        <div className="relative hidden md:block">
          <button
            onClick={toggleMessages}
            className={`relative p-2.5 rounded-xl transition-all ${
              showMessages ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Mail size={22} />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white" />
          </button>
          {showMessages && (
            <MessagesDropdown onClose={() => setShowMessages(false)} />
          )}
        </div>

        {/* ── Notifications ── */}
        <div className="relative hidden md:block">
          <button
            onClick={toggleNotifs}
            className={`relative p-2.5 rounded-xl transition-all ${
              showNotifs ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Bell size={22} />
            {notifCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                {notifCount}
              </span>
            )}
            {notifCount === 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            )}
          </button>
          {showNotifs && (
            <NotificationsDropdown onClose={() => setShowNotifs(false)} />
          )}
        </div>

        <div className="h-10 w-[1px] bg-slate-200 hidden md:block" />

        {/* ── Profil utilisateur ── */}
        <div className="relative">
          <button
            onClick={toggleProfile}
            className={`flex items-center gap-3 p-2 pr-3 rounded-2xl transition-all ${
              showProfile ? 'bg-primary/5 ring-2 ring-primary/20' : 'hover:bg-slate-50'
            }`}
          >
            {/* Avatar */}
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-sm border-2 border-primary/20">
              {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
            </div>
            {/* Nom et rôle */}
            <div className="hidden sm:block text-left">
              <h4 className="text-sm font-bold text-slate-800 leading-none">
                {user?.prenom} {user?.nom}
              </h4>
              <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                {roleLabel[user?.role] || user?.role}
              </span>
            </div>
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform ${showProfile ? 'rotate-180' : ''}`}
            />
          </button>

          {showProfile && (
            <ProfileDropdown
              user={user}
              onClose={() => setShowProfile(false)}
              onLogout={handleLogout}
            />
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;