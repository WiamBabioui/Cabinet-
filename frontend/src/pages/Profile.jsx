import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, Lock, Save, Clock, 
  DollarSign, Loader2, Sparkles, Activity, 
  ShieldCheck, Calendar, Briefcase, ChevronRight,
  Zap, ArrowRight, Camera, Bell, AlertCircle, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/dashboard/Card';
import Badge from '../components/common/Badge';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { twMerge } from 'tailwind-merge';

const Profile = () => {
  const { user, updateUser } = useAuth();
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
    const role = user?.role?.toLowerCase().trim();
    const load = async () => {
      setLoading(true);
      try {
        if (role === 'medecin') {
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
          setForm(f => ({ 
            ...f, 
            prenom: u?.prenom || '', 
            nom: u?.nom || '', 
            telephone: u?.telephone || '' 
          }));
        }
      } catch (err) {
        console.error('Profile load error:', err);
      } finally { setLoading(false); }
    };
    if (user) load();
  }, [user]);

  const handleSaveProfil = async () => {
    setSaving(true); setError(''); setSuccess('');
    const role = user?.role?.toLowerCase().trim();
    try {
      if (role === 'medecin') {
        await api.put('/medecins/profil', form);
      } else {
        await api.put(`/users/${user.id}`, form);
      }
      updateUser?.({ prenom: form.prenom, nom: form.nom, telephone: form.telephone });
      setSuccess(t('profile.profile_saved'));
      setTimeout(() => setSuccess(''), 3000);
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
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || t('common.error_loading'));
    } finally { setSaving(false); }
  };

  const handleSaveHoraires = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      await api.post('/medecins/horaires', { horaires });
      setSuccess(t('profile.schedule_saved'));
      setTimeout(() => setSuccess(''), 3000);
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
    <div className="h-[calc(100vh-160px)] flex flex-col items-center justify-center gap-6">
      <div className="w-20 h-20 border-4 border-purple/10 border-t-purple rounded-full animate-spin" />
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Chargement de votre compte...</p>
    </div>
  );

  const tabs = [
    { key: 'profil',   label: t('profile.tabs.profile'), icon: User },
    { key: 'securite', label: t('profile.tabs.security'), icon: ShieldCheck },
    ...(user?.role?.toLowerCase().trim() === 'medecin' ? [{ key: 'horaires', label: t('profile.tabs.schedule'), icon: Calendar }] : []),
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-10">
      {/* Header Section */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <Sparkles className="text-purple" size={18} />
              <span className="text-xs font-black text-purple uppercase tracking-[0.2em]">Mon Compte</span>
           </div>
           <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none">{t('profile.title')}</h1>
           <p className="text-slate-500 mt-3 font-medium text-lg">{t('profile.subtitle')}</p>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" icon={Bell} className="h-12 w-12 p-0 rounded-2xl" />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Tabs */}
        <div className="space-y-8">
           {/* Avatar Card */}
           <Card className="rounded-[2.5rem] p-8 border border-white/60 shadow-premium overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple/[0.02] to-indigo/[0.02] pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center text-center">
                 <div className="relative mb-6">
                    <div className="w-32 h-32 bg-gradient-to-tr from-purple to-indigo rounded-[3rem] shadow-glow flex items-center justify-center text-white text-4xl font-black border-4 border-white">
                       {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
                    </div>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="absolute -bottom-2 -right-2 w-11 h-11 bg-white rounded-2xl shadow-premium border border-slate-100 flex items-center justify-center text-purple transition-all hover:text-indigo">
                       <Camera size={20} strokeWidth={2.5} />
                    </motion.button>
                 </div>
                 <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-2">{user?.prenom} {user?.nom}</h2>
                 <p className="text-sm font-bold text-slate-400 mb-6">{user?.email}</p>
                 <Badge variant="purple" className="px-4 py-1.5 rounded-xl uppercase tracking-widest text-[10px]">{t(`roles.${user?.role}`)}</Badge>
              </div>
           </Card>

           {/* Tab Navigation */}
           <div className="glass-card p-3 border border-white/60 space-y-2">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.key}
                  whileHover={{ x: 5 }}
                  onClick={() => { setTab(tab.key); setSuccess(''); setError(''); }}
                  className={twMerge(
                    "w-full flex items-center justify-between p-4 rounded-2xl transition-all relative group overflow-hidden",
                    activeTab === tab.key ? 'text-purple' : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={twMerge(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                      activeTab === tab.key ? 'bg-purple text-white shadow-glow' : 'bg-slate-50 text-slate-400'
                    )}>
                      <tab.icon size={18} strokeWidth={2.5} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
                  </div>
                  <ChevronRight size={16} strokeWidth={3} className={twMerge("transition-all relative z-10", activeTab === tab.key ? 'opacity-100' : 'opacity-0')} />
                  {activeTab === tab.key && (
                    <motion.div layoutId="profile-tab-bg" className="absolute inset-0 bg-purple/5" />
                  )}
                </motion.button>
              ))}
           </div>
        </div>

        {/* Right Column: Form Area */}
        <div className="lg:col-span-2 space-y-6">
           <AnimatePresence mode="wait">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
             >
                <Card className="rounded-[2.5rem] p-10 border border-white/60 shadow-premium min-h-[500px] relative overflow-hidden">
                   {/* Messages */}
                   <AnimatePresence>
                     {success && (
                       <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-8 p-5 bg-emerald/5 border border-emerald/20 rounded-2xl text-emerald text-sm font-bold flex items-center gap-3">
                          <CheckCircle2 size={20} /> {success}
                       </motion.div>
                     )}
                     {error && (
                       <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-8 p-5 bg-coral/5 border border-coral/20 rounded-2xl text-coral text-sm font-bold flex items-center gap-3">
                          <AlertCircle size={20} /> {error}
                       </motion.div>
                     )}
                   </AnimatePresence>

                   {/* Profil Tab */}
                   {activeTab === 'profil' && (
                     <div className="space-y-8">
                       <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-purple/10 text-purple rounded-xl flex items-center justify-center">
                             <Briefcase size={20} />
                          </div>
                          <h3 className="text-2xl font-black text-slate-800 tracking-tight">Informations Personnelles</h3>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <Input label={t('profile.form.firstname')} icon={User} value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} />
                         <Input label={t('profile.form.lastname')} icon={User} value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} />
                       </div>
                       <Input label={t('profile.form.phone')} icon={Phone} value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} />

                       {user?.role?.toLowerCase().trim() === 'medecin' && (
                         <div className="space-y-8 pt-4 border-t border-slate-100">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ms-1">{t('profile.form.title')}</label>
                                <select value={form.titre} onChange={e => setForm({...form, titre: e.target.value})}
                                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-purple focus:ring-4 focus:ring-purple/5 outline-none transition-all appearance-none">
                                  <option value="Dr">{t('profile.title_dr') || 'Dr.'}</option>
                                  <option value="Pr">{t('profile.title_pr') || 'Pr.'}</option>
                                  <option value="Dr Pr">Dr Pr</option>
                                </select>
                              </div>
                              <div className="space-y-2">
                                 <label className="text-xs font-black text-slate-400 uppercase tracking-widest ms-1">Disponibilite</label>
                                 <button 
                                   onClick={() => setForm({...form, disponible: !form.disponible})}
                                   className={twMerge(
                                     "w-full h-14 rounded-2xl flex items-center justify-between px-6 transition-all border",
                                     form.disponible ? 'bg-emerald/5 border-emerald/20 text-emerald' : 'bg-slate-50 border-slate-200 text-slate-400'
                                   )}
                                 >
                                    <span className="text-xs font-black uppercase tracking-widest">{form.disponible ? 'Disponible' : 'Indisponible'}</span>
                                    <div className={twMerge("w-10 h-5 rounded-full relative transition-all", form.disponible ? 'bg-emerald' : 'bg-slate-300')}>
                                       <motion.div animate={{ x: form.disponible ? 22 : 2 }} className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                                    </div>
                                 </button>
                              </div>
                           </div>

                           <div className="space-y-2">
                             <label className="text-xs font-black text-slate-400 uppercase tracking-widest ms-1">{t('profile.form.bio')}</label>
                             <textarea value={form.biographie}
                               onChange={e => setForm({...form, biographie: e.target.value})}
                               rows={4} placeholder={t('profile.form.bio_placeholder')}
                               className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-medium text-slate-700 focus:bg-white focus:border-purple focus:ring-4 focus:ring-purple/5 outline-none transition-all resize-none leading-relaxed"
                             />
                           </div>

                           <div className="grid grid-cols-2 gap-6">
                             <Input label={t('profile.form.duration')} icon={Clock} type="number" value={form.consultation_duree} onChange={e => setForm({...form, consultation_duree: parseInt(e.target.value)})} />
                             <Input label={t('profile.form.price')} icon={DollarSign} type="number" value={form.consultation_tarif} onChange={e => setForm({...form, consultation_tarif: parseFloat(e.target.value)})} />
                           </div>
                         </div>
                       )}

                       <Button onClick={handleSaveProfil} isLoading={saving} icon={Save} className="w-full h-14 shadow-glow rounded-2xl uppercase tracking-[0.2em] font-black text-xs">
                         {t('profile.form.save_profile')}
                       </Button>
                     </div>
                   )}

                   {/* Security Tab */}
                   {activeTab === 'securite' && (
                     <div className="space-y-8">
                       <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-indigo/10 text-indigo rounded-xl flex items-center justify-center">
                             <Lock size={20} />
                          </div>
                          <h3 className="text-2xl font-black text-slate-800 tracking-tight">{t('profile.tabs.security')}</h3>
                       </div>

                       <div className="space-y-6">
                         <Input label={t('profile.security.old_password')} icon={Lock} type="password" value={mdpForm.ancien_mdp} onChange={e => setMdpForm({...mdpForm, ancien_mdp: e.target.value})} />
                         <div className="h-px bg-slate-100 my-4" />
                         <Input label={t('profile.security.new_password')} icon={Lock} type="password" value={mdpForm.nouveau_mdp} onChange={e => setMdpForm({...mdpForm, nouveau_mdp: e.target.value})} />
                         <Input label={t('profile.security.confirm_password')} icon={ShieldCheck} type="password" value={mdpForm.confirm_mdp} onChange={e => setMdpForm({...mdpForm, confirm_mdp: e.target.value})} />
                       </div>

                       <Button onClick={handleSaveMdp} isLoading={saving} icon={Save} className="w-full h-14 shadow-glow rounded-2xl uppercase tracking-[0.2em] font-black text-xs">
                         {t('profile.security.change_password')}
                       </Button>
                     </div>
                   )}

                   {/* Schedule Tab */}
                   {activeTab === 'horaires' && user?.role?.toLowerCase().trim() === 'medecin' && (
                     <div className="space-y-8">
                       <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-emerald/10 text-emerald rounded-xl flex items-center justify-center">
                             <Calendar size={20} />
                          </div>
                          <h3 className="text-2xl font-black text-slate-800 tracking-tight">Horaires de Consultation</h3>
                       </div>

                       <div className="grid grid-cols-1 gap-3">
                         {horaires.map((h, i) => (
                           <div key={i} className={twMerge(
                             "p-5 rounded-[1.75rem] border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group",
                             h.actif ? 'bg-white border-purple/10 shadow-soft' : 'bg-slate-50/50 border-slate-100 opacity-60'
                           )}>
                             <div className="flex items-center gap-4">
                                <button 
                                  onClick={() => toggleJour(i)}
                                  className={twMerge(
                                    "w-12 h-6 rounded-full relative transition-all",
                                    h.actif ? 'bg-emerald' : 'bg-slate-300'
                                  )}
                                >
                                   <motion.div animate={{ x: h.actif ? 26 : 4 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                                </button>
                                <span className={twMerge("text-sm font-black uppercase tracking-widest", h.actif ? 'text-slate-800' : 'text-slate-400')}>
                                  {JOURS[i]}
                                </span>
                             </div>
                             
                             <AnimatePresence>
                               {h.actif && (
                                 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex items-center gap-3">
                                   <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                      <Clock size={14} className="text-slate-400" />
                                      <input type="time" value={h.heure_debut} onChange={e => updateHoraire(i, 'heure_debut', e.target.value)} className="bg-transparent text-xs font-black text-slate-700 outline-none" />
                                   </div>
                                   <ArrowRight size={14} className="text-slate-300" />
                                   <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                      <Clock size={14} className="text-slate-400" />
                                      <input type="time" value={h.heure_fin} onChange={e => updateHoraire(i, 'heure_fin', e.target.value)} className="bg-transparent text-xs font-black text-slate-700 outline-none" />
                                   </div>
                                 </motion.div>
                               )}
                             </AnimatePresence>
                           </div>
                         ))}
                       </div>

                       <Button onClick={handleSaveHoraires} isLoading={saving} icon={Save} className="w-full h-14 shadow-glow rounded-2xl uppercase tracking-[0.2em] font-black text-xs">
                         {t('profile.schedule.save_schedule')}
                       </Button>
                     </div>
                   )}
                </Card>
             </motion.div>
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Profile;
