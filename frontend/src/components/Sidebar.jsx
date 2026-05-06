import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, MessageSquare,
  Stethoscope, LogOut, ChevronLeft, ChevronRight,
  ShieldCheck, UserCircle, UserCog
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/',
      roles: ['medecin', 'secretaire']
    },
    {
      name: 'Patients',
      icon: Users,
      path: '/patients',
      roles: ['medecin', 'secretaire']
    },
    {
      name: 'Rendez-vous',
      icon: Calendar,
      path: '/appointments',
      roles: ['medecin', 'secretaire', 'patient']
    },
    {
      name: 'Consultation',
      icon: Stethoscope,
      path: '/consultation',
      roles: ['medecin']
    },
    {
      name: 'Chat',
      icon: MessageSquare,
      path: '/chat',
      roles: ['medecin', 'secretaire', 'patient']
    },
    {
      name: 'Mon Profil',
      icon: UserCog,
      path: '/profile',
      roles: ['medecin', 'secretaire']
    },
    {
      name: 'Mon Espace',
      icon: UserCircle,
      path: '/patient-portal',
      roles: ['patient']
    },
  ];

  const filteredLinks = links.filter(link => link.roles.includes(user?.role));

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const roleLabel = {
    medecin:    'Médecin',
    secretaire: 'Secrétaire',
    patient:    'Patient',
  };

  return (
    <aside className={`
      fixed left-0 top-0 h-screen bg-white border-r border-slate-100
      transition-all duration-300 z-50 flex flex-col
      ${isCollapsed ? 'w-20' : 'w-72'}
    `}>
      {/* Logo */}
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
              <ShieldCheck size={24} />
            </div>
            <span className="font-bold text-xl text-slate-800 truncate">Cabinet+</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Infos utilisateur */}
      {!isCollapsed && user && (
        <div className="mx-4 mb-4 p-3 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0">
              {user.prenom?.charAt(0)}{user.nom?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-700 truncate">
                {user.prenom} {user.nom}
              </p>
              <p className="text-xs text-slate-400">
                {roleLabel[user.role] || user.role}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {filteredLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            end={link.path === '/'}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
              transition-all duration-200
              ${isActive
                ? 'bg-primary text-white shadow-md shadow-primary/25'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }
              ${isCollapsed ? 'justify-center px-0' : ''}
            `}
            title={isCollapsed ? link.name : ''}
          >
            <link.icon size={20} className="min-w-[20px]" />
            {!isCollapsed && <span>{link.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bouton Logout */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className={`
            w-full flex items-center gap-3 p-3
            text-red-500 hover:bg-red-50 rounded-xl transition-all
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="font-semibold text-sm">Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;