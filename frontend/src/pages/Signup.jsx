import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Briefcase, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import api from '../services/api';

const Signup = () => {
  const [role, setRole]           = useState('secretaire');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [specialites, setSpecialites] = useState([]);

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
      setError(err.response?.data?.message || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { name: 'medecin',     label: 'Médecin',    icon: ShieldCheck },
    { name: 'secretaire',  label: 'Secrétaire', icon: Briefcase },
    { name: 'patient',    label: 'Patient',    icon: User },
  ];

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-800">Créer un compte</h2>
        <p className="text-slate-500 mt-2">Rejoignez Cabinet+ pour gérer votre établissement.</p>
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
          <Input label="Prénom" name="prenom" placeholder="Mohammed" icon={User}
            value={form.prenom} onChange={handleChange} required />
          <Input label="Nom" name="nom" placeholder="Alami" icon={User}
            value={form.nom} onChange={handleChange} required />
        </div>

        <Input label="Email" name="email" type="email" placeholder="exemple@cabinet.ma" icon={Mail}
          value={form.email} onChange={handleChange} required />

        <Input label="Mot de passe" name="mot_de_passe" type="password" placeholder="••••••••" icon={Lock}
          value={form.mot_de_passe} onChange={handleChange} required />

        <Input label="Téléphone" name="telephone" placeholder="+212 6XX XXX XXX" icon={User}
          value={form.telephone} onChange={handleChange} />

        {/* Champs spécifiques au médecin */}
        {role === 'medecin' && (
          <>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Spécialité</label>
              <select
                name="specialite_id"
                value={form.specialite_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Sélectionner une spécialité</option>
                {specialites.map(s => (
                  <option key={s.id} value={s.id}>{s.libelle}</option>
                ))}
              </select>
            </div>
            <Input label="Numéro d'ordre" name="num_ordre" placeholder="Ex: MA-2024-12345" icon={ShieldCheck}
              value={form.num_ordre} onChange={handleChange} required />
          </>
        )}

        <Button type="submit" className="w-full" isLoading={loading} icon={ArrowRight}>
          Créer le compte
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-slate-500">
          Déjà un compte ?{' '}
          <Link to="/auth/login" className="font-bold text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;