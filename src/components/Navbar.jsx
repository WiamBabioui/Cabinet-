import React from 'react';
import { Bell, Search, User, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user } = useAuth();

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-2xl w-full max-w-md border border-slate-100 transition-all focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary/30">
        <Search size={20} className="text-slate-400" />
        <input 
          type="text" 
          placeholder="Search patients, files, or records..."
          className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400"
        />
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex gap-4">
          <button className="relative p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-all">
            <Mail size={22} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-secondary rounded-full border-2 border-white"></span>
          </button>
          <button className="relative p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-all">
            <Bell size={22} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>

        <div className="h-10 w-[1px] bg-slate-200 mx-2 hidden md:block"></div>

        <div className="flex items-center gap-4 group cursor-pointer p-1 pr-3 hover:bg-slate-50 rounded-2xl transition-all">
          <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary border-2 border-transparent group-hover:border-primary/20 transition-all">
            <User size={24} />
          </div>
          <div className="hidden sm:block text-left">
            <h4 className="text-sm font-bold text-slate-800 leading-none">{user?.name || 'Dr. House'}</h4>
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">{user?.role || 'Senior Doctor'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
