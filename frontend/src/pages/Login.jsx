import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const { login } = useAuth();
  const navigate  = useNavigate();
  const { t } = useTranslation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(email, password);
      if (user.role === 'medecin') navigate('/');
      else if (user.role === 'secretaire') navigate('/assistant-dashboard');
      else if (user.role === 'patient') navigate('/patient-portal');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || t('auth.login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    dir={t('dir') || 'ltr'}
    >
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <motion.div
            animate={{ rotate: [0, 15, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
          >
            <Sparkles size={16} className="text-purple" />
          </motion.div>
          <span className="text-xs font-black text-purple uppercase tracking-[0.2em]">PORTAIL SECURISE &bull; SECURE PORTAL</span>
        </div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-3 leading-tight">
          {t('auth.login.title')}
        </h2>
        <p className="text-slate-500 text-base font-medium leading-relaxed">
          {t('auth.login.subtitle')}
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="flex items-center gap-3 p-4 mb-8 bg-coral/5 border border-coral/20 rounded-2xl text-coral text-sm font-semibold"
        >
          <div className="w-8 h-8 bg-coral/10 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle size={18} />
          </div>
          {error}
        </motion.div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <Input
          id="login-email"
          label={t('auth.login.email_label')}
          icon={Mail}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        
        <div className="relative group">
          <Input
            id="login-password"
            label={t('auth.login.password_label')}
            icon={Lock}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-[22px] text-slate-400 hover:text-purple transition-colors p-1 z-10"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </motion.button>
        </div>

        {/* Remember me & Forgot */}
        <div className="flex items-center justify-between px-1 pt-1">
          <label htmlFor="remember-me" className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input id="remember-me" type="checkbox" className="peer sr-only" />
              <div className="w-5 h-5 border-2 border-slate-200 rounded-lg peer-checked:bg-purple peer-checked:border-purple transition-all duration-300 group-hover:border-purple/50" />
              <div className="absolute opacity-0 peer-checked:opacity-100 transition-opacity text-white">
                <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>
              </div>
            </div>
            <span className="text-sm font-bold text-slate-500 group-hover:text-slate-700 transition-colors">
              {t('auth.login.remember_me')}
            </span>
          </label>
          <a href="#" className="text-sm font-bold text-purple hover:text-purple/70 transition-colors tracking-tight">
            {t('auth.login.forgot_password')}
          </a>
        </div>

        <div className="pt-2">
          <Button 
            type="submit" 
            className="w-full h-14 uppercase tracking-widest font-black text-xs" 
            size="lg"
            isLoading={loading} 
            icon={ArrowRight}
          >
            {t('auth.login.submit')}
          </Button>
        </div>
      </form>

      <div className="mt-10 text-center">
        <p className="text-base text-slate-500 font-medium">
          {t('auth.login.no_account')}{' '}
          <Link to="/auth/signup" className="font-black text-purple hover:text-purple/70 transition-colors">
            {t('auth.login.signup_link')}
          </Link>
        </p>
      </div>
    </motion.div>
  );
};

export default Login;