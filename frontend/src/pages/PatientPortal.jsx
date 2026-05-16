import React, { useState, useEffect } from 'react';
import { 
  User, 
  FileText, 
  Download, 
  Calendar, 
  ChevronRight, 
  Shield, 
  Smartphone,
  Pill,
  Clock,
  Heart,
  Loader2,
  AlertCircle,
  Sparkles,
  Zap,
  Activity,
  ArrowRight,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/dashboard/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import api from '../services/api';
import { format } from 'date-fns';
import { fr, arMA, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { twMerge } from 'tailwind-merge';

const PatientPortal = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        const res = await api.get('/patients/portal');
        setData(res.data);
      } catch (err) {
        console.error('Portal fetch error:', err);
        setError(err.response?.data?.message || t('common.error_loading'));
      } finally {
        setLoading(false);
      }
    };
    fetchPortalData();
  }, []);

  if (loading) {
    return (
      <div className="h-[calc(100vh-160px)] flex flex-col items-center justify-center gap-6">
        <div className="w-20 h-20 border-4 border-purple/10 border-t-purple rounded-full animate-spin" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Chargement de votre espace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[calc(100vh-160px)] flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-coral/5 border border-coral/20 p-12 rounded-[3rem] text-center max-w-lg shadow-premium">
          <div className="w-20 h-20 bg-coral/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-coral">
             <AlertCircle size={48} strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">{t('portal.error.oops')}</h2>
          <p className="text-slate-500 font-medium leading-relaxed">{error}</p>
          <Button variant="outline" className="mt-8 px-10 h-14" onClick={() => window.location.reload()}>Reessayer</Button>
        </motion.div>
      </div>
    );
  }

  const { patient, dossier, prochainRDV, consultations } = data;

  // Calcul de l'âge
  const age = patient.date_naissance 
    ? new Date().getFullYear() - new Date(patient.date_naissance).getFullYear() 
    : 'N/A';

  const getLocale = () => {
    if (i18n.language === 'ar') return arMA;
    if (i18n.language === 'en') return enUS;
    return fr;
  };

  return (
    <div className="space-y-10 pb-10">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden glass-card p-10 border border-white/60">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple/5 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="relative group">
            <div className="w-40 h-40 bg-gradient-to-tr from-purple/10 to-indigo/10 rounded-[3rem] flex items-center justify-center text-purple border-4 border-white shadow-premium overflow-hidden group-hover:scale-105 transition-transform duration-500">
              {patient.photo_url ? (
                <img src={patient.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={80} strokeWidth={1.5} />
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-2xl shadow-glow flex items-center justify-center text-emerald">
               <ShieldCheck size={24} strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-3">
              <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none">{patient.prenom} {patient.nom}</h1>
              <Badge variant={patient.statut === 'actif' ? 'success' : 'warning'} className="px-4 py-1.5 rounded-xl uppercase tracking-widest text-[10px]">
                {patient.statut === 'actif' ? t('portal.header.active_profile') : patient.statut}
              </Badge>
            </div>
            <p className="text-slate-500 font-bold text-lg mb-6 flex items-center justify-center md:justify-start gap-3">
              <span className="text-purple/40">#</span>{patient.num_dossier}
              <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
              {patient.sexe === 'M' ? t('portal.header.gender_m') : t('portal.header.gender_f')}
              <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
              {t('portal.header.age_years', { count: age })}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="px-5 py-2.5 bg-white/40 backdrop-blur-md rounded-2xl border border-white/80 flex items-center gap-3 shadow-soft group transition-all hover:bg-white">
                <div className="w-8 h-8 bg-coral/10 text-coral rounded-xl flex items-center justify-center">
                   <Heart size={16} strokeWidth={2.5} />
                </div>
                <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{t('portal.header.blood_group', { group: patient.groupe_sanguin || '?' })}</span>
              </div>
              <div className="px-5 py-2.5 bg-white/40 backdrop-blur-md rounded-2xl border border-white/80 flex items-center gap-3 shadow-soft group transition-all hover:bg-white">
                <div className="w-8 h-8 bg-indigo/10 text-indigo rounded-xl flex items-center justify-center">
                   <Shield size={16} strokeWidth={2.5} />
                </div>
                <span className="text-xs font-black text-slate-700 uppercase tracking-widest truncate max-w-[200px]">{t('portal.header.allergies', { list: dossier?.allergies || '?' })}</span>
              </div>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="outline" className="h-14 px-8 border-slate-200 shadow-premium" icon={Smartphone}>{t('portal.header.linked_device')}</Button>
          </motion.div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-10">
          {/* Upcoming Appointment */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card className="rounded-[2.5rem] p-10 border border-white/60 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-2">{t('portal.upcoming.title')}</h3>
                    <p className="text-sm font-medium text-slate-400">{t('portal.upcoming.subtitle')}</p>
                 </div>
                 <div className="w-12 h-12 bg-purple/10 text-purple rounded-2xl flex items-center justify-center">
                    <Calendar size={24} strokeWidth={2.5} />
                 </div>
              </div>

              {prochainRDV ? (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 p-8 bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/80 shadow-premium">
                  <div className="flex gap-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple to-indigo rounded-[1.75rem] flex flex-col items-center justify-center shadow-glow border border-white/20">
                      <span className="text-[11px] font-black text-white/70 uppercase tracking-widest">
                        {format(new Date(prochainRDV.date_heure_debut), 'MMM', { locale: getLocale() })}
                      </span>
                      <span className="text-3xl font-black text-white tracking-tighter leading-none mt-1">
                        {format(new Date(prochainRDV.date_heure_debut), 'dd', { locale: getLocale() })}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-800 tracking-tight mb-2">{prochainRDV.motif}</h4>
                      <div className="flex flex-wrap gap-4">
                         <p className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                            <Clock size={14} className="text-purple/50" /> 
                            {format(new Date(prochainRDV.date_heure_debut), 'HH:mm', { locale: getLocale() })}
                         </p>
                         <p className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                            <Stethoscope size={14} className="text-purple/50" />
                            {t('roles.medecin')}. {prochainRDV.medecin_prenom} {prochainRDV.medecin_nom}
                         </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="ghost" className="h-12 px-6 text-coral hover:bg-coral/5 font-black uppercase tracking-widest text-[10px]">{t('portal.upcoming.cancel')}</Button>
                    <Button className="h-12 px-8 rounded-2xl shadow-glow font-black uppercase tracking-widest text-[10px]">{t('portal.upcoming.reschedule')}</Button>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center bg-white/30 backdrop-blur-md rounded-[2.5rem] border border-dashed border-slate-200 group/empty hover:border-purple/30 transition-all">
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200 border border-slate-100 group-hover/empty:scale-110 transition-transform">
                     <Calendar size={40} strokeWidth={1.5} />
                  </div>
                  <p className="text-slate-500 font-black uppercase tracking-widest text-xs mb-6">{t('portal.upcoming.no_appointments')}</p>
                  <Button variant="outline" className="px-10 h-14 rounded-2xl" icon={Plus}>{t('portal.upcoming.book')}</Button>
                </div>
              )}
            </Card>
          </motion.div>
  
          {/* Medical Records History */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="rounded-[2.5rem] p-10 border border-white/60">
              <div className="flex items-center justify-between mb-10">
                 <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-2">{t('portal.history.title')}</h3>
                    <p className="text-sm font-medium text-slate-400">{t('portal.history.subtitle')}</p>
                 </div>
                 <div className="w-12 h-12 bg-indigo/10 text-indigo rounded-2xl flex items-center justify-center">
                    <FileText size={24} strokeWidth={2.5} />
                 </div>
              </div>

              <div className="space-y-4">
                {consultations.length > 0 ? (
                  consultations.map((consult, i) => (
                    <motion.div 
                      key={consult.id} 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-6 bg-white/40 backdrop-blur-sm border border-white/80 rounded-[2rem] hover:bg-white hover:shadow-soft transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo/5 to-purple/5 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-purple group-hover:shadow-glow transition-all">
                          <Activity size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                          <h5 className="font-black text-slate-800 text-base mb-1">{consult.diagnostic_principal}</h5>
                          <div className="flex items-center gap-3">
                             <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em]">
                               {t('roles.medecin')}. {consult.medecin_nom}
                             </span>
                             <span className="w-1 h-1 rounded-full bg-slate-200" />
                             <span className="text-[10px] text-purple font-black uppercase tracking-[0.15em]">
                               {format(new Date(consult.date_consultation), 'dd MMMM yyyy', { locale: getLocale() })}
                             </span>
                          </div>
                        </div>
                      </div>
                      <motion.button whileHover={{ scale: 1.1, rotate: 10 }} className="w-12 h-12 flex items-center justify-center bg-white shadow-soft rounded-2xl text-slate-300 hover:text-purple transition-colors border border-slate-50">
                        <Download size={20} strokeWidth={2.5} />
                      </motion.button>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-20 text-center opacity-30">
                     <FileText size={48} className="mx-auto mb-4" />
                     <p className="text-xs font-black uppercase tracking-widest">{t('portal.history.no_history')}</p>
                  </div>
                )}
              </div>
              {consultations.length > 0 && (
                <Button variant="ghost" className="w-full mt-10 h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-purple/5 text-purple group">
                  {t('portal.history.view_all')} <ArrowRight size={16} className="ms-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              )}
            </Card>
          </motion.div>
        </div>

        <div className="space-y-10">
          {/* Medications Card */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card className="rounded-[2.5rem] p-8 border border-white/60 shadow-premium overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-coral/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-10 bg-coral/10 text-coral rounded-xl flex items-center justify-center">
                      <Pill size={20} strokeWidth={2.5} />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">{t('portal.treatments.title')}</h3>
                      <p className="text-xs font-medium text-slate-400">{t('portal.treatments.subtitle')}</p>
                   </div>
                </div>
                
                <div className="space-y-4">
                  {dossier?.traitements_en_cours ? (
                    <div className="p-6 bg-white shadow-soft rounded-[2rem] border border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prescription active</span>
                        <Badge variant="mint" className="text-[8px] tracking-tighter uppercase">{t('portal.treatments.ongoing')}</Badge>
                      </div>
                      <p className="text-sm font-bold text-slate-600 leading-relaxed italic">
                        "{dossier.traitements_en_cours}"
                      </p>
                    </div>
                  ) : (
                    <div className="py-10 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('portal.treatments.no_treatments')}</p>
                    </div>
                  )}
                </div>
                <Button className="w-full mt-8 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-none" variant="outline">{t('portal.treatments.renew')}</Button>
              </div>
            </Card>
          </motion.div>

          {/* Book Appointment CTA */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <Card className="rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white p-10 border-none shadow-glow-purple relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center text-purple mb-6 shadow-glow border border-white/10 group-hover:rotate-12 transition-all">
                  <Zap size={36} className="fill-purple" />
                </div>
                <h4 className="text-2xl font-black mb-3 tracking-tight">{t('portal.cta.title')}</h4>
                <p className="text-sm text-white/50 mb-8 font-medium leading-relaxed">{t('portal.cta.subtitle')}</p>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full h-14 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-glow hover:shadow-glow-purple transition-all">
                   {t('portal.cta.book')}
                </motion.button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PatientPortal;
