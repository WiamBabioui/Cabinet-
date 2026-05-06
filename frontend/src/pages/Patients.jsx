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

// ─── Modal Ajout Patient ──────────────────────────────────────────────────────
const AddPatientModal = ({ onClose, onSuccess }) => {
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
      setError(err.response?.data?.message || 'Erreur lors de la création');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">Nouveau Patient</h2>
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
              <label className="block text-xs font-semibold text-slate-600 mb-1">Prénom *</label>
              <input name="prenom" value={form.prenom} onChange={handleChange} required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nom *</label>
              <input name="nom" value={form.nom} onChange={handleChange} required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date de naissance *</label>
              <input type="date" name="date_naissance" value={form.date_naissance} onChange={handleChange} required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Sexe *</label>
              <select name="sexe" value={form.sexe} onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Téléphone *</label>
            <input name="telephone" value={form.telephone} onChange={handleChange} required
              placeholder="+212 6XX XXX XXX"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">CIN</label>
              <input name="cin" value={form.cin} onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Groupe sanguin</label>
              <select name="groupe_sanguin" value={form.groupe_sanguin} onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">-</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Ville</label>
              <input name="adresse_ville" value={form.adresse_ville} onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Assurance</label>
            <input name="assurance_nom" value={form.assurance_nom} onChange={handleChange}
              placeholder="CNSS, CNOPS, Mutuelle..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1 border border-slate-200" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1" isLoading={loading}>
              Créer le patient
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
      setError('Impossible de charger les patients');
    } finally { setLoading(false); }
  }, []);

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
          <h1 className="text-3xl font-bold text-slate-800">Répertoire Patients</h1>
          <p className="text-slate-500 mt-1">
            {pagination.total} patient{pagination.total > 1 ? 's' : ''} enregistré{pagination.total > 1 ? 's' : ''}
          </p>
        </div>
        <Button icon={Plus} onClick={() => setShowModal(true)}>
          Ajouter un patient
        </Button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="mb-6">
          <Input
            placeholder="Rechercher par nom, email ou téléphone..."
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
                    <th className="px-6 py-4 text-left rounded-l-xl">Patient</th>
                    <th className="px-6 py-4 text-left">Contact</th>
                    <th className="px-6 py-4 text-left">N° Dossier</th>
                    <th className="px-6 py-4 text-left">Statut</th>
                    <th className="px-6 py-4 text-right rounded-r-xl">Actions</th>
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
                              {calcAge(p.date_naissance)} ans
                              {' • '}
                              {p.sexe === 'M' ? 'Homme' : p.sexe === 'F' ? 'Femme' : 'Autre'}
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
                            title="Voir le dossier"
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
                <h3 className="text-lg font-bold text-slate-800">Aucun patient trouvé</h3>
                <p className="text-slate-500 max-w-xs mx-auto mt-1">
                  Essayez d'autres termes de recherche ou ajoutez un nouveau patient.
                </p>
                <Button icon={Plus} className="mt-4" onClick={() => setShowModal(true)}>
                  Ajouter un patient
                </Button>
              </div>
            )}

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  Page {pagination.page} sur {pagination.pages} ({pagination.total} patients)
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