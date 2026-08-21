import React, { useEffect, useState } from 'react';
import { 
  Users, Shield, ShieldCheck, FileSpreadsheet, Activity, 
  ArrowRight, Key, Ban, UserCheck, AlertCircle, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      setError('Impossible de charger les statistiques d\'administration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getRoleCount = (roleName) => {
    return stats?.roles?.find(r => r.role === roleName)?.count || 0;
  };

  const getActiveCount = (isActive) => {
    return stats?.status?.find(s => s.actif === (isActive ? 1 : 0))?.count || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Console d'Administration</h1>
        <p className="text-slate-500 mt-1">Supervisez la plateforme, gérez les rôles, permissions et consultez les journaux d'audit de sécurité.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-3xl flex items-center gap-3">
          <AlertCircle size={20} />
          <span className="text-sm font-semibold">{error}</span>
          <button onClick={fetchStats} className="ml-auto flex items-center gap-1 text-xs underline font-bold">
            <RefreshCw size={12} /> Réessayer
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Médecins', count: getRoleCount('medecin'), color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20', icon: UserCheck },
          { title: 'Secrétaires', count: getRoleCount('secretaire'), color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20', icon: Users },
          { title: 'Administrateurs', count: getRoleCount('admin'), color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/20', icon: Shield },
          { title: 'Comptes Actifs', count: getActiveCount(true), color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20', icon: ShieldCheck },
        ].map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card p-6 flex items-center justify-between"
          >
            <div>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{card.title}</p>
              <h3 className="text-3xl font-black text-slate-800 mt-2">{card.count}</h3>
            </div>
            <div className={`p-4 rounded-2xl ${card.color}`}>
              <card.icon size={24} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Audit Logs */}
        <div className="lg:col-span-2 glass-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Activity size={18} className="text-primary" />
              Journal d'audit récent
            </h2>
            <Link to="/admin/audit-logs" className="text-primary text-xs font-bold hover:underline flex items-center gap-1">
              Tout voir <ArrowRight size={14} />
            </Link>
          </div>

          <div className="space-y-4">
            {stats?.recentLogs && stats.recentLogs.length > 0 ? (
              stats.recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors text-sm">
                  <div className={`p-2 rounded-xl bg-slate-100 text-slate-600`}>
                    <Shield size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800">
                      {log.prenom} {log.nom} <span className="font-normal text-slate-500">a exécuté</span> {log.action}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">Sur la table : {log.entite}</p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-center py-6 text-sm">Aucun log récent à afficher.</p>
            )}
          </div>
        </div>

        {/* Admin Quick Actions */}
        <div className="glass-card p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Key size={18} className="text-primary" />
              Raccourcis Admin
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            <Link to="/admin/users" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-primary/5 hover:text-primary rounded-2xl transition-all font-semibold text-sm text-slate-700">
              Gérer les Utilisateurs <ArrowRight size={16} />
            </Link>
            <Link to="/admin/roles" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-primary/5 hover:text-primary rounded-2xl transition-all font-semibold text-sm text-slate-700">
              Gérer les Rôles et Permissions <ArrowRight size={16} />
            </Link>
            <Link to="/admin/audit-logs" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-primary/5 hover:text-primary rounded-2xl transition-all font-semibold text-sm text-slate-700">
              Journaux de Sécurité <ArrowRight size={16} />
            </Link>
            <Link to="/admin/permissions" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-primary/5 hover:text-primary rounded-2xl transition-all font-semibold text-sm text-slate-700">
              Registre des Permissions <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
