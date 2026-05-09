import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

import { useTranslation } from 'react-i18next';

const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
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

      // Redirection selon le rôle
      if (user.role === 'medecin') navigate('/');
      else if (user.role === 'secretaire') navigate('/assistant-dashboard');
      else navigate('/');

    } catch (err) {
      setError(err.response?.data?.message || t('auth.login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">{t('auth.login.title')}</h2>
        <p className="text-slate-500 mt-2">{t('auth.login.subtitle')}</p>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle size={18} className="flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <Input
          label={t('auth.login.email_label')}
          placeholder={t('auth.login.email_placeholder')}
          icon={Mail}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label={t('auth.login.password_label')}
          placeholder="••••••••"
          icon={Lock}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded border-slate-300" />
            <span className="text-sm text-slate-600">{t('auth.login.remember_me')}</span>
          </label>
          <a href="#" className="text-sm font-semibold text-primary hover:underline">
            {t('auth.login.forgot_password')}
          </a>
        </div>

        <Button type="submit" className="w-full" isLoading={loading} icon={ArrowRight}>
          {t('auth.login.submit')}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-slate-500">
          {t('auth.login.no_account')}{' '}
          <Link to="/auth/signup" className="font-bold text-primary hover:underline">
            {t('auth.login.signup_link')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;