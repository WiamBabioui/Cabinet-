import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import Logo from '../components/common/Logo';
import { ShieldCheck, Sparkles, HeartPulse, Zap, Activity } from 'lucide-react';

// Floating animated organic blob
const Blob = ({ className, delay = 0 }) => (
  <motion.div
    animate={{ 
      y: [0, -25, 0], 
      scale: [1, 1.08, 1],
      borderRadius: [
        "42% 58% 70% 30% / 45% 45% 55% 55%",
        "70% 30% 52% 48% / 60% 40% 60% 40%",
        "42% 58% 70% 30% / 45% 45% 55% 55%"
      ]
    }}
    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay }}
    className={className}
  />
);

const AuthLayout = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const features = [
    { icon: Activity, label: t('auth.layout.feat_ehr'), color: 'text-coral' },
    { icon: Zap, label: t('auth.layout.feat_sync'), color: 'text-mint' },
    { icon: HeartPulse, label: t('auth.layout.feat_continuity'), color: 'text-purple' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 lg:p-10 relative font-sans bg-[#091514] w-full overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Organic blob background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <Blob delay={0} className="absolute top-[-10%] left-[-5%] w-[55%] h-[55%] bg-purple/10 blur-[90px]" />
        <Blob delay={2.5} className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-emerald/10 blur-[90px]" />
        <Blob delay={5} className="absolute top-[35%] left-[35%] w-[25%] h-[25%] bg-coral/5 blur-[70px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-6xl relative z-10 flex flex-col lg:flex-row rounded-[2.5rem_1.5rem_3rem_2rem] overflow-hidden min-h-[700px] shadow-[0_20px_50px_rgba(14,108,104,0.12)] border border-white/5 bg-[#132E2C]/30"
      >
        {/* Left Side: Branding (Asymmetric Width 58%) */}
        <div className={`hidden lg:flex flex-col justify-between gap-10 lg:w-[58%] flex-shrink-0 relative overflow-hidden p-16 bg-gradient-to-br from-indigo via-[#183936] to-indigo ${isRtl ? 'order-2' : 'order-1'}`}>
          {/* Decorative inner organic blob */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple/10 rounded-[50%_50%_30%_70%/_50%_60%_40%_50%] translate-x-1/3 -translate-y-1/3 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald/10 rounded-[30%_70%_70%_30%/_50%_40%_60%_50%] -translate-x-1/3 translate-y-1/3 blur-3xl pointer-events-none" />
          
          {/* Hand-drawn look grid pattern overlay */}
          <div 
            className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)', backgroundSize: '50px 50px' }}
          />

          {/* Top: Logo */}
          <div className="relative z-10">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="mb-12 w-fit"
            >
              <Logo size="lg" className="text-white" />
            </motion.div>
            
            <h1 className="text-5xl font-black text-white mb-5 leading-tight tracking-tight">
              {t('auth.layout.title')}
            </h1>
            <p className="text-white/60 text-lg max-w-md font-medium leading-relaxed">
              {t('auth.layout.subtitle')}
            </p>

            {/* Custom tags/labels (not pill shape) */}
            <div className="flex flex-wrap gap-3 mt-10">
              {features.map(({ icon: Icon, label, color }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-2.5 px-5 py-2.5 bg-white/5 backdrop-blur-sm rounded-[0.75rem_0.25rem_0.75rem_0.25rem] border border-white/10 text-white/80 text-xs font-bold uppercase tracking-wider"
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
            className="relative z-10 p-8 bg-white/[0.03] backdrop-blur-lg rounded-[2rem_1rem_2rem_1rem] border border-white/10"
          >
            <p className="text-white/80 font-medium italic text-base leading-relaxed mb-6 font-serif">
              &ldquo;{t('auth.layout.quote')}&rdquo;
            </p>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-white/10 border border-white/20 rounded-[12px_6px_12px_8px] flex items-center justify-center text-white font-black text-sm shadow-soft flex-shrink-0">
                YA
              </div>
              <div>
                <h4 className="text-white font-black text-sm leading-none mb-1">{t('auth.layout.quote_author')}</h4>
                <span className="text-white/40 text-[10px] uppercase font-bold tracking-widest">{t('auth.layout.quote_role')}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Auth Form (Asymmetric Width 42%) */}
        <div className={`w-full lg:w-[42%] p-8 lg:p-16 flex flex-col bg-white/95 backdrop-blur-xl relative ${isRtl ? 'order-1' : 'order-2'}`}>
          
          {/* Language Switcher */}
          <div className="flex justify-end mb-6 z-50">
            <LanguageSwitcher variant="buttons" />
          </div>
          
          <div className="w-full max-w-md mx-auto my-auto flex flex-col justify-center">
            {/* Mobile logo */}
            <div className="flex items-center gap-2.5 mb-10 lg:hidden">
              <Logo size="sm" className="text-slate-800" />
            </div>
            <Outlet />
          </div>
        </div>
      </motion.div>

      {/* Aligned responsive footer (in flow, not fixed) */}
      <footer className="mt-8 text-center text-slate-500 text-[10px] font-black tracking-widest uppercase relative z-10 max-w-md mx-auto w-full leading-relaxed px-4">
        &copy; 2026 Cabinet+ &bull; Technologie Médicale Marocaine &bull; {t('common.all_rights_reserved') || 'Tous droits réservés'}
      </footer>
    </div>
  );
};

export default AuthLayout;
