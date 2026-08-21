import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Loader2, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import Input from '../../components/common/Input';

const AdminPermissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchPermissions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/permissions');
      setPermissions(res.data.permissions || []);
    } catch (err) {
      setError('Impossible de charger le registre des permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const filtered = permissions.filter(p => 
    `${p.name} ${p.resource} ${p.action} ${p.description}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Registre des Permissions</h1>
        <p className="text-slate-500 mt-1">Registre global des permissions d'accès et habilitations système disponibles.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-3xl flex items-center gap-2">
          <AlertCircle size={18} />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {/* Search bar */}
      <div className="w-full max-w-md">
        <Input 
          placeholder="Rechercher une permission, ressource ou action..." 
          icon={Search}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Permissions Registry list */}
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
                  <th className="px-6 py-4 text-left">ID</th>
                  <th className="px-6 py-4 text-left">Permission</th>
                  <th className="px-6 py-4 text-left">Ressource</th>
                  <th className="px-6 py-4 text-left">Action</th>
                  <th className="px-6 py-4 text-left">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-400">#{p.id}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/60 font-semibold">
                        {p.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700 capitalize">{p.resource}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-600 capitalize">{p.action}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{p.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <ShieldCheck size={48} className="mx-auto mb-3 text-slate-200" />
                <p className="text-slate-400 text-sm font-semibold">Aucune permission trouvée dans le registre.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPermissions;
