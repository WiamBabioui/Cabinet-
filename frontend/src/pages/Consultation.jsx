import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Stethoscope,
  Activity,
  Pill,
  ChevronRight,
  ClipboardList,
  Download,
  Plus,
  Loader2,
  Trash2,
  Sparkles,
  Thermometer,
  Heart,
  Droplets,
  Scale,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import Card from '../components/dashboard/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { twMerge } from 'tailwind-merge';

// ─── Main Component ────────────────────────────────────────────────────────────
const Consultation = () => {
  const { user } = useAuth();
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [activeTab, setActiveTab] = useState('notes');
  const [loading, setLoading]     = useState(false);
  const [appointment, setAppointment] = useState(null);
  const [saving, setSaving]       = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    poids_kg: '', taille_cm: '', tension_sys: '', tension_dia: '',
    temperature: '', frequence_cardiaque: '', spo2: '',
    anamnese: '', examen_clinique: '', diagnostic_principal: '',
    codes_cim10: '', conduite_a_tenir: ''
  });

  const [ordonnances, setOrdonnances] = useState([]);
  const [newMed, setNewMed]           = useState({ medicament: '', posologie: '', duree: '' });

  useEffect(() => {
    if (appointmentId) fetchAppointmentDetails();
  }, [appointmentId]);

  const fetchAppointmentDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/appointments/${appointmentId}`);
      setAppointment(res.data.appointment);
    } catch (err) {
      console.error('Error fetching appointment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addMedication = () => {
    if (!newMed.medicament || !newMed.posologie) return;
    setOrdonnances([...ordonnances, { ...newMed, id: Date.now() }]);
    setNewMed({ medicament: '', posologie: '', duree: '' });
  };

  const removeMedication = (id) =>
    setOrdonnances(ordonnances.filter(m => m.id !== id));

  const handleSave = async () => {
    if (!appointmentId) return;
    setSaving(true);
    try {
      await api.post('/consultations', {
        rendez_vous_id: appointmentId,
        ...formData,
        ordonnances
      });
      navigate('/appointments');
    } catch (err) {
      console.error('Save error', err);
    } finally {
      setSaving(false);
    }
  };

  // ─── PDF Generation ─────────────────────────────────────────────────────────
  const generatePrescriptionPDF = () => {
    if (!appointment || ordonnances.length === 0) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const teal    = [14, 108, 104];
    const dark    = [51, 65, 85];
    const grey    = [148, 163, 184];
    const greyBg  = [248, 250, 252];
    const slate   = [100, 116, 139];

    const dateStr = new Date().toLocaleDateString(
      i18n.language === 'ar' ? 'ar-MA' : 'fr-FR',
      { day: '2-digit', month: 'long', year: 'numeric' }
    );

    // ── Left header: doctor info ─────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...teal);
    doc.text(`Dr. ${user?.prenom || ''} ${user?.nom || ''}`, 20, 24);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...dark);
    doc.text('Cabinet de Médecine Générale & Spécialités', 20, 30);
    doc.text(`Tél : ${user?.telephone || '+212 522-000000'}`, 20, 35);
    doc.text(`Email : ${user?.email || ''}`, 20, 40);

    // ── Right header: date ───────────────────────────────────────────────────
    doc.setFontSize(9);
    doc.setTextColor(...grey);
    doc.text(`Casablanca, le ${dateStr}`, 190, 24, { align: 'right' });

    // ── Teal separator ───────────────────────────────────────────────────────
    doc.setDrawColor(...teal);
    doc.setLineWidth(0.8);
    doc.line(20, 47, 190, 47);

    // ── Patient block ────────────────────────────────────────────────────────
    doc.setFillColor(...greyBg);
    doc.roundedRect(20, 53, 170, 22, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...teal);
    doc.text('PATIENT :', 26, 61);

    doc.setTextColor(...dark);
    doc.text(
      `${appointment.patient_prenom || ''} ${appointment.patient_nom || ''}`,
      55, 61
    );

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...slate);
    doc.text(`Tél : ${appointment.patient_telephone || 'Non renseigné'}`, 26, 68);
    if (formData.diagnostic_principal) {
      doc.text(`Diagnostic : ${formData.diagnostic_principal}`, 100, 68);
    }

    // ── ORDONNANCE title ─────────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...teal);
    doc.text('ORDONNANCE MÉDICALE', 105, 90, { align: 'center' });

    doc.setDrawColor(...teal);
    doc.setLineWidth(0.3);
    doc.line(55, 93, 155, 93);

    // ── Medications list ─────────────────────────────────────────────────────
    let y = 106;

    ordonnances.forEach((med, idx) => {
      if (y > 248) { doc.addPage(); y = 30; }

      // Number badge background
      doc.setFillColor(...teal);
      doc.roundedRect(20, y - 5, 7, 7, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(`${idx + 1}`, 23.5, y, { align: 'center' });

      // Med name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...dark);
      doc.text(med.medicament, 32, y);

      // Posology
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(...slate);
      doc.text(`Posologie : ${med.posologie}`, 32, y + 6);

      if (med.duree) {
        doc.setFont('helvetica', 'normal');
        doc.text(`Pendant : ${med.duree}`, 140, y + 6);
      }

      // Light separator
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(32, y + 11, 188, y + 11);

      y += 18;
    });

    // ── Signature zone ───────────────────────────────────────────────────────
    const sigY = Math.max(y + 20, 240);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...slate);
    doc.text('Signature & Cachet du Médecin :', 130, sigY);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(130, sigY + 18, 188, sigY + 18);

    // ── Footer ───────────────────────────────────────────────────────────────
    doc.setFontSize(7);
    doc.setTextColor(...grey);
    doc.text(
      'Document généré par Cabinet+ — Plateforme de Gestion Médicale Marocaine',
      105, 287, { align: 'center' }
    );

    const filename = `Ordonnance_${appointment.patient_nom || 'Patient'}_${dateStr.replace(/ /g, '_')}.pdf`;
    doc.save(filename);
  };

  // ─── Loading state ──────────────────────────────────────────────────────────
  if (loading) return (
    <div className="h-[calc(100vh-160px)] flex flex-col items-center justify-center gap-6">
      <div className="w-20 h-20 border-4 border-purple/10 border-t-purple rounded-full animate-spin" />
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Initialisation de la session...</p>
    </div>
  );

  const tabs = [
    { id: 'notes',        label: t('consultation.tabs.observations'), icon: FileText,     },
    { id: 'vitals',       label: t('consultation.tabs.vitals'),        icon: Activity,     },
    { id: 'diagnosis',    label: t('consultation.tabs.diagnosis'),     icon: ClipboardList },
    { id: 'prescription', label: t('consultation.tabs.prescription'),  icon: Pill,         },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-tr from-purple to-indigo rounded-[1.5rem] shadow-glow flex items-center justify-center text-white">
              <Stethoscope size={30} strokeWidth={2.5} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald rounded-full border-4 border-white flex items-center justify-center">
              <Zap size={10} className="text-white fill-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-purple" />
              <span className="text-[10px] font-black text-purple uppercase tracking-[0.2em]">{t('consultation.title')}</span>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">
              {appointment
                ? `${appointment.patient_prenom} ${appointment.patient_nom}`
                : t('common.loading')}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm font-bold text-slate-500">
              <span className="flex items-center gap-1.5">
                <Activity size={14} className="text-purple/50" />
                {appointment?.motif}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-xs uppercase tracking-wider">
                {new Date().toLocaleDateString(
                  i18n.language === 'ar' ? 'ar-MA' : 'fr-FR',
                  { weekday: 'long', day: 'numeric', month: 'long' }
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-14 px-8 border-slate-200"
            onClick={() => navigate(`/patients/${appointment?.patient_id}`)}
          >
            {t('consultation.patient_file')}
          </Button>
          <Button
            className="h-14 px-10 shadow-glow"
            onClick={handleSave}
            disabled={saving || !appointment}
            isLoading={saving}
            icon={CheckCircle2}
          >
            {t('consultation.save_and_finish')}
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* ── Sidebar ── */}
        <div className="lg:col-span-1 space-y-3">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={twMerge(
                'w-full flex items-center justify-between p-5 rounded-[1.75rem] transition-all relative overflow-hidden group',
                activeTab === tab.id
                  ? 'bg-white shadow-premium border border-purple/10 text-purple'
                  : 'bg-white/40 text-slate-500 hover:bg-white hover:shadow-soft border border-transparent'
              )}
            >
              <div className="flex items-center gap-4 z-10">
                <div className={twMerge(
                  'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                  activeTab === tab.id
                    ? 'bg-purple text-white shadow-glow'
                    : 'bg-slate-100 text-slate-400 group-hover:bg-purple/5 group-hover:text-purple'
                )}>
                  <tab.icon size={20} strokeWidth={2.5} />
                </div>
                <span className="font-black text-xs uppercase tracking-widest">{tab.label}</span>
              </div>
              <ChevronRight
                size={18} strokeWidth={3}
                className={twMerge('z-10 transition-all', activeTab === tab.id ? 'opacity-100' : 'opacity-0 -translate-x-4')}
              />
              {activeTab === tab.id && (
                <motion.div
                  layoutId="consult-tab-bg"
                  className="absolute inset-0 bg-gradient-to-r from-purple/[0.03] to-transparent"
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* ── Workspace ── */}
        <div className="lg:col-span-3">
          <Card className="min-h-[600px] rounded-[2.5rem] p-10 border border-white/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <AnimatePresence mode="wait">

              {/* ── Observations ── */}
              {activeTab === 'notes' && (
                <motion.div key="notes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{t('consultation.observations.title')}</h3>
                    <div className="px-4 py-2 bg-purple/5 text-purple text-[10px] font-black uppercase tracking-widest rounded-xl border border-purple/10">Historique Disponible</div>
                  </div>
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ms-1">{t('consultation.observations.anamnese')}</label>
                      <textarea name="anamnese" value={formData.anamnese} onChange={handleInputChange}
                        className="w-full h-44 p-6 rounded-[2rem] bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:border-purple focus:ring-4 focus:ring-purple/5 transition-all text-slate-700 font-medium resize-none leading-relaxed"
                        placeholder={t('consultation.observations.anamnese_placeholder')} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ms-1">{t('consultation.observations.exam')}</label>
                      <textarea name="examen_clinique" value={formData.examen_clinique} onChange={handleInputChange}
                        className="w-full h-44 p-6 rounded-[2rem] bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:border-purple focus:ring-4 focus:ring-purple/5 transition-all text-slate-700 font-medium resize-none leading-relaxed"
                        placeholder={t('consultation.observations.exam_placeholder')} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Vitals ── */}
              {activeTab === 'vitals' && (
                <motion.div key="vitals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-8">{t('consultation.vitals.title')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { key: 'temperature',         label: t('consultation.vitals.temp'),   icon: Thermometer, color: 'coral',   unit: '°C',  ph: '37.0' },
                      { key: 'frequence_cardiaque',  label: t('consultation.vitals.hr'),    icon: Heart,       color: 'purple',  unit: 'BPM', ph: '72'   },
                      { key: 'spo2',                 label: t('consultation.vitals.spo2'),  icon: Droplets,    color: 'emerald', unit: '%',   ph: '98'   },
                      { key: 'poids_kg',             label: t('consultation.vitals.weight'),icon: Scale,       color: 'gold',    unit: 'KG',  ph: '70'   },
                    ].map(({ key, label, icon: Icon, color, unit, ph }) => (
                      <div key={key} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 group transition-all hover:bg-white hover:shadow-soft">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-10 h-10 bg-${color}/10 text-${color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <Icon size={20} strokeWidth={2.5} />
                          </div>
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</span>
                        </div>
                        <div className="relative">
                          <input name={key} value={formData[key]} onChange={handleInputChange}
                            className="w-full bg-transparent text-3xl font-black text-slate-800 outline-none" placeholder={ph} />
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xl font-black text-slate-300">{unit}</span>
                        </div>
                      </div>
                    ))}
                    {/* Blood pressure — spans 2 cols */}
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 group transition-all hover:bg-white hover:shadow-soft lg:col-span-2">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-indigo/10 text-indigo rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Activity size={20} strokeWidth={2.5} />
                        </div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Tension Artérielle (SYS/DIA)</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <input name="tension_sys" value={formData.tension_sys} onChange={handleInputChange}
                          className="w-24 bg-transparent text-3xl font-black text-slate-800 outline-none" placeholder="120" />
                        <span className="text-3xl font-black text-slate-200">/</span>
                        <input name="tension_dia" value={formData.tension_dia} onChange={handleInputChange}
                          className="w-24 bg-transparent text-3xl font-black text-slate-800 outline-none" placeholder="80" />
                        <span className="text-xl font-black text-slate-300">mmHg</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Diagnosis ── */}
              {activeTab === 'diagnosis' && (
                <motion.div key="diagnosis" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-8">{t('consultation.diagnosis.title')}</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input label={t('consultation.diagnosis.main')} name="diagnostic_principal" value={formData.diagnostic_principal} onChange={handleInputChange} placeholder="Ex: Grippe saisonnière" />
                      <Input label={t('consultation.diagnosis.cim10')} name="codes_cim10" value={formData.codes_cim10} onChange={handleInputChange} placeholder="Ex: J11.1" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ms-1">{t('consultation.diagnosis.advice')}</label>
                      <textarea name="conduite_a_tenir" value={formData.conduite_a_tenir} onChange={handleInputChange}
                        className="w-full h-44 p-6 rounded-[2rem] bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:border-purple focus:ring-4 focus:ring-purple/5 transition-all text-slate-700 font-medium resize-none leading-relaxed"
                        placeholder={t('consultation.diagnosis.advice_placeholder')} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Prescription ── */}
              {activeTab === 'prescription' && (
                <motion.div key="prescription" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{t('consultation.prescription.title')}</h3>
                    <div className="w-10 h-10 bg-coral/10 text-coral rounded-xl flex items-center justify-center">
                      <Pill size={20} strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* Add medication form */}
                  <div className="bg-white/50 border border-white p-8 rounded-[2.5rem] shadow-premium">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <Input label="Médicament" placeholder="Paracétamol..."
                        value={newMed.medicament} onChange={e => setNewMed({ ...newMed, medicament: e.target.value })} />
                      <Input label="Posologie" placeholder="1 comp. 3x/jour"
                        value={newMed.posologie} onChange={e => setNewMed({ ...newMed, posologie: e.target.value })} />
                      <Input label="Durée" placeholder="5 jours"
                        value={newMed.duree} onChange={e => setNewMed({ ...newMed, duree: e.target.value })} />
                    </div>
                    <Button
                      variant="outline"
                      className="w-full h-14 border-dashed border-2 hover:bg-purple/5 hover:border-purple/30 transition-all rounded-[1.5rem]"
                      icon={Plus}
                      onClick={addMedication}
                    >
                      Ajouter à l'ordonnance
                    </Button>
                  </div>

                  {/* Medications table */}
                  <div className="bg-white/30 rounded-[2rem] overflow-hidden border border-white/60">
                    <table className="w-full">
                      <thead className="bg-slate-50/50 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] border-b border-slate-100/50">
                        <tr>
                          <th className="px-8 py-5 text-left">{t('consultation.prescription.med')}</th>
                          <th className="px-8 py-5 text-left">{t('consultation.prescription.dosage')}</th>
                          <th className="px-8 py-5 text-left">{t('consultation.prescription.duration')}</th>
                          <th className="px-8 py-5 text-right">{t('dashboard.table.action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/30">
                        <AnimatePresence>
                          {ordonnances.map((med) => (
                            <motion.tr
                              key={med.id}
                              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                              className="hover:bg-purple/[0.02] transition-colors"
                            >
                              <td className="px-8 py-5 font-black text-slate-800 text-sm">{med.medicament}</td>
                              <td className="px-8 py-5 text-slate-500 font-bold text-xs">{med.posologie}</td>
                              <td className="px-8 py-5 text-slate-500 font-bold text-xs">{med.duree}</td>
                              <td className="px-8 py-5 text-right">
                                <motion.button
                                  whileHover={{ scale: 1.1, rotate: 10 }}
                                  onClick={() => removeMedication(med.id)}
                                  className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-coral transition-colors"
                                >
                                  <Trash2 size={16} strokeWidth={2.5} />
                                </motion.button>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                        {ordonnances.length === 0 && (
                          <tr>
                            <td colSpan="4" className="px-8 py-16 text-center text-slate-400 font-black uppercase tracking-widest text-[10px] opacity-50">
                              Aucun médicament ajouté
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Download PDF card — only shown when there are medications */}
                  <AnimatePresence>
                    {ordonnances.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0,  scale: 1    }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        className="relative overflow-hidden p-8 bg-gradient-to-br from-teal-50 via-white to-indigo-50 rounded-[2.5rem] border border-purple/10 shadow-premium"
                      >
                        {/* Background decoration */}
                        <div className="absolute -top-8 -right-8 w-40 h-40 bg-purple/5 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

                        <div className="relative flex flex-col sm:flex-row items-center gap-6">
                          <div className="w-16 h-16 bg-white rounded-2xl shadow-glow flex items-center justify-center text-purple flex-shrink-0">
                            <FileText size={28} strokeWidth={1.5} />
                          </div>
                          <div className="text-center sm:text-left flex-1">
                            <h4 className="font-black text-slate-800 text-lg tracking-tight">{t('consultation.prescription.ready')}</h4>
                            <p className="text-sm font-medium text-slate-500 mt-1">
                              {ordonnances.length} médicament{ordonnances.length > 1 ? 's' : ''} · Ordonnance officielle en PDF A4
                            </p>
                          </div>
                          <Button
                            onClick={generatePrescriptionPDF}
                            icon={Download}
                            className="shadow-glow h-14 px-8 rounded-2xl flex-shrink-0 group"
                          >
                            <span className="hidden sm:inline">Télécharger l'ordonnance</span>
                            <span className="sm:hidden">Télécharger PDF</span>
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

            </AnimatePresence>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Consultation;
