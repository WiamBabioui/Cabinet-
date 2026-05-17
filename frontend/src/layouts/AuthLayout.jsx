import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { ShieldCheck, Sparkles, HeartPulse, Zap, Activity } from 'lucide-react';

// Floating animated orb
const Orb = ({ className, delay = 0 }) => (
  <motion.div
    animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay }}
    className={className}
  />
);

const AuthLayout = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const features = [
    { icon: ShieldCheck, label: t('auth.layout.secure_access') || 'Acces Securise', color: 'text-emerald' },
    { icon: Sparkles, label: t('auth.layout.modern_ui') || 'Interface Moderne', color: 'text-gold' },
    { icon: Activity, label: 'Multi-specialites', color: 'text-coral' },
    { icon: Zap, label: 'Temps Reel', color: 'text-mint' },
  ];

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 lg:p-8 relative overflow-hidden font-sans bg-[#0f1123]`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Mesh gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Orb delay={0} className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple/20 rounded-full blur-[100px]" />
        <Orb delay={2} className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald/15 rounded-full blur-[100px]" />
        <Orb delay={4} className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-coral/10 rounded-full blur-[80px]" />
      </div>

      {/* Language Switcher */}
      <div className="absolute top-6 right-6 lg:top-8 lg:right-8 z-50">
        <LanguageSwitcher variant="buttons" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-6xl relative z-10 flex rounded-[2.5rem] overflow-hidden min-h-[700px] shadow-[0_0_80px_rgba(124,92,255,0.2)]"
      >
        {/* Left Side: Branding */}
        <div className={`hidden lg:flex flex-col justify-between flex-1 relative overflow-hidden p-16 bg-gradient-to-br from-indigo via-[#1a1f4a] to-[#0f1123] ${isRtl ? 'order-2' : 'order-1'}`}>
          {/* Decorative inner orbs */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple/20 rounded-full translate-x-1/2 -translate-y-1/3 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald/15 rounded-full -translate-x-1/3 translate-y-1/3 blur-3xl pointer-events-none" />
          
          {/* Grid pattern overlay */}
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
          />

          {/* Top: Logo */}
          <div className="relative z-10">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 mb-12 w-fit"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple to-emerald rounded-2xl flex items-center justify-center shadow-glow">
                <HeartPulse className="text-white" size={26} strokeWidth={2.5} />
              </div>
              <span className="text-3xl font-black text-white tracking-tighter">
                Cabinet<span className="text-emerald">+</span>
              </span>
            </motion.div>
            
            <h1 className="text-5xl font-black text-white mb-5 leading-tight tracking-tight">
              {t('auth.layout.title')}
            </h1>
            <p className="text-white/60 text-lg max-w-md font-medium leading-relaxed">
              {t('auth.layout.subtitle')}
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3 mt-10">
              {features.map(({ icon: Icon, label, color }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 text-white/80 text-sm font-semibold"
                >
                  <Icon size={15} className={color} />
                  {label}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom: Testimonial */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="relative z-10 p-7 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10"
          >
            <p className="text-white/80 font-medium italic text-base leading-relaxed mb-5">
              &ldquo;{t('auth.layout.quote')}&rdquo;
            </p>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-gradient-to-tr from-coral to-gold rounded-2xl flex items-center justify-center text-white font-bold shadow-glow flex-shrink-0">
                DR
              </div>
              <div>
                <h4 className="text-white font-black text-sm">{t('auth.layout.quote_author')}</h4>
                <span className="text-white/40 text-[11px] uppercase font-bold tracking-widest">{t('auth.layout.quote_role')}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Auth Form */}
        <div className={`flex-1 p-8 lg:p-16 flex flex-col justify-center bg-white/95 backdrop-blur-xl ${isRtl ? 'order-1' : 'order-2'}`}>
          <div className="w-full max-w-md mx-auto">
            {/* Mobile logo */}
            <div className="flex items-center gap-2.5 mb-10 lg:hidden">
              <div className="w-9 h-9 bg-gradient-to-br from-purple to-emerald rounded-xl flex items-center justify-center">
                <HeartPulse className="text-white" size={18} strokeWidth={2.5} />
              </div>
              <span className="text-xl font-black text-slate-800">Cabinet<span className="text-purple">+</span></span>
            </div>
            <Outlet />
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-slate-600 text-xs font-medium tracking-wider uppercase z-20">
        &copy; 2024 Cabinet+ &bull; {t('common.all_rights_reserved') || 'Tous droits reserves'}
      </div>
    </div>
  );
};

export default AuthLayout;
