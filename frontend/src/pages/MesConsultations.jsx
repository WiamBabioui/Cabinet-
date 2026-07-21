import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Download, Calendar, ArrowLeft,
  Stethoscope, Clock, AlertCircle, FileSearch,
  Sparkles, Activity, ShieldCheck, User
} from 'lucide-react';
import { motion } from 'framer-motion';
import Card from '../components/dashboard/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import api from '../services/api';
import { format } from 'date-fns';
import { fr, arMA, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

const MesConsultations = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const getLocale = () => {
    const lang = i18n.language || 'fr';
    if (lang.startsWith('ar')) return arMA;
    if (lang.startsWith('en')) return enUS;
    return fr;
  };

  const safeFormatDate = (dateStr, formatStr = 'dd MMMM yyyy') => {
    try {
      if (!dateStr) return '—';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      return format(d, formatStr, { locale: getLocale() });
    } catch {
      return '—';
    }
  };

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const res = await api.get('/patients/portal/consultations');
        setConsultations(res.data.consultations || []);
      } catch (err) {
        console.error('Fetch consultations error:', err);
        setError(err.response?.data?.message || t('common.error_loading'));
      } finally {
        setLoading(false);
      }
    };
    fetchConsultations();
  }, [t]);

  const handleDownloadOrdonnance = async (consultationId) => {
    setDownloadingId(consultationId);
    try {
      const response = await api.get(`/consultations/${consultationId}/ordonnance`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Ordonnance_Consultation_${consultationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert(err.response?.data?.message || 'Erreur lors du téléchargement de l\'ordonnance.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-160px)] flex flex-col items-center justify-center gap-6">
        <div className="w-20 h-20 border-4 border-purple/10 border-t-purple rounded-full animate-spin" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">
          Chargement de votre historique médical...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button
            onClick={() => navigate('/patient-portal')}
            className="w-12 h-12 bg-white shadow-soft rounded-2xl flex items-center justify-center text-slate-400 hover:text-purple hover:border-purple/30 transition-all border border-slate-100"
          >
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="text-purple" size={16} />
              <span className="text-xs font-black text-purple uppercase tracking-[0.2em]">
                Historique Médical
              </span>
            </div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none">
              Mes Consultations
            </h1>
          </div>
        </div>
        <Badge variant="purple" className="px-5 py-2.5 rounded-2xl uppercase tracking-widest text-xs font-black">
          {consultations.length} {consultations.length > 1 ? 'Consultations enregistrées' : 'Consultation enregistrée'}
        </Badge>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-5 bg-coral/5 border border-coral/20 rounded-[2rem] text-coral text-sm font-bold shadow-sm">
          <AlertCircle size={22} /> {error}
        </div>
      )}

      {/* Liste des consultations */}
      {consultations.length === 0 ? (
        <Card className="rounded-[2.5rem] p-16 border border-white/60 text-center">
          <div className="w-24 h-24 bg-purple/5 text-purple/40 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FileSearch size={48} strokeWidth={1.5} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">Aucune consultation</h3>
          <p className="text-slate-400 font-medium max-w-md mx-auto">
            Vous n'avez pas encore de consultation enregistrée par votre médecin traitant.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {consultations.map((consult, index) => {
            const ordonnanceText = consult.ordonnance || consult.prescription || consult.traitement || '';
            const hasOrdonnance = ordonnanceText && ordonnanceText.trim() !== '';
            return (
              <motion.div
                key={consult.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="rounded-[2.5rem] p-8 border border-white/60 hover:shadow-premium transition-all relative overflow-hidden group">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100/60">
                    <div className="flex items-start gap-5">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple to-indigo rounded-2xl flex flex-col items-center justify-center text-white shadow-glow shrink-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
                          {safeFormatDate(consult.date_consultation, 'MMM')}
                        </span>
                        <span className="text-2xl font-black tracking-tighter leading-none mt-0.5">
                          {safeFormatDate(consult.date_consultation, 'dd')}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs font-black text-purple uppercase tracking-wider">
                            {safeFormatDate(consult.date_consultation, 'yyyy')}
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                            <Stethoscope size={14} className="text-purple/50" />
                            Dr. {consult.medecin_nom}
                          </span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                          {consult.diagnostic_principal || consult.motif || 'Consultation médicale'}
                        </h3>
                      </div>
                    </div>

                    {hasOrdonnance && (
                      <Button
                        className="h-13 px-7 rounded-2xl shadow-glow text-xs font-black uppercase tracking-widest shrink-0"
                        icon={Download}
                        isLoading={downloadingId === consult.id}
                        onClick={() => handleDownloadOrdonnance(consult.id)}
                      >
                        Télécharger Ordonnance
                      </Button>
                    )}
                  </div>

                  {/* Détails */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                    {consult.motif && (
                      <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                          Motif de consultation
                        </span>
                        <p className="text-sm font-bold text-slate-700 leading-relaxed">
                          {consult.motif}
                        </p>
                      </div>
                    )}

                    {consult.diagnostic_principal && (
                      <div className="p-5 bg-purple/5 rounded-2xl border border-purple/10">
                        <span className="text-[10px] font-black text-purple/70 uppercase tracking-widest block mb-2">
                          Diagnostic
                        </span>
                        <p className="text-sm font-black text-slate-800 leading-relaxed">
                          {consult.diagnostic_principal}
                        </p>
                        {consult.diagnostic_secondaire && (
                          <p className="text-xs text-slate-500 font-medium mt-1">
                            Sec. {consult.diagnostic_secondaire}
                          </p>
                        )}
                      </div>
                    )}

                    {consult.anamnese && (
                      <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-100 md:col-span-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                          Notes du médecin (Anamnèse / Examen)
                        </span>
                        <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-line">
                          {consult.anamnese}
                        </p>
                      </div>
                    )}

                    {hasOrdonnance && (
                      <div className="p-5 bg-emerald/5 rounded-2xl border border-emerald/10 md:col-span-2">
                        <span className="text-[10px] font-black text-emerald/80 uppercase tracking-widest block mb-2">
                          Prescription / Ordonnance
                        </span>
                        <p className="text-sm font-bold text-slate-700 leading-relaxed whitespace-pre-line font-mono text-xs">
                          {ordonnanceText}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}

        </div>
      )}
    </div>
  );
};

export default MesConsultations;
