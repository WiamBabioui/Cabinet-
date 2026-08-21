import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Loader2, Save, CheckSquare, Square, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import { motion } from 'framer-motion';

const AdminRoles = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('medecin');
  const [permissions, setPermissions] = useState([]);
  const [rolePermIds, setRolePermIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchData = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/admin/roles'),
        api.get('/admin/permissions')
      ]);
      setRoles(rolesRes.data.roles || []);
      setPermissions(permsRes.data.permissions || []);
      
      // Load current role permissions
      const rolePermsRes = await api.get(`/admin/roles/${selectedRole}/permissions`);
      setRolePermIds(rolePermsRes.data.permissions.map(p => p.id));
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors du chargement des données RBAC.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedRole]);

  // Handle checking / unchecking permission
  const handleCheckboxToggle = (permId) => {
    if (selectedRole === 'admin') return; // Admin permissions locked
    setRolePermIds(prev => 
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    );
  };

  const handleSave = async () => {
    if (selectedRole === 'admin') return;
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await api.put(`/admin/roles/${selectedRole}/permissions`, { permissions: rolePermIds });
      setMessage({ type: 'success', text: 'Permissions mises à jour avec succès.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur lors de la sauvegarde.' });
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by resource for easier matrix layout
  const permissionsByResource = permissions.reduce((groups, perm) => {
    const res = perm.resource;
    if (!groups[res]) groups[res] = [];
    groups[res].push(perm);
    return groups;
  }, {});

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Rôles et Permissions</h1>
        <p className="text-slate-500 mt-1">Configurez la matrice des droits et permissions par rôle utilisateur.</p>
      </div>

      {message.text && (
        <div className={`p-4 border rounded-3xl flex items-center gap-3 text-sm font-semibold ${
          message.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}>
          <AlertCircle size={18} />
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Roles List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Rôles</h3>
            {roles.map(r => (
              <button
                key={r.role}
                onClick={() => setSelectedRole(r.role)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left font-bold ${
                  selectedRole === r.role
                    ? 'bg-primary/5 text-primary border-primary/20 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
                }`}
              >
                <span className="capitalize">{r.role}</span>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg">
                  {r.user_count} utilisateurs
                </span>
              </button>
            ))}
          </div>

          {/* Permissions Matrix */}
          <div className="lg:col-span-3 glass-card p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Shield size={18} className="text-primary" />
                  Permissions pour le rôle <span className="capitalize text-primary">"{selectedRole}"</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">Cochez les droits que vous souhaitez affecter à ce rôle.</p>
              </div>

              {selectedRole !== 'admin' && (
                <Button icon={Save} isLoading={saving} onClick={handleSave}>
                  Sauvegarder
                </Button>
              )}
            </div>

            {selectedRole === 'admin' && (
              <div className="p-4 bg-purple-50 border border-purple-100 text-purple-700 rounded-2xl flex items-start gap-3 text-xs">
                <ShieldAlert size={18} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Permissions Administrateur Verrouillées</p>
                  <p className="mt-1">Le rôle administrateur dispose toujours de tous les droits et privilèges d'accès dans l'application pour des raisons de sécurité.</p>
                </div>
              </div>
            )}

            <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {Object.entries(permissionsByResource).map(([resource, perms]) => (
                <div key={resource} className="py-4 first:pt-0 last:pb-0">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{resource}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {perms.map(p => {
                      const isChecked = rolePermIds.includes(p.id) || selectedRole === 'admin';
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleCheckboxToggle(p.id)}
                          className={`flex items-start gap-3 p-3 rounded-2xl transition-all border ${
                            isChecked
                              ? 'bg-slate-50/50 border-slate-200/60 text-slate-800'
                              : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50/50'
                          } ${selectedRole === 'admin' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className="mt-0.5">
                            {isChecked ? (
                              <CheckSquare size={18} className="text-primary" />
                            ) : (
                              <Square size={18} className="text-slate-300" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{p.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{p.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRoles;
