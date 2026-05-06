import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const { login } = useAuth();
  const navigate  = useNavigate();

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
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Bienvenue</h2>
        <p className="text-slate-500 mt-2">Connectez-vous à votre espace Cabinet+</p>
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
          label="Adresse Email"
          placeholder="exemple@cabinet.ma"
          icon={Mail}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Mot de passe"
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
            <span className="text-sm text-slate-600">Se souvenir de moi</span>
          </label>
          <a href="#" className="text-sm font-semibold text-primary hover:underline">
            Mot de passe oublié ?
          </a>
        </div>

        <Button type="submit" className="w-full" isLoading={loading} icon={ArrowRight}>
          Se connecter
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-slate-500">
          Pas encore de compte ?{' '}
          <Link to="/auth/signup" className="font-bold text-primary hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;