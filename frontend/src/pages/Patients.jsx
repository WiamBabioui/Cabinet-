import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, MoreVertical, ExternalLink,
  Phone, Mail, ChevronLeft, ChevronRight,
  Loader2, AlertCircle, X
} from 'lucide-react';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">{t('patients.modal.title')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} /></button>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{t('patients.modal.firstname')}</label>
              <input name="prenom" value={form.prenom} onChange={handleChange} required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{t('patients.modal.lastname')}</label>
              <input name="nom" value={form.nom} onChange={handleChange} required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{t('patients.modal.birthdate')}</label>
              <input type="date" name="date_naissance" value={form.date_naissance} onChange={handleChange} required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{t('patients.modal.gender')}</label>
              <select name="sexe" value={form.sexe} onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="M">{t('dashboard.genders.m')}</option>
                <option value="F">{t('dashboard.genders.f')}</option>
                <option value="Autre">{t('dashboard.genders.other')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{t('patients.modal.phone')}</label>
            <input name="telephone" value={form.telephone} onChange={handleChange} required
              placeholder="+212 6XX XXX XXX"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{t('patients.modal.email') || 'Email'}</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{t('patients.modal.cin')}</label>
              <input name="cin" value={form.cin} onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{t('patients.modal.blood_group')}</label>
              <select name="groupe_sanguin" value={form.groupe_sanguin} onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">-</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{t('patients.modal.city')}</label>
              <input name="adresse_ville" value={form.adresse_ville} onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{t('patients.modal.insurance')}</label>
            <input name="assurance_nom" value={form.assurance_nom} onChange={handleChange}
              placeholder="CNSS, CNOPS, Mutuelle..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1 border border-slate-200" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1" isLoading={loading}>
              {t('patients.modal.create')}
            </Button>
          </div>
        </form>
      </div>
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
    <div className="space-y-6">
      {showModal && (
        <AddPatientModal
          onClose={() => setShowModal(false)}
          onSuccess={() => fetchPatients(1, searchTerm)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t('patients.title')}</h1>
          <p className="text-slate-500 mt-1">
            {pagination.total > 1 
              ? t('patients.subtitle_plural', { count: pagination.total }) 
              : t('patients.subtitle', { count: pagination.total })}
          </p>
        </div>
        <Button icon={Plus} onClick={() => setShowModal(true)}>
          {t('patients.add')}
        </Button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="mb-6">
          <Input
            placeholder={t('patients.search_placeholder')}
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 mb-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 text-left rounded-l-xl">{t('patients.table.patient')}</th>
                    <th className="px-6 py-4 text-left">{t('patients.table.contact')}</th>
                    <th className="px-6 py-4 text-left">{t('patients.table.file_num')}</th>
                    <th className="px-6 py-4 text-left">{t('patients.table.status')}</th>
                    <th className="px-6 py-4 text-right rounded-r-xl">{t('patients.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/patients/${p.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-lg">
                            {p.prenom.charAt(0)}{p.nom.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">{p.prenom} {p.nom}</h4>
                            <p className="text-xs text-slate-500">
                              {calcAge(p.date_naissance)} {i18n.language === 'ar' ? 'سنة' : 'ans'}
                              {' • '}
                              {p.sexe === 'M' ? t('dashboard.genders.m') : p.sexe === 'F' ? t('dashboard.genders.f') : t('dashboard.genders.other')}
                              {p.groupe_sanguin && ` • ${p.groupe_sanguin}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {p.email && (
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              <Mail size={12} className="text-slate-400" /> {p.email}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Phone size={12} className="text-slate-400" /> {p.telephone}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                          {p.num_dossier}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <Badge variant={statusColor(p.statut)}>{p.statut}</Badge>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div
                          className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => navigate(`/patients/${p.id}`)}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                            title={t('common.view_details')}
                          >
                            <ExternalLink size={18} />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {patients.length === 0 && (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <Search size={40} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">{t('patients.no_patients')}</h3>
                <p className="text-slate-500 max-w-xs mx-auto mt-1">
                  {t('patients.no_patients_desc')}
                </p>
                <Button icon={Plus} className="mt-4" onClick={() => setShowModal(true)}>
                  {t('patients.add')}
                </Button>
              </div>
            )}

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  Page {pagination.page} / {pagination.pages} ({pagination.total} {pagination.total > 1 ? 'patients' : 'patient'})
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchPatients(pagination.page - 1, searchTerm)}
                    disabled={pagination.page === 1}
                    className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => fetchPatients(pagination.page + 1, searchTerm)}
                    disabled={pagination.page === pagination.pages}
                    className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                  >
                    <ChevronRight size={18} />
                  </button>
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