import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
      <div className="flex gap-2">
        {availableLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all border shadow-sm ${
              i18n.language === lang.code 
                ? 'bg-primary text-white border-primary' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title={lang.label}
          >
            <span className="text-lg">{lang.flag}</span>
            <span className="text-xs font-bold uppercase tracking-wider">{lang.code}</span>
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
          className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-white transition-all border border-white/20"
        >
          <span className="text-lg">{currentLang.flag}</span>
          <span className="text-sm font-bold uppercase tracking-wider">{currentLang.code}</span>
          <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute end-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden p-2">
            {availableLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all ${
                  i18n.language === lang.code 
                    ? 'bg-primary/10 text-primary font-bold' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                {lang.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2.5 rounded-xl transition-all ${
          isOpen ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50'
        }`}
      >
        <Globe size={22} />
      </button>

      {isOpen && (
        <div className="absolute end-0 top-14 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden p-2">
          <div className="px-3 py-2 border-b border-slate-50 mb-1">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              {i18n.language === 'ar' ? 'اللغة' : i18n.language === 'fr' ? 'Langue' : 'Language'}
            </h3>
          </div>
          {availableLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all ${
                i18n.language === lang.code 
                  ? 'bg-primary/10 text-primary font-bold' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
