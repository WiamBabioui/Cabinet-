import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

const LanguageSwitcher = ({ variant = 'default' }) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const availableLanguages = [
    { code: 'ar', label: 'العربية', flag: '🇲🇦' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' }
  ];

  const handleLanguageChange = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = availableLanguages.find(l => l.code === i18n.language) || availableLanguages[1];

  if (variant === 'buttons') {
    return (
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        {availableLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-black text-xs uppercase tracking-widest relative overflow-hidden ${
              i18n.language === lang.code 
                ? 'text-white' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {i18n.language === lang.code && (
              <motion.div 
                layoutId="active-lang"
                className="absolute inset-0 bg-primary shadow-lg shadow-primary/30"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10 text-base">{lang.flag}</span>
            <span className="relative z-10">{lang.code}</span>
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'simple') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-2xl text-white transition-all border border-white/20 shadow-premium group"
        >
          <span className="text-xl group-hover:scale-110 transition-transform">{currentLang.flag}</span>
          <span className="text-xs font-black uppercase tracking-[0.2em]">{currentLang.code}</span>
          <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute end-0 top-full mt-4 w-56 bg-white/95 backdrop-blur-xl rounded-[1.5rem] shadow-premium border border-slate-100 z-50 overflow-hidden p-2"
            >
              {availableLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm rounded-xl transition-all group ${
                    i18n.language === lang.code 
                      ? 'bg-primary/10 text-primary font-black' 
                      : 'text-slate-600 hover:bg-slate-50 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl group-hover:scale-110 transition-transform">{lang.flag}</span>
                    <span className="tracking-tight">{lang.label}</span>
                  </div>
                  {i18n.language === lang.code && <Check size={14} strokeWidth={3} />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3 rounded-2xl transition-all duration-300 group ${
          isOpen ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' : 'text-slate-500 hover:bg-slate-50'
        }`}
      >
        <Globe size={22} strokeWidth={isOpen ? 2.5 : 2} className="group-hover:rotate-12 transition-transform" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute end-0 top-16 w-56 bg-white/95 backdrop-blur-xl rounded-[1.5rem] shadow-premium border border-slate-100 z-50 overflow-hidden p-2"
          >
            <div className="px-4 py-2 border-b border-slate-100/50 mb-1">
              <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">
                {i18n.language === 'ar' ? 'اللغة' : i18n.language === 'fr' ? 'Langue' : 'Language'}
              </h3>
            </div>
            {availableLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm rounded-xl transition-all group ${
                  i18n.language === lang.code 
                    ? 'bg-primary/10 text-primary font-black' 
                    : 'text-slate-600 hover:bg-slate-50 font-bold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl group-hover:scale-110 transition-transform">{lang.flag}</span>
                  <span className="tracking-tight">{lang.label}</span>
                </div>
                {i18n.language === lang.code && <Check size={14} strokeWidth={3} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;
