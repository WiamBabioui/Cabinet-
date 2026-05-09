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
import { useTranslation } from 'react-i18next';

// ─── Modal Ajout Utilisateur ──────────────────────────────────────────────────
const AddUserModal = ({ onClose, onSuccess }) => {
  const { t } = useTranslation();
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
      setError(err.response?.data?.message || t('users.modal.error'));
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">{t('users.modal.title')}</h2>
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
              <label className="block text-xs font-semibold text-slate-600 mb-1">{t('users.modal.firstname')}</label>
              <input name="prenom" value={form.prenom} onChange={handleChange} required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{t('users.modal.lastname')}</label>
              <input name="nom" value={form.nom} onChange={handleChange} required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{t('users.modal.email')}</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{t('users.modal.password')}</label>
            <input type="password" name="mot_de_passe" value={form.mot_de_passe} onChange={handleChange} required
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{t('users.modal.role')}</label>
            <select name="role" value={form.role} onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="secretaire">{t('roles.secretaire')}</option>
              <option value="medecin">{t('roles.medecin')}</option>
              <option value="admin">{t('roles.admin')}</option>
            </select>
          </div>

          {form.role === 'medecin' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('users.modal.specialty')}</label>
                <select name="specialite_id" value={form.specialite_id} onChange={handleChange} required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="">{t('users.modal.specialty_select')}</option>
                  {specialites.map(s => <option key={s.id} value={s.id}>{s.libelle}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('users.modal.order_num')}</label>
                <input name="num_ordre" value={form.num_ordre} onChange={handleChange} required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{t('users.modal.phone')}</label>
            <input name="telephone" value={form.telephone} onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1 border border-slate-200" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1" isLoading={loading}>
              {t('users.modal.create')}
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
  const { t } = useTranslation();
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
    if (!window.confirm(t('users.actions.delete_confirm'))) return;
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
          <h2 className="text-xl font-bold text-slate-700">{t('users.access_denied')}</h2>
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
          <h1 className="text-3xl font-bold text-slate-800">{t('users.title')}</h1>
          <p className="text-slate-500 mt-1">
            {users.length > 1 
              ? t('users.subtitle_plural', { count: users.length }) 
              : t('users.subtitle', { count: users.length })}
          </p>
        </div>
        <Button icon={Plus} onClick={() => setShowModal(true)}>
          {t('users.add')}
        </Button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t('roles.medecin'),    count: users.filter(u => u.role === 'medecin').length,    color: 'bg-blue-50 text-blue-700' },
          { label: t('roles.secretaire'), count: users.filter(u => u.role === 'secretaire').length, color: 'bg-amber-50 text-amber-700' },
          { label: t('roles.admin'),      count: users.filter(u => u.role === 'admin').length,      color: 'bg-purple-50 text-purple-700' },
        ].map(s => (
          <div key={s.label} className={`p-4 rounded-2xl ${s.color} text-center`}>
            <p className="text-2xl font-black">{s.count}</p>
            <p className="text-sm font-semibold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="mb-6">
          <Input placeholder={t('users.search_placeholder')}
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
                  <th className="px-6 py-4 text-left rounded-l-xl">{t('users.table.user')}</th>
                  <th className="px-6 py-4 text-left">{t('users.table.role')}</th>
                  <th className="px-6 py-4 text-left">{t('users.table.phone')}</th>
                  <th className="px-6 py-4 text-left">{t('users.table.status')}</th>
                  <th className="px-6 py-4 text-right rounded-r-xl">{t('users.table.actions')}</th>
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
                        {roleIcon(u.role)} {t(`roles.${u.role}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {u.telephone || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={u.actif ? 'success' : 'error'}>
                        {u.actif ? t('users.status.active') : t('users.status.inactive')}
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
                            title={u.actif ? t('users.actions.deactivate') : t('users.actions.activate')}>
                            {u.actif ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          </button>
                        )}
                        {/* Supprimer */}
                        {currentUser.id !== u.id && (
                          <button onClick={() => handleDelete(u.id)}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                            title={t('users.actions.delete')}>
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
                <p className="text-slate-500 text-sm">{t('users.no_users')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;