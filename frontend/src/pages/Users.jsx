import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Search, Shield, Briefcase, UserCheck,
  ToggleLeft, ToggleRight, Trash2, Eye, Loader2, X, AlertCircle
} from 'lucide-react';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// ─── Modal Ajout Utilisateur ──────────────────────────────────────────────────
const AddUserModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    prenom: '', nom: '', email: '', mot_de_passe: '',
    role: 'secretaire', telephone: '',
    specialite_id: '', num_ordre: '',
  });
  const [specialites, setSpecialites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get('/users/specialites').then(r => setSpecialites(r.data.specialites)).catch(() => {});
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/auth/signup', form);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">Nouvel utilisateur</h2>
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

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email *</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Mot de passe *</label>
            <input type="password" name="mot_de_passe" value={form.mot_de_passe} onChange={handleChange} required
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Rôle *</label>
            <select name="role" value={form.role} onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="secretaire">Secrétaire</option>
              <option value="medecin">Médecin</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {form.role === 'medecin' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Spécialité *</label>
                <select name="specialite_id" value={form.specialite_id} onChange={handleChange} required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="">Sélectionner...</option>
                  {specialites.map(s => <option key={s.id} value={s.id}>{s.libelle}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">N° Ordre *</label>
                <input name="num_ordre" value={form.num_ordre} onChange={handleChange} required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Téléphone</label>
            <input name="telephone" value={form.telephone} onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1 border border-slate-200" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1" isLoading={loading}>
              Créer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Page Principale ──────────────────────────────────────────────────────────
const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.users);
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggle = async (id) => {
    try {
      await api.patch(`/users/${id}/toggle`);
      fetchUsers();
    } catch { }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch { }
  };

  const roleIcon = (role) => {
    if (role === 'admin')      return <Shield size={14} className="text-purple-500" />;
    if (role === 'medecin')    return <UserCheck size={14} className="text-blue-500" />;
    if (role === 'secretaire') return <Briefcase size={14} className="text-amber-500" />;
  };

  const roleColor = (role) => {
    if (role === 'admin')      return 'bg-purple-50 text-purple-700';
    if (role === 'medecin')    return 'bg-blue-50 text-blue-700';
    if (role === 'secretaire') return 'bg-amber-50 text-amber-700';
    return 'bg-slate-50 text-slate-700';
  };

  const filtered = users.filter(u =>
    `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  // Seul l'admin peut accéder
  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield size={48} className="text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-700">Accès réservé aux administrateurs</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showModal && (
        <AddUserModal
          onClose={() => setShowModal(false)}
          onSuccess={fetchUsers}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Gestion des Utilisateurs</h1>
          <p className="text-slate-500 mt-1">{users.length} utilisateur{users.length > 1 ? 's' : ''} enregistré{users.length > 1 ? 's' : ''}</p>
        </div>
        <Button icon={Plus} onClick={() => setShowModal(true)}>
          Ajouter un utilisateur
        </Button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Médecins',    count: users.filter(u => u.role === 'medecin').length,    color: 'bg-blue-50 text-blue-700' },
          { label: 'Secrétaires', count: users.filter(u => u.role === 'secretaire').length, color: 'bg-amber-50 text-amber-700' },
          { label: 'Admins',      count: users.filter(u => u.role === 'admin').length,      color: 'bg-purple-50 text-purple-700' },
        ].map(s => (
          <div key={s.label} className={`p-4 rounded-2xl ${s.color} text-center`}>
            <p className="text-2xl font-black">{s.count}</p>
            <p className="text-sm font-semibold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="mb-6">
          <Input placeholder="Rechercher par nom ou email..."
            icon={Search} value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-left rounded-l-xl">Utilisateur</th>
                  <th className="px-6 py-4 text-left">Rôle</th>
                  <th className="px-6 py-4 text-left">Téléphone</th>
                  <th className="px-6 py-4 text-left">Statut</th>
                  <th className="px-6 py-4 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
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
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${roleColor(u.role)}`}>
                        {roleIcon(u.role)} {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {u.telephone || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={u.actif ? 'success' : 'error'}>
                        {u.actif ? 'Actif' : 'Inactif'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Toggle actif/inactif */}
                        {currentUser.id !== u.id && (
                          <button onClick={() => handleToggle(u.id)}
                            className={`p-2 rounded-lg transition-all ${
                              u.actif
                                ? 'text-green-500 hover:bg-green-50'
                                : 'text-slate-400 hover:bg-slate-100'
                            }`}
                            title={u.actif ? 'Désactiver' : 'Activer'}>
                            {u.actif ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          </button>
                        )}
                        {/* Supprimer */}
                        {currentUser.id !== u.id && (
                          <button onClick={() => handleDelete(u.id)}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                            title="Supprimer">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <Users size={40} className="mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500 text-sm">Aucun utilisateur trouvé</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;