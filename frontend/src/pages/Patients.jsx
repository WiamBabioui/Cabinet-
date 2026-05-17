import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, MoreVertical, ExternalLink,
  Phone, Mail, ChevronLeft, ChevronRight,
  Loader2, AlertCircle, X, Filter, Download,
  UserPlus, Calendar, Activity, Sparkles, Hash, MessageSquare
} from 'lucide-react';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Modal Ajout Patient ──────────────────────────────────────────────────────
const AddPatientModal = ({ onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    prenom: '', nom: '', date_naissance: '', sexe: 'M',
    telephone: '', email: '', cin: '', adresse_ville: '',
    groupe_sanguin: '', assurance_nom: '', statut: 'actif',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/patients', form);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || t('patients.modal.error'));
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-indigo/60 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-glow w-full max-w-2xl overflow-hidden border border-white/60"
      >
        <div className="p-8 border-b border-white/30 bg-gradient-to-r from-purple/5 to-transparent flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{t('patients.modal.title')}</h2>
            <p className="text-sm font-medium text-slate-400 mt-1">Veuillez remplir les informations du patient</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-purple/10 rounded-2xl transition-all text-slate-400 hover:text-purple">
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="flex items-center gap-3 p-4 mb-8 bg-coral/5 border border-coral/20 rounded-2xl text-coral text-sm font-bold">
              <AlertCircle size={20} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label={t('patients.modal.firstname')} name="prenom" value={form.prenom} onChange={handleChange} required placeholder="Jean" />
              <Input label={t('patients.modal.lastname')} name="nom" value={form.nom} onChange={handleChange} required placeholder="Dupont" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label={t('patients.modal.birthdate')} type="date" name="date_naissance" value={form.date_naissance} onChange={handleChange} required />
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ms-1">{t('patients.modal.gender')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {['M', 'F', 'Autre'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, sexe: s })}
                      className={`py-3.5 rounded-2xl text-sm font-bold border transition-all ${
                        form.sexe === s 
                          ? 'bg-gradient-to-br from-purple to-[#9b82ff] border-transparent text-white shadow-glow' 
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white hover:border-purple/30 hover:text-purple'
                      }`}
                    >
                      {s === 'M' ? t('dashboard.genders.m') : s === 'F' ? t('dashboard.genders.f') : t('dashboard.genders.other')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label={t('patients.modal.phone')} name="telephone" value={form.telephone} onChange={handleChange} required placeholder="+212 6XX XXX XXX" icon={Phone} />
              <Input label={t('patients.modal.email') || 'Email'} type="email" name="email" value={form.email} onChange={handleChange} placeholder="patient@example.com" icon={Mail} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input label={t('patients.modal.cin')} name="cin" value={form.cin} onChange={handleChange} placeholder="AB123456" />
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ms-1">{t('patients.modal.blood_group')}</label>
                <select name="groupe_sanguin" value={form.groupe_sanguin} onChange={handleChange}
                  className="w-full px-5 py-[1.1rem] text-sm font-bold bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-purple focus:ring-4 focus:ring-purple/10 transition-all outline-none custom-scrollbar appearance-none">
                  <option value="">-</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <Input label={t('patients.modal.city')} name="adresse_ville" value={form.adresse_ville} onChange={handleChange} placeholder="Casablanca" />
            </div>

            <Input label={t('patients.modal.insurance')} name="assurance_nom" value={form.assurance_nom} onChange={handleChange} placeholder="CNSS, CNOPS, Mutuelle..." />

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" className="flex-1 h-14" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" className="flex-1 h-14" isLoading={loading} icon={UserPlus}>
                {t('patients.modal.create')}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Page Principale ──────────────────────────────────────────────────────────
const Patients = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [patients, setPatients]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchPatients = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const res = await api.get('/patients', { params: { page, limit: 10, search } });
      setPatients(res.data.patients);
      setPagination(res.data.pagination);
    } catch {
      setError(t('common.error_loading'));
    } finally { setLoading(false); }
  }, [t]);

  useEffect(() => {
    const delay = setTimeout(() => fetchPatients(1, searchTerm), 400);
    return () => clearTimeout(delay);
  }, [searchTerm, fetchPatients]);

  const statusColor = (s) => s === 'actif' ? 'success' : s === 'inactif' ? 'warning' : 'error';
  const calcAge = (d) => Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24 * 365.25));

  return (
    <div className="space-y-10 pb-10">
      <AnimatePresence>
        {showModal && (
          <AddPatientModal
            onClose={() => setShowModal(false)}
            onSuccess={() => fetchPatients(1, searchTerm)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <motion.div animate={{ rotate: [0, 15, -10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}>
                <Sparkles className="text-purple" size={18} />
             </motion.div>
            <span className="text-xs font-black text-purple uppercase tracking-[0.2em]">Gestion de patientele</span>
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none">{t('patients.title')}</h1>
          <p className="text-slate-500 mt-3 font-medium text-lg">
            {pagination.total > 1 
              ? t('patients.subtitle_plural', { count: pagination.total }) 
              : t('patients.subtitle', { count: pagination.total })}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" icon={Download}>Exporter</Button>
          <Button icon={UserPlus} onClick={() => setShowModal(true)}>
            {t('patients.add')}
          </Button>
        </div>
      </div>

      <div className="glass-card p-8 border border-white/60">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-10">
          <div className="flex-1 w-full relative group">
            <Input
              placeholder={t('patients.search_placeholder')}
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-16 bg-white/40 border-slate-200 focus:bg-white transition-all shadow-sm"
            />
            <div className="absolute right-4 top-[30px] flex items-center gap-2">
               <span className="hidden sm:flex px-3 py-1 bg-slate-100 text-slate-400 text-[9px] font-black rounded-lg uppercase tracking-widest border border-slate-200">CTRL K</span>
            </div>
          </div>
          <Button variant="outline" className="h-16 px-8 border-slate-200 text-slate-500 hover:text-purple" icon={Filter}>
            Filtres
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-5 mb-8 bg-coral/5 border border-coral/20 rounded-[2rem] text-coral text-sm font-bold shadow-sm">
            <AlertCircle size={22} /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-purple/10 border-t-purple rounded-full animate-spin" />
              <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple animate-pulse" size={30} />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Chargement de la base...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/40 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-y border-slate-100/50">
                    <th className="px-8 py-6 text-left">{t('patients.table.patient')}</th>
                    <th className="px-8 py-6 text-left">{t('patients.table.contact')}</th>
                    <th className="px-8 py-6 text-left">{t('patients.table.file_num')}</th>
                    <th className="px-8 py-6 text-left">{t('patients.table.status')}</th>
                    <th className="px-8 py-6 text-right">{t('patients.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/30">
                  {patients.map((p, idx) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="hover:bg-purple/[0.02] transition-all group cursor-pointer relative"
                      onClick={() => navigate(`/patients/${p.id}`)}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-gradient-to-tr from-purple/10 to-indigo/10 rounded-2xl flex items-center justify-center text-purple font-black text-xl border border-purple/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm relative overflow-hidden">
                             <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent" />
                             <span className="relative z-10">{p.prenom.charAt(0)}{p.nom.charAt(0)}</span>
                          </div>
                          <div>
                            <h4 className="font-black text-slate-800 text-base mb-1 group-hover:text-purple transition-colors flex items-center gap-2">
                              {p.prenom} {p.nom}
                              {idx === 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />}
                            </h4>
                            <div className="flex items-center gap-2">
                               <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">
                                {calcAge(p.date_naissance)} {i18n.language === 'ar' ? 'سنة' : 'ans'}
                                {' \u2022 '}
                                {p.sexe === 'M' ? t('dashboard.genders.m') : p.sexe === 'F' ? t('dashboard.genders.f') : t('dashboard.genders.other')}
                              </p>
                              {p.groupe_sanguin && (
                                <span className="px-2 py-0.5 bg-coral/10 text-coral text-[9px] font-black rounded-lg border border-coral/20 uppercase tracking-tighter">{p.groupe_sanguin}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-6">
                        <div className="space-y-2.5">
                          {p.email && (
                            <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-500 lowercase tracking-tight">
                              <div className="w-7 h-7 bg-white shadow-sm rounded-xl flex items-center justify-center text-slate-400 group-hover:text-purple group-hover:shadow-glow transition-all">
                                <Mail size={13} strokeWidth={2.5} />
                              </div> 
                              {p.email}
                            </div>
                          )}
                          <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-500 tracking-tight">
                            <div className="w-7 h-7 bg-white shadow-sm rounded-xl flex items-center justify-center text-slate-400 group-hover:text-emerald group-hover:shadow-glow-emerald transition-all">
                              <Phone size={13} strokeWidth={2.5} />
                            </div>
                            {p.telephone}
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-50/80 rounded-2xl border border-slate-200/50 w-fit">
                          <Hash size={13} className="text-slate-300" />
                          <span className="text-xs font-black text-slate-600 uppercase tracking-widest">
                            {p.num_dossier}
                          </span>
                        </div>
                      </td>

                      <td className="px-8 py-6">
                        <Badge variant={statusColor(p.statut)}>{p.statut}</Badge>
                      </td>

                      <td className="px-8 py-6 text-right">
                        <div
                          className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(`/patients/${p.id}`)}
                            className="w-11 h-11 flex items-center justify-center bg-white shadow-soft rounded-2xl text-slate-400 hover:text-purple hover:shadow-glow transition-all border border-slate-100"
                          >
                            <ExternalLink size={20} strokeWidth={2.5} />
                          </motion.button>
                           <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(`/chat`, { state: { contactId: p.id, contact: { id: p.id, prenom: p.prenom, nom: p.nom, role: 'patient', photo_url: p.photo_url } } })}
                            className="w-11 h-11 flex items-center justify-center bg-white shadow-soft rounded-2xl text-slate-400 hover:text-indigo hover:shadow-glow-indigo transition-all border border-slate-100"
                          >
                            <MessageSquare size={20} strokeWidth={2.5} />
                          </motion.button>
                          <motion.button 
                             whileHover={{ scale: 1.1 }}
                             className="w-11 h-11 flex items-center justify-center bg-white shadow-soft rounded-2xl text-slate-400 hover:text-slate-700 transition-all border border-slate-100"
                          >
                            <MoreVertical size={20} strokeWidth={2.5} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {patients.length === 0 && (
              <div className="text-center py-32 mt-8">
                <div className="relative inline-block mb-8">
                   <div className="w-32 h-32 bg-gradient-to-br from-purple/10 to-indigo/10 rounded-[3rem] flex items-center justify-center border border-purple/10">
                     <Search size={54} strokeWidth={1.5} className="text-slate-300" />
                   </div>
                   <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-2xl shadow-glow flex items-center justify-center text-purple">
                      <Sparkles size={24} />
                   </div>
                </div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">{t('patients.no_patients')}</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-4 font-medium leading-relaxed">
                  {t('patients.no_patients_desc')}
                </p>
                <Button icon={Plus} className="mt-10 px-12 h-16 shadow-glow" onClick={() => setShowModal(true)}>
                  {t('patients.add')}
                </Button>
              </div>
            )}

            {pagination.pages > 1 && (
              <div className="flex flex-col md:flex-row items-center justify-between mt-12 pt-10 border-t border-slate-100/50 gap-6">
                <p className="text-sm font-black text-slate-400 uppercase tracking-[0.15em]">
                  Page <span className="text-purple mx-1">{pagination.page}</span> <span className="text-slate-200">/</span> {pagination.pages} 
                  <span className="mx-4 text-slate-200 opacity-30">|</span> 
                  <span className="text-slate-700">{pagination.total}</span> {pagination.total > 1 ? 'patients' : 'patient'}
                </p>
                <div className="flex gap-4 items-center">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => fetchPatients(pagination.page - 1, searchTerm)}
                    disabled={pagination.page === 1}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-100 shadow-soft text-slate-400 hover:text-purple hover:border-purple/50 transition-all disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronLeft size={22} strokeWidth={3} />
                  </motion.button>
                  <div className="flex gap-2">
                    {[...Array(pagination.pages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => fetchPatients(i + 1, searchTerm)}
                        className={`w-12 h-12 flex items-center justify-center rounded-2xl font-black text-sm transition-all ${
                          pagination.page === i + 1 
                            ? 'bg-gradient-to-br from-purple to-[#9b82ff] text-white shadow-glow border-none' 
                            : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => fetchPatients(pagination.page + 1, searchTerm)}
                    disabled={pagination.page === pagination.pages}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-100 shadow-soft text-slate-400 hover:text-purple hover:border-purple/50 transition-all disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronRight size={22} strokeWidth={3} />
                  </motion.button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Patients;
