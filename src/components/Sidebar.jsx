import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  MessageSquare, 
  Stethoscope, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  UserCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { user, logout } = useAuth();

  const links = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['Doctor', 'Assistant'] },
    { name: 'Patients', icon: Users, path: '/patients', roles: ['Doctor', 'Assistant'] },
    { name: 'Appointments', icon: Calendar, path: '/appointments', roles: ['Doctor', 'Assistant', 'Patient'] },
    { name: 'Consultation', icon: Stethoscope, path: '/consultation', roles: ['Doctor'] },
    { name: 'Chat', icon: MessageSquare, path: '/chat', roles: ['Doctor', 'Assistant', 'Patient'] },
    { name: 'My Profile', icon: UserCircle, path: '/patient-portal', roles: ['Patient'] },
  ];

  const filteredLinks = links.filter(link => link.roles.includes(user?.role || 'Doctor'));

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-100 transition-all duration-300 z-50 flex flex-col ${isCollapsed ? 'w-20' : 'w-72'}`}>
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
              <ShieldCheck size={24} />
            </div>
            <span className="font-bold text-xl text-slate-800 truncate">SmartMed</span>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-slate-50 rounded-lg text-slate-400"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
        {filteredLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) => `
              nav-link ${isActive ? 'active' : ''}
              ${isCollapsed ? 'justify-center px-0' : ''}
            `}
            title={isCollapsed ? link.name : ''}
          >
            <link.icon size={22} className="min-w-[22px]" />
            {!isCollapsed && <span className="font-medium">{link.name}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 mb-4">
        <button 
          onClick={logout}
          className={`w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all ${isCollapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={22} />
          {!isCollapsed && <span className="font-semibold">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
