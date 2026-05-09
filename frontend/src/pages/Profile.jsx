import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, Save, Clock, DollarSign, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import api from '../services/api';

import { useTranslation } from 'react-i18next';

const Profile = () => {
  const { user, login } = useAuth();
  const { t, i18n } = useTranslation();
  const [activeTab, setTab] = useState('profil');
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');

  const JOURS = t('profile.days', { returnObjects: true });

  const [form, setForm] = useState({
    prenom: '', nom: '', telephone: '',
    biographie: '', consultation_duree: 30,
    consultation_tarif: 0, disponible: true, titre: 'Dr',
  });

  const [mdpForm, setMdpForm] = useState({
    ancien_mdp: '', nouveau_mdp: '', confirm_mdp: ''
  });

  const [horaires, setHoraires] = useState(
    Array.from({ length: 7 }, (_, i) => ({
      jour_semaine: i, actif: i < 5,
      heure_debut: '09:00', heure_fin: '17:00'
    }))
  );

  // Charger le profil
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (user?.role === 'medecin') {
          const [profilRes, horairesRes] = await Promise.all([
            api.get('/medecins/profil'),
            api.get('/medecins/horaires'),
          ]);
          const m = profilRes.data.medecin;
          setForm({
            prenom: m.prenom || '', nom: m.nom || '',
            telephone: m.telephone || '', biographie: m.biographie || '',
            consultation_duree: m.consultation_duree || 30,
            consultation_tarif: m.consultation_tarif || 0,
            disponible: !!m.disponible, titre: m.titre || 'Dr',
          });
          if (horairesRes.data.horaires.length > 0) {
            const loaded = Array.from({ length: 7 }, (_, i) => {
              const h = horairesRes.data.horaires.find(x => x.jour_semaine === i);
              return h
                ? { jour_semaine: i, actif: true, heure_debut: h.heure_debut, heure_fin: h.heure_fin }
                : { jour_semaine: i, actif: false, heure_debut: '09:00', heure_fin: '17:00' };
            });
            setHoraires(loaded);
          }
        } else {
          const res = await api.get(`/users/${user.id}`);
          const u = res.data.user;
          setForm(f => ({ ...f, prenom: u.prenom || '', nom: u.nom || '', telephone: u.telephone || '' }));
        }
      } catch { }
      finally { setLoading(false); }
    };
    if (user) load();
  }, [user]);

  const handleSaveProfil = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      if (user.role === 'medecin') {
        await api.put('/medecins/profil', form);
      } else {
        await api.put(`/users/${user.id}`, form);
      }
      setSuccess(t('profile.profile_saved'));
    } catch (err) {
      setError(err.response?.data?.message || t('profile.save_error'));
    } finally { setSaving(false); }
  };

  const handleSaveMdp = async () => {
    if (mdpForm.nouveau_mdp !== mdpForm.confirm_mdp) {
      setError(t('profile.password_mismatch'));
      return;
    }
    setSaving(true); setError(''); setSuccess('');
    try {
      await api.put('/auth/change-password', {
        ancien_mdp: mdpForm.ancien_mdp,
        nouveau_mdp: mdpForm.nouveau_mdp,
      });
      setSuccess(t('profile.password_changed'));
      setMdpForm({ ancien_mdp: '', nouveau_mdp: '', confirm_mdp: '' });
    } catch (err) {
      setError(err.response?.data?.message || t('common.error_loading'));
    } finally { setSaving(false); }
  };

  const handleSaveHoraires = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      await api.post('/medecins/horaires', { horaires });
      setSuccess(t('profile.schedule_saved'));
    } catch { setError(t('profile.save_error')); }
    finally { setSaving(false); }
  };

  const toggleJour = (i) => {
    setHoraires(h => h.map((j, idx) => idx === i ? { ...j, actif: !j.actif } : j));
  };

  const updateHoraire = (i, field, value) => {
    setHoraires(h => h.map((j, idx) => idx === i ? { ...j, [field]: value } : j));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="animate-spin text-primary" size={48} />
    </div>
  );

  const tabs = [
    { key: 'profil',   label: t('profile.tabs.profile') },
    { key: 'securite', label: t('profile.tabs.security') },
    ...(user?.role === 'medecin' ? [{ key: 'horaires', label: t('profile.tabs.schedule') }] : []),
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">{t('profile.title')}</h1>
        <p className="text-slate-500 mt-1">{t('profile.subtitle')}</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-2xl font-bold">
          {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">{user?.prenom} {user?.nom}</h2>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <span className="inline-block mt-1 text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">
            {t(`roles.${user?.role}`)}
          </span>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setSuccess(''); setError(''); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === t.key ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      {success && <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">{success}</div>}
      {error   && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}

      {/* ─── Onglet Profil ── */}
      {activeTab === 'profil' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('profile.form.firstname')} icon={User} value={form.prenom}
              onChange={e => setForm({...form, prenom: e.target.value})} />
            <Input label={t('profile.form.lastname')} icon={User} value={form.nom}
              onChange={e => setForm({...form, nom: e.target.value})} />
          </div>
          <Input label={t('profile.form.phone')} icon={Phone} value={form.telephone}
            onChange={e => setForm({...form, telephone: e.target.value})} />

          {user?.role === 'medecin' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{t('profile.form.title')}</label>
                <select value={form.titre} onChange={e => setForm({...form, titre: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="Dr">{t('profile.title_dr') || 'Dr.'}</option>
                  <option value="Pr">{t('profile.title_pr') || 'Pr.'}</option>
                  <option value="Dr Pr">Dr Pr</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{t('profile.form.bio')}</label>
                <textarea value={form.biographie}
                  onChange={e => setForm({...form, biographie: e.target.value})}
                  rows={4} placeholder={t('profile.form.bio_placeholder')}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t('profile.form.duration')}</label>
                  <input type="number" value={form.consultation_duree} min={15} max={120} step={5}
                    onChange={e => setForm({...form, consultation_duree: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t('profile.form.price')}</label>
                  <input type="number" value={form.consultation_tarif} min={0}
                    onChange={e => setForm({...form, consultation_tarif: parseFloat(e.target.value)})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="disponible" checked={form.disponible}
                  onChange={e => setForm({...form, disponible: e.target.checked})}
                  className="w-4 h-4 rounded" />
                <label htmlFor="disponible" className="text-sm font-semibold text-slate-700">
                  {t('profile.form.available')}
                </label>
              </div>
            </>
          )}

          <Button onClick={handleSaveProfil} isLoading={saving} icon={Save} className="w-full">
            {t('profile.form.save_profile')}
          </Button>
        </div>
      )}

      {/* ─── Onglet Sécurité ── */}
      {activeTab === 'securite' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5">
          <Input label={t('profile.security.old_password')} icon={Lock} type="password"
            value={mdpForm.ancien_mdp}
            onChange={e => setMdpForm({...mdpForm, ancien_mdp: e.target.value})} />
          <Input label={t('profile.security.new_password')} icon={Lock} type="password"
            value={mdpForm.nouveau_mdp}
            onChange={e => setMdpForm({...mdpForm, nouveau_mdp: e.target.value})} />
          <Input label={t('profile.security.confirm_password')} icon={Lock} type="password"
            value={mdpForm.confirm_mdp}
            onChange={e => setMdpForm({...mdpForm, confirm_mdp: e.target.value})} />
          <Button onClick={handleSaveMdp} isLoading={saving} icon={Save} className="w-full">
            {t('profile.security.change_password')}
          </Button>
        </div>
      )}

      {/* ─── Onglet Horaires ── */}
      {activeTab === 'horaires' && user?.role === 'medecin' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
          {horaires.map((h, i) => (
            <div key={i} className={`p-4 rounded-xl border transition-all ${
              h.actif ? 'border-primary/20 bg-primary/5' : 'border-slate-100 bg-slate-50'
            }`}>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={h.actif} onChange={() => toggleJour(i)}
                    className="w-4 h-4 rounded" />
                  <span className={`text-sm font-bold ${h.actif ? 'text-slate-800' : 'text-slate-400'}`}>
                    {JOURS[i]}
                  </span>
                </label>
                {h.actif && (
                  <div className="flex items-center gap-3">
                    <input type="time" value={h.heure_debut}
                      onChange={e => updateHoraire(i, 'heure_debut', e.target.value)}
                      className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    <span className="text-slate-400 text-sm">→</span>
                    <input type="time" value={h.heure_fin}
                      onChange={e => updateHoraire(i, 'heure_fin', e.target.value)}
                      className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                )}
              </div>
            </div>
          ))}
          <Button onClick={handleSaveHoraires} isLoading={saving} icon={Save} className="w-full">
            {t('profile.schedule.save_schedule')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Profile;