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
      await signup({ ...form, role });
      navigate('/');
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
        <h2 className="text-3xl font-bold text-slate-800">{t('auth.signup.title')}</h2>
        <p className="text-slate-500 mt-2">{t('auth.signup.subtitle')}</p>
      </div>

      {/* Sélection du rôle */}
      <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-2xl">
        {roles.map((r) => (
          <button
            key={r.name}
            onClick={() => setRole(r.name)}
            type="button"
            className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl text-xs font-bold transition-all gap-1 ${
              role === r.name
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <r.icon size={16} />
            {r.label}
          </button>
        ))}
      </div>

      {/* Erreur */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle size={18} className="flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('auth.signup.firstname')} name="prenom" placeholder="Mohammed" icon={User}
            value={form.prenom} onChange={handleChange} required />
          <Input label={t('auth.signup.lastname')} name="nom" placeholder="Alami" icon={User}
            value={form.nom} onChange={handleChange} required />
        </div>

        <Input label={t('auth.login.email_label')} name="email" type="email" placeholder={t('auth.login.email_placeholder')} icon={Mail}
          value={form.email} onChange={handleChange} required />

        <Input label={t('auth.login.password_label')} name="mot_de_passe" type="password" placeholder="••••••••" icon={Lock}
          value={form.mot_de_passe} onChange={handleChange} required />

        <Input label={t('users.modal.phone')} name="telephone" placeholder="+212 6XX XXX XXX" icon={User}
          value={form.telephone} onChange={handleChange} />

        {/* Champs spécifiques au médecin */}
        {role === 'medecin' && (
          <>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">{t('users.modal.specialty')}</label>
              <select
                name="specialite_id"
                value={form.specialite_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">{t('users.modal.specialty_select')}</option>
                {specialites.map(s => (
                  <option key={s.id} value={s.id}>{s.libelle}</option>
                ))}
              </select>
            </div>
            <Input label={t('users.modal.order_num')} name="num_ordre" placeholder="Ex: MA-2024-12345" icon={ShieldCheck}
              value={form.num_ordre} onChange={handleChange} required />
          </>
        )}

        <Button type="submit" className="w-full" isLoading={loading} icon={ArrowRight}>
          {t('auth.signup.submit')}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-slate-500">
          {t('auth.signup.has_account')}{' '}
          <Link to="/auth/login" className="font-bold text-primary hover:underline">
            {t('auth.signup.login_link')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;