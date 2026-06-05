import React, { useEffect, useState } from 'react';
import {
  Users, User, Calendar, Clock, TrendingUp,
  ArrowUpRight, ArrowDownRight, MoreHorizontal,
  Plus, Loader2, AlertCircle, Sparkles, Activity,
  ArrowRight, Zap
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
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Animated counter hook
const useCounter = (target, duration = 1500) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
};

// Skeleton Loader Component
const SkeletonCard = () => (
  <div className="glass-card p-8 animate-pulse">
    <div className="flex items-start justify-between mb-6">
      <div className="w-14 h-14 rounded-2xl bg-slate-200/60" />
      <div className="w-16 h-6 rounded-lg bg-slate-200/60" />
    </div>
    <div className="w-20 h-3 rounded-full bg-slate-200/60 mb-3" />
    <div className="w-16 h-10 rounded-xl bg-slate-200/60" />
  </div>
);

// Animated KPI Card
const KpiCard = ({ kpi, idx }) => {
  const count = useCounter(kpi.value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="group overflow-hidden border-none p-0 rounded-3xl">
        <div className="p-7 relative overflow-hidden">
          {/* Decorative blob */}
          <div className={`absolute -bottom-6 -right-6 w-28 h-28 bg-gradient-to-br ${kpi.color} opacity-10 rounded-full blur-xl group-hover:opacity-20 transition-opacity duration-500`} />
          <div className="flex items-start justify-between mb-5 relative z-10">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${kpi.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
              <kpi.icon size={26} strokeWidth={2.5} />
            </div>
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${kpi.trendUp ? 'text-emerald bg-emerald/10 border-emerald/20' : 'text-coral bg-coral/10 border-coral/20'}`}>
              {kpi.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {kpi.trend}
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.title}</p>
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter">{count}</h2>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

const AssistantDashboard = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
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
      <div className="space-y-10 pb-10">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="w-32 h-4 rounded-full bg-slate-200/60 animate-pulse" />
            <div className="w-64 h-10 rounded-2xl bg-slate-200/60 animate-pulse" />
            <div className="w-48 h-5 rounded-xl bg-slate-200/60 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[0,1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-4 p-8 bg-coral/5 border border-coral/20 rounded-3xl text-coral shadow-sm"
      >
        <div className="w-12 h-12 bg-coral/10 rounded-2xl flex items-center justify-center flex-shrink-0">
          <AlertCircle size={24} />
        </div>
        <div>
          <h3 className="font-black text-lg leading-none mb-1">Oups ! Une erreur est survenue</h3>
          <p className="text-sm font-medium opacity-80">{error}</p>
        </div>
      </motion.div>
    );
  }

  const kpis = [
    {
      title: t('dashboard.total_patients'),
      value: stats?.stats?.total_patients ?? 0,
      icon: Users,
      color: 'from-purple to-indigo',
      trend: '+12%',
      trendUp: true
    },
    {
      title: t('dashboard.today_appointments'),
      value: stats?.stats?.rdv_aujourd_hui ?? 0,
      icon: Calendar,
      color: 'from-emerald to-mint',
      trend: '+5%',
      trendUp: true
    },
    {
      title: t('dashboard.active_doctors'),
      value: stats?.stats?.total_medecins ?? 0,
      icon: Activity,
      color: 'from-coral to-gold',
      trend: '0%',
      trendUp: true
    },
    {
      title: t('dashboard.new_this_month'),
      value: stats?.stats?.nouveaux_patients ?? 0,
      icon: TrendingUp,
      color: 'from-gold to-coral',
      trend: '+8%',
      trendUp: true
    },
  ];

  const chartData = stats?.patients_par_mois?.map(m => ({
    name: m.label,
    value: m.total,
  })) || [];

  const statusBadge = (statut) => {
    const map = {
      planifie: 'info', confirme: 'success',
      en_cours: 'warning', termine: 'mint',
      annule: 'error', absent: 'error',
    };
    return map[statut] || 'info';
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <motion.div animate={{ rotate: [0, 15, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}>
              <Sparkles className="text-gold" size={18} />
            </motion.div>
            <span className="text-xs font-black text-purple uppercase tracking-[0.2em]">Espace Assistant</span>
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none">
            {t('assistant.title') || "Tableau de Bord Secrétariat"}
          </h1>
          <p className="text-slate-500 mt-3 font-medium text-lg">
            {t('dashboard.welcome', { name: user?.prenom })}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" icon={Calendar} onClick={() => navigate('/appointments')}>Calendrier</Button>
          <Button icon={Plus} onClick={() => navigate('/appointments')}>{t('dashboard.new_appointment')}</Button>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => (
          <KpiCard key={kpi.title} kpi={kpi} idx={idx} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
             <div>
               <h3 className="text-xl font-black text-slate-800 tracking-tight">{t('dashboard.patient_evolution')}</h3>
               <p className="text-sm font-medium text-slate-400">{t('dashboard.patient_evolution_subtitle')}</p>
             </div>
             <div className="flex gap-2">
                <button className="px-4 py-2 bg-gradient-to-r from-purple/10 to-purple/5 text-purple text-xs font-black rounded-xl uppercase tracking-widest border border-purple/20">Mensuel</button>
                <button className="px-4 py-2 hover:bg-slate-50/80 text-slate-400 text-xs font-black rounded-xl uppercase tracking-widest transition-colors">Annuel</button>
             </div>
          </div>
          <div className="h-72 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C5CFF" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#7C5CFF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="strokeColor" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#7C5CFF" />
                      <stop offset="100%" stopColor="#00C9A7" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} 
                    dy={15} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '20px', 
                      border: 'none', 
                      boxShadow: '0 0 20px rgba(124,92,255,0.15)',
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(20px)'
                    }} 
                    itemStyle={{ fontWeight: 800, fontSize: '14px', color: '#7C5CFF' }}
                    labelStyle={{ fontWeight: 800, fontSize: '12px', marginBottom: '4px', color: '#64748b' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="url(#strokeColor)"
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                <Activity size={40} className="opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest">{t('dashboard.no_data')}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Distribution Card */}
        <Card className="rounded-3xl p-8">
          <h3 className="text-xl font-black text-slate-800 tracking-tight mb-1">{t('dashboard.patient_distribution')}</h3>
          <p className="text-sm font-medium text-slate-400 mb-6">{t('dashboard.patient_distribution_subtitle')}</p>
          
          <div className="space-y-5 mt-4">
            {stats?.repartition_sexe?.map((item, i) => {
              const total = stats.stats.total_patients || 1;
              const pct   = Math.round((item.total / total) * 100);
              const labelMap = {
                M: t('dashboard.genders.m'),
                F: t('dashboard.genders.f'),
                Autre: t('dashboard.genders.other')
              };
              const colorMap = { M: 'from-purple to-indigo', F: 'from-coral to-gold', Autre: 'from-emerald to-mint' };
              
              return (
                <div key={item.sexe} className="group">
                  <div className="flex justify-between text-sm font-black text-slate-700 mb-2 uppercase tracking-tight">
                    <span className="flex items-center gap-2">
                      {labelMap[item.sexe] || item.sexe}
                    </span>
                    <span className="text-slate-400">{item.total} <span className="text-slate-300 mx-1">/</span> {pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100/80 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: i * 0.2 }}
                      className={`bg-gradient-to-r ${colorMap[item.sexe] || 'from-purple to-indigo'} h-full rounded-full shadow-sm`}
                    />
                  </div>
                </div>
              );
            })}
            {(!stats?.repartition_sexe || stats.repartition_sexe.length === 0) && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-300 gap-3">
                <Users size={40} className="opacity-20" />
                <p className="text-xs font-black uppercase tracking-widest">{t('dashboard.no_data')}</p>
              </div>
            )}
          </div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="mt-8 p-5 bg-gradient-to-r from-purple/5 to-emerald/5 rounded-2xl border border-purple/10 flex items-center justify-between group cursor-pointer hover:border-purple/30 transition-all duration-300"
          >
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple to-emerald rounded-xl flex items-center justify-center text-white shadow-glow">
                   <TrendingUp size={18} />
                </div>
                <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Rapport Complet</span>
             </div>
             <ArrowRight size={18} className="text-slate-300 group-hover:text-purple transition-colors group-hover:translate-x-1" />
          </motion.div>
        </Card>
      </div>

      {/* Appointments Table */}
      <Card className="rounded-3xl overflow-hidden p-0">
        <div className="p-8 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{t('dashboard.appointments_today')}</h3>
            <p className="text-sm font-medium text-slate-400">{t('dashboard.appointments_today_subtitle')}</p>
          </div>
          <div className="flex gap-2">
             <Button variant="ghost" size="sm" className="font-black uppercase tracking-widest text-[10px]">Tout voir</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {rdv.length === 0 ? (
            <div className="text-center py-20 bg-gradient-to-b from-transparent to-slate-50/30">
              <div className="w-20 h-20 bg-gradient-to-br from-purple/10 to-emerald/10 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-300 border border-purple/10">
                <Calendar size={36} />
              </div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">{t('dashboard.no_appointments')}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50/80 to-transparent text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-y border-slate-100/50">
                  <th className="px-8 py-5 text-left">{t('dashboard.table.patient')}</th>
                  <th className="px-8 py-5 text-left">{t('dashboard.table.time')}</th>
                  <th className="px-8 py-5 text-left">{t('dashboard.table.reason')}</th>
                  <th className="px-8 py-5 text-left">{t('dashboard.table.status')}</th>
                  <th className="px-8 py-5 text-right">{t('dashboard.table.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {rdv.map((r, idx) => (
                  <motion.tr 
                    key={r.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ backgroundColor: 'rgba(124,92,255,0.03)' }}
                    className="transition-all group cursor-pointer"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-gradient-to-br from-purple/20 to-emerald/20 rounded-2xl flex items-center justify-center font-black text-purple text-sm border border-purple/10 group-hover:scale-110 transition-transform duration-300">
                          {r.patient_nom.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-sm mb-0.5">{r.patient_nom}</p>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{r.patient_telephone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/50 rounded-xl w-fit border border-slate-200/50">
                          <Clock size={14} className="text-slate-400" />
                          <span className="text-xs font-black text-slate-600">
                            {new Date(r.date_heure_debut).toLocaleTimeString(i18n.language === 'ar' ? 'ar-MA' : 'fr-MA', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold text-slate-500 max-w-xs truncate">{r.motif}</p>
                    </td>
                    <td className="px-8 py-5">
                      <Badge variant={statusBadge(r.statut)}>{r.statut}</Badge>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <motion.button whileHover={{ scale: 1.1 }} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-purple hover:bg-purple/5 rounded-xl transition-all border border-transparent hover:border-purple/20">
                        <MoreHorizontal size={20} />
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="p-6 bg-gradient-to-r from-slate-50/50 to-transparent text-center border-t border-slate-100/50">
           <button className="text-xs font-black text-purple uppercase tracking-[0.2em] hover:text-purple/70 transition-colors">Acceder a la liste complete des rendez-vous</button>
        </div>
      </Card>
    </div>
  );
};

export default AssistantDashboard;
