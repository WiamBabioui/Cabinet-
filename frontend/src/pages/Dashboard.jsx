import React, { useEffect, useState } from 'react';
import {
  Users, User, Calendar, Clock, TrendingUp,
  ArrowUpRight, ArrowDownRight, MoreHorizontal,
  Plus, Loader2, AlertCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import Card from '../components/dashboard/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [stats, setStats]   = useState(null);
  const [rdv, setRdv]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, rdvRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/rdv-today'),
        ]);
        setStats(statsRes.data);
        setRdv(rdvRes.data.rdv);
      } catch (err) {
        setError(t('common.error_loading'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700">
        <AlertCircle size={24} /> {error}
      </div>
    );
  }

  const kpis = [
    {
      title: t('dashboard.total_patients'),
      value: stats?.stats?.total_patients ?? 0,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: t('dashboard.today_appointments'),
      value: stats?.stats?.rdv_aujourd_hui ?? 0,
      icon: Calendar,
      color: 'bg-green-500',
    },
    {
      title: t('dashboard.active_doctors'),
      value: stats?.stats?.total_medecins ?? 0,
      icon: User,
      color: 'bg-amber-500',
    },
    {
      title: t('dashboard.new_this_month'),
      value: stats?.stats?.nouveaux_patients ?? 0,
      icon: TrendingUp,
      color: 'bg-primary',
    },
  ];

  const chartData = stats?.patients_par_mois?.map(m => ({
    name: m.label,
    value: m.total,
  })) || [];

  const statusBadge = (statut) => {
    const map = {
      planifie: 'info', confirme: 'success',
      en_cours: 'warning', termine: 'success',
      annule: 'error', absent: 'error',
    };
    return map[statut] || 'info';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t('dashboard.overview')}</h1>
          <p className="text-slate-500 mt-1">
            {t('dashboard.welcome', { name: user?.prenom })}
          </p>
        </div>
        <Button icon={Plus}>{t('dashboard.new_appointment')}</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="p-4 border-none shadow-premium bg-white">
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-2xl ${kpi.color} text-white`}>
                <kpi.icon size={24} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{kpi.title}</p>
              <h2 className="text-2xl font-black text-slate-800 mt-1">{kpi.value}</h2>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Graphique patients par mois */}
        <Card 
          title={t('dashboard.patient_evolution')} 
          subtitle={t('dashboard.patient_evolution_subtitle')} 
          className="lg:col-span-2"
        >
          <div className="h-80 w-full mt-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                {t('dashboard.no_data')}
              </div>
            )}
          </div>
        </Card>

        {/* Répartition par sexe */}
        <Card title={t('dashboard.patient_distribution')} subtitle={t('dashboard.patient_distribution_subtitle')}>
          <div className="space-y-4 mt-6">
            {stats?.repartition_sexe?.map((item) => {
              const total = stats.stats.total_patients || 1;
              const pct   = Math.round((item.total / total) * 100);
              const labelMap = {
                M: t('dashboard.genders.m'),
                F: t('dashboard.genders.f'),
                Autre: t('dashboard.genders.other')
              };
              const label = `${item.sexe === 'M' ? '👨' : item.sexe === 'F' ? '👩' : '🧑'} ${labelMap[item.sexe] || item.sexe}`;
              return (
                <div key={item.sexe}>
                  <div className="flex justify-between text-sm font-semibold text-slate-700 mb-2">
                    <span>{label}</span>
                    <span>{item.total} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {(!stats?.repartition_sexe || stats.repartition_sexe.length === 0) && (
              <p className="text-slate-400 text-sm text-center py-8">{t('dashboard.no_data')}</p>
            )}
          </div>
        </Card>
      </div>

      {/* RDV du jour */}
      <Card
        title={t('dashboard.appointments_today')}
        subtitle={t('dashboard.appointments_today_subtitle')}
        headerAction={<Button variant="ghost" size="sm" icon={MoreHorizontal}></Button>}
      >
        <div className="overflow-x-auto mt-4">
          {rdv.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Calendar size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t('dashboard.no_appointments')}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-left rounded-l-xl">{t('dashboard.table.patient')}</th>
                  <th className="px-6 py-4 text-left">{t('dashboard.table.time')}</th>
                  <th className="px-6 py-4 text-left">{t('dashboard.table.reason')}</th>
                  <th className="px-6 py-4 text-left">{t('dashboard.table.status')}</th>
                  <th className="px-6 py-4 text-right rounded-r-xl">{t('dashboard.table.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rdv.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">
                          {r.patient_nom.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-700 text-sm">{r.patient_nom}</p>
                          <p className="text-xs text-slate-400">{r.patient_telephone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                      {new Date(r.date_heure_debut).toLocaleTimeString(i18n.language === 'ar' ? 'ar-MA' : 'fr-MA', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{r.motif}</td>
                    <td className="px-6 py-4">
                      <Badge variant={statusBadge(r.statut)}>{r.statut}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-primary transition-colors">
                        <MoreHorizontal size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;