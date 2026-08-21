import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Search, Loader2, AlertCircle, Calendar, RefreshCw, Eye, ArrowRight, ArrowLeft, X } from 'lucide-react';
import api from '../../services/api';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

// ─── Modal Details Audit ─────────────────────────────────────────────────────
const LogDetailsModal = ({ log, onClose }) => {
  const formatJSON = (val) => {
    if (!val) return 'Aucune donnée';
    try {
      const parsed = typeof val === 'string' ? JSON.parse(val) : val;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return String(val);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 p-6 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-800">Détails de l'action d'audit</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-sm custom-scrollbar">
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl">
            <div>
              <p className="text-xs font-semibold text-slate-400">Action</p>
              <p className="font-bold text-slate-800 mt-0.5">{log.action}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Cible (Entité)</p>
              <p className="font-bold text-slate-700 mt-0.5">{log.entite} (#{log.entite_id || 'N/A'})</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Acteur (IP)</p>
              <p className="font-bold text-slate-700 mt-0.5">{log.adresse_ip || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Date et Heure</p>
              <p className="font-bold text-slate-700 mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 mb-1">User Agent</p>
            <p className="p-3 bg-slate-50 rounded-xl font-mono text-[11px] text-slate-600 border border-slate-100">
              {log.user_agent || 'N/A'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1">Anciennes Valeurs</p>
              <pre className="p-3 bg-slate-50 rounded-xl font-mono text-[11px] text-slate-600 border border-slate-100 overflow-x-auto max-h-48 custom-scrollbar">
                {formatJSON(log.anciennes_valeurs)}
              </pre>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1">Nouvelles Valeurs</p>
              <pre className="p-3 bg-slate-50 rounded-xl font-mono text-[11px] text-slate-600 border border-slate-100 overflow-x-auto max-h-48 custom-scrollbar">
                {formatJSON(log.nouvelles_valeurs)}
              </pre>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex-shrink-0 text-right">
          <Button onClick={onClose} variant="ghost" className="border border-slate-200">
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Main AdminAuditLogs Component ──────────────────────────────────────────
const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actor, setActor] = useState('');
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);
  const [error, setError] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/audit-logs', {
        params: { actor, action, entity, startDate, endDate, page, limit: 15 }
      });
      setLogs(res.data.logs || []);
      setPages(res.data.pages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError('Impossible de charger les journaux d\'audit.');
    } finally {
      setLoading(false);
    }
  }, [actor, action, entity, startDate, endDate, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [actor, action, entity, startDate, endDate]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Logs d'Audit</h1>
        <p className="text-slate-500 mt-1">Journalisation immuable des activités d'administration et de sécurité système.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-3xl flex items-center gap-2">
          <AlertCircle size={18} />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-100 space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Filtres de recherche</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Input
            placeholder="Nom/Email Acteur..."
            icon={Search}
            value={actor}
            onChange={e => setActor(e.target.value)}
          />
          <select
            value={action}
            onChange={e => setAction(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-semibold text-slate-700 shadow-soft"
          >
            <option value="">Toutes les actions</option>
            <option value="USER_CREATED">USER_CREATED</option>
            <option value="USER_UPDATED">USER_UPDATED</option>
            <option value="USER_DELETED">USER_DELETED</option>
            <option value="USER_SUSPENDED">USER_SUSPENDED</option>
            <option value="USER_ACTIVATED">USER_ACTIVATED</option>
            <option value="ROLE_ASSIGNED">ROLE_ASSIGNED</option>
            <option value="ROLE_UPDATED">ROLE_UPDATED</option>
            <option value="PASSWORD_RESET">PASSWORD_RESET</option>
          </select>
          <select
            value={entity}
            onChange={e => setEntity(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-semibold text-slate-700 shadow-soft"
          >
            <option value="">Toutes les entités</option>
            <option value="utilisateurs">utilisateurs</option>
            <option value="roles">roles</option>
          </select>
          <div className="flex items-center gap-2 border border-slate-200 px-3 py-2 rounded-2xl bg-white shadow-soft">
            <Calendar size={16} className="text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-transparent focus:outline-none text-xs font-semibold text-slate-700"
              title="Date de début"
            />
          </div>
          <div className="flex items-center gap-2 border border-slate-200 px-3 py-2 rounded-2xl bg-white shadow-soft">
            <Calendar size={16} className="text-slate-400" />
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-transparent focus:outline-none text-xs font-semibold text-slate-700"
              title="Date de fin"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
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
                  <th className="px-6 py-4 text-left">Horodatage</th>
                  <th className="px-6 py-4 text-left">Action</th>
                  <th className="px-6 py-4 text-left">Acteur (Rôle)</th>
                  <th className="px-6 py-4 text-left">Entité ciblée</th>
                  <th className="px-6 py-4 text-left">Adresse IP</th>
                  <th className="px-6 py-4 text-right">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {log.actor_prenom ? (
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{log.actor_prenom} {log.actor_nom}</p>
                          <p className="text-xs text-slate-400">{log.actor_email} ({log.actor_role})</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Système</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span className="font-semibold capitalize">{log.entite}</span> 
                      {log.entite_id && <span className="text-xs text-slate-400 ml-1">#{log.entite_id}</span>}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">
                      {log.adresse_ip || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-xl transition-all"
                        title="Voir les valeurs modifiées"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {logs.length === 0 && (
              <div className="text-center py-16">
                <FileText size={48} className="mx-auto mb-3 text-slate-200" />
                <p className="text-slate-400 text-sm font-semibold">Aucun log correspondant aux filtres.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-soft">
          <p className="text-xs font-bold text-slate-500">
            Affichage de {logs.length} sur {total} logs
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              icon={ArrowLeft}
              className="border border-slate-200 text-slate-600 py-1.5 px-3"
            >
              Précédent
            </Button>
            <Button
              variant="ghost"
              disabled={page === pages}
              onClick={() => setPage(p => Math.min(p + 1, pages))}
              icon={ArrowRight}
              className="border border-slate-200 text-slate-600 py-1.5 px-3 flex-row-reverse"
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      {selectedLog && (
        <LogDetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
};

export default AdminAuditLogs;
