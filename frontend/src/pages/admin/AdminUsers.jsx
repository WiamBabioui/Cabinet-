import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Search, Shield, Briefcase, UserCheck, Key,
  ToggleLeft, ToggleRight, Trash2, Loader2, X, AlertCircle, RefreshCw,
  Mail, Phone, Lock, EyeOff, ShieldAlert, Check, CheckSquare
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Modal Reset Password ───────────────────────────────────────────────────
const ResetPasswordModal = ({ user, onClose }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post(`/admin/users/${user.id}/reset-password`, { nouveau_mdp: password });
      setSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la réinitialisation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">Réinitialiser le mot de passe</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} /></button>
        </div>

        {success ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <Check size={24} />
            </div>
            <p className="text-sm font-bold text-slate-800">Mot de passe réinitialisé avec succès !</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}
            <p className="text-xs text-slate-500">Pour <strong>{user.prenom} {user.nom}</strong> ({user.email})</p>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Minimum 6 caractères"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" className="flex-1 border border-slate-200" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" className="flex-1" isLoading={loading}>
                Enregistrer
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ─── Modal User (Add / Edit) ────────────────────────────────────────────────
const UserModal = ({ user, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    prenom: user?.prenom || '',
    nom: user?.nom || '',
    email: user?.email || '',
    mot_de_passe: '',
    role: user?.role || 'patient',
    telephone: user?.telephone || '',
    actif: user ? (user.actif ? 1 : 0) : 1,
    specialite_id: user?.specialite_id || '',
    num_ordre: user?.num_ordre || '',
    assigned_doctor_id: user?.assigned_doctor_id || ''
  });
  const [specialites, setSpecialites] = useState([]);
  const [medecins, setMedecins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users/specialites').then(r => setSpecialites(r.data.specialites)).catch(() => {});
    api.get('/users/medecins-list').then(r => setMedecins(r.data.medecins)).catch(() => {});
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (user) {
        await api.put(`/admin/users/${user.id}`, form);
      } else {
        await api.post('/admin/users', form);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">
            {user ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
          </h2>
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
              <label className="block text-xs font-semibold text-slate-600 mb-1">Prénom</label>
              <input name="prenom" value={form.prenom} onChange={handleChange} required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nom</label>
              <input name="nom" value={form.nom} onChange={handleChange} required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          {!user && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mot de passe</label>
              <input type="password" name="mot_de_passe" value={form.mot_de_passe} onChange={handleChange} required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Rôle</label>
            <select name="role" value={form.role} onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="patient">Patient</option>
              <option value="secretaire">Secrétaire</option>
              <option value="medecin">Médecin</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>

          {form.role === 'medecin' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Spécialité</label>
                <select name="specialite_id" value={form.specialite_id} onChange={handleChange} required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
                  <option value="">Sélectionner</option>
                  {specialites.map(s => <option key={s.id} value={s.id}>{s.libelle}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Numéro d'ordre</label>
                <input name="num_ordre" value={form.num_ordre} onChange={handleChange} required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white" />
              </div>
            </div>
          )}

          {(form.role === 'patient' || form.role === 'secretaire') && (
            <div className="p-3 bg-slate-50 rounded-2xl">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Médecin assigné (Requis)</label>
              <select name="assigned_doctor_id" value={form.assigned_doctor_id} onChange={handleChange} required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
                <option value="">Sélectionner un médecin</option>
                {medecins.map(m => (
                  <option key={m.id} value={m.id}>
                    Dr. {m.prenom} {m.nom} ({m.specialite})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Téléphone</label>
            <input name="telephone" value={form.telephone} onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          {user && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Statut du compte</label>
              <select name="actif" value={form.actif} onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value={1}>Actif</option>
                <option value={0}>Suspendu / Inactif</option>
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1 border border-slate-200" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1" isLoading={loading}>
              Enregistrer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main AdminUsers Component ──────────────────────────────────────────────
const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalUser, setModalUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [resetPwdUser, setResetPwdUser] = useState(null);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/users', {
        params: { search, role: roleFilter, status: statusFilter, limit: 100 }
      });
      setUsers(res.data.users || []);
    } catch (err) {
      setError('Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleActive = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/toggle`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la modification du statut.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  const roleIcon = (role) => {
    if (role === 'admin') return <Shield size={14} className="text-purple-600" />;
    if (role === 'medecin') return <UserCheck size={14} className="text-blue-600" />;
    if (role === 'secretaire') return <Briefcase size={14} className="text-amber-600" />;
    return <Users size={14} className="text-slate-600" />;
  };

  const roleColor = (role) => {
    if (role === 'admin') return 'bg-purple-50 text-purple-700 border-purple-200';
    if (role === 'medecin') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (role === 'secretaire') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Utilisateurs</h1>
          <p className="text-slate-500 mt-1">Créez, modifiez, suspendez et gérez les comptes utilisateurs et l'affectation des médecins.</p>
        </div>
        <Button icon={Plus} onClick={() => setShowAddModal(true)} className="shadow-lg shadow-primary/20">
          Ajouter un utilisateur
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-3xl flex items-center gap-2">
          <AlertCircle size={18} />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          placeholder="Rechercher par nom, email..."
          icon={Search}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-semibold text-slate-700 shadow-soft"
        >
          <option value="">Tous les rôles</option>
          <option value="admin">Administrateur</option>
          <option value="medecin">Médecin</option>
          <option value="secretaire">Secrétaire</option>
          <option value="patient">Patient</option>
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-semibold text-slate-700 shadow-soft"
        >
          <option value="">Tous les statuts</option>
          <option value="1">Actif</option>
          <option value="0">Suspendu</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-xs font-black uppercase tracking-wider">
                  <th className="px-6 py-4 text-left">Utilisateur</th>
                  <th className="px-6 py-4 text-left">Rôle</th>
                  <th className="px-6 py-4 text-left">Affectation / Médecin</th>
                  <th className="px-6 py-4 text-left">Contact</th>
                  <th className="px-6 py-4 text-left">Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                    {/* User profile info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-sm">
                          {u.prenom?.charAt(0)}{u.nom?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{u.prenom} {u.nom}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role badge */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-xl text-xs font-bold uppercase tracking-wider ${roleColor(u.role)}`}>
                        {roleIcon(u.role)} {u.role === 'medecin' ? 'Médecin' : u.role === 'secretaire' ? 'Secrétaire' : u.role}
                      </span>
                    </td>

                    {/* Doctor assignment / Specialty info */}
                    <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                      {u.role === 'medecin' ? (
                        <span className="text-slate-400 italic text-xs">Praticien autonome</span>
                      ) : u.doctor_prenom ? (
                        <span>Dr. {u.doctor_prenom} {u.doctor_nom}</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Contact detail */}
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="space-y-0.5">
                        <p className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Phone size={12} /> {u.telephone || 'Non renseigné'}
                        </p>
                      </div>
                    </td>

                    {/* Active/suspended badge */}
                    <td className="px-6 py-4">
                      <Badge variant={u.actif ? 'success' : 'error'}>
                        {u.actif ? 'Actif' : 'Suspendu'}
                      </Badge>
                    </td>

                    {/* Administrative operations actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setResetPwdUser(u)}
                          title="Réinitialiser le mot de passe"
                          className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-xl transition-all"
                        >
                          <Lock size={16} />
                        </button>
                        <button
                          onClick={() => setModalUser(u)}
                          title="Modifier les détails"
                          className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-xl transition-all"
                        >
                          <UserCheck size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(u.id)}
                          title={u.actif ? 'Suspendre' : 'Activer'}
                          className={`p-2 rounded-xl transition-all ${
                            u.actif ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          {u.actif ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          title="Supprimer"
                          className="p-2 text-rose-400 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="text-center py-16">
                <Users size={48} className="mx-auto mb-3 text-slate-200" />
                <p className="text-slate-400 text-sm font-semibold">Aucun utilisateur trouvé.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals check */}
      {showAddModal && (
        <UserModal onClose={() => setShowAddModal(false)} onSuccess={fetchUsers} />
      )}
      {modalUser && (
        <UserModal user={modalUser} onClose={() => setModalUser(null)} onSuccess={fetchUsers} />
      )}
      {resetPwdUser && (
        <ResetPasswordModal user={resetPwdUser} onClose={() => setResetPwdUser(null)} />
      )}
    </div>
  );
};

export default AdminUsers;
