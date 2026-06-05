import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Briefcase, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

const Signup = () => {
  const [role, setRole]           = useState('secretaire');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [specialites, setSpecialites] = useState([]);
  const { t } = useTranslation();

  const [form, setForm] = useState({
    prenom: '', nom: '', email: '', mot_de_passe: '',
    telephone: '', specialite_id: '', num_ordre: '',
  });

  const { signup } = useAuth();
  const navigate   = useNavigate();

  // Charger les spécialités si rôle médecin
  useEffect(() => {
    if (role === 'medecin') {
      api.get('/users/specialites')
        .then(res => setSpecialites(res.data.specialites))
        .catch(() => {});
    }
  }, [role]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await signup({ ...form, role });
      if (user.role === 'patient') navigate('/patient-portal');
      else if (user.role === 'secretaire') navigate('/assistant-dashboard');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || t('users.modal.error'));
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { name: 'medecin',     label: t('roles.medecin'),    icon: ShieldCheck },
    { name: 'secretaire',  label: t('roles.secretaire'), icon: Briefcase },
    { name: 'patient',    label: t('roles.patient'),    icon: User },
  ];

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-3">
          {t('auth.signup.title')}
        </h2>
        <p className="text-slate-500 text-base font-medium leading-relaxed">
          {t('auth.signup.subtitle')}
        </p>
      </div>

      {/* Sélection du rôle */}
      <div className="flex gap-2 mb-6 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/50">
        {roles.map((r) => (
          <button
            key={r.name}
            onClick={() => setRole(r.name)}
            type="button"
            className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all gap-1.5 ${
              role === r.name
                ? 'bg-white text-purple shadow-sm border border-slate-100'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/30'
            }`}
          >
            <r.icon size={15} />
            {r.label}
          </button>
        ))}
      </div>

      {/* Erreur */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-5 bg-coral/5 border border-coral/20 rounded-2xl text-coral text-sm font-semibold">
          <AlertCircle size={18} className="flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Input label={t('auth.signup.firstname')} name="prenom" icon={User}
            value={form.prenom} onChange={handleChange} required />
          <Input label={t('auth.signup.lastname')} name="nom" icon={User}
            value={form.nom} onChange={handleChange} required />
        </div>

        <Input label={t('auth.login.email_label')} name="email" type="email" icon={Mail}
          value={form.email} onChange={handleChange} required />

        <Input label={t('auth.login.password_label')} name="mot_de_passe" type="password" icon={Lock}
          value={form.mot_de_passe} onChange={handleChange} required />

        <Input label={t('users.modal.phone')} name="telephone" icon={User}
          value={form.telephone} onChange={handleChange} />

        {/* Champs spécifiques au médecin */}
        {role === 'medecin' && (
          <div className="space-y-5">
            <div className="relative group">
              <select
                name="specialite_id"
                value={form.specialite_id}
                onChange={handleChange}
                required
                className="w-full bg-white/50 border border-slate-200/50 rounded-2xl px-5 pt-8 pb-3 outline-none transition-all duration-300 font-medium text-slate-700 focus:bg-white focus:border-purple focus:ring-4 focus:ring-purple/20 appearance-none"
              >
                <option value="">{t('users.modal.specialty_select')}</option>
                {specialites.map(s => (
                  <option key={s.id} value={s.id}>{s.libelle}</option>
                ))}
              </select>
              <label className="absolute start-5 top-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest pointer-events-none">
                {t('users.modal.specialty')}
              </label>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
              </div>
            </div>
            <Input label={t('users.modal.order_num')} name="num_ordre" icon={ShieldCheck}
              value={form.num_ordre} onChange={handleChange} required />
          </div>
        )}

        <div className="pt-2">
          <Button type="submit" className="w-full h-14 uppercase tracking-widest font-black text-xs" isLoading={loading} icon={ArrowRight}>
            {t('auth.signup.submit')}
          </Button>
        </div>
      </form>

      <div className="mt-8 text-center">
        <p className="text-base text-slate-500 font-medium">
          {t('auth.signup.has_account')}{' '}
          <Link to="/auth/login" className="font-black text-purple hover:text-purple/70 transition-colors">
            {t('auth.signup.login_link')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;