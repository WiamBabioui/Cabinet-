import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Stethoscope,
  Sparkles,
  Search,
  Filter,
  MoreVertical,
  Activity,
  Zap,
  Target,
  X,
  MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/dashboard/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import api from '../services/api';
import CreateAppointmentModal from '../components/dashboard/CreateAppointmentModal';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { twMerge } from 'tailwind-merge';

const Appointments = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialTime, setModalInitialTime] = useState('09:00');
  
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Suivi Dossier #442', type: 'urgent' },
    { id: 2, title: 'Lire rapports labo', type: 'info' }
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/appointments?date=${selectedDate}`);
      setAppointments(res.data.appointments);
    } catch (err) {
      setError(t('common.error_loading'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.put(`/appointments/${id}`, { statut: newStatus });
      fetchAppointments();
    } catch (err) {
      setError(t('common.error_loading'));
    }
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setTasks([{ id: Date.now(), title: newTaskTitle, type: 'info' }, ...tasks]);
    setNewTaskTitle('');
  };

  const removeTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const getWeekDays = (baseDate) => {
    const current = new Date(baseDate);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current);
    monday.setDate(diff);
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      return {
        day: d.toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', { weekday: 'short' }).replace('.', ''),
        date: d.getDate().toString().padStart(2, '0'),
        fullDate: iso,
        active: iso === selectedDate,
        isToday: iso === new Date().toISOString().split('T')[0]
      };
    });
  };

  const days = getWeekDays(selectedDate);
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  const statusBadge = (statut) => {
    const map = {
      pending: 'warning', confirmed: 'success',
      completed: 'mint', cancelled: 'error',
    };
    return map[statut] || 'info';
  };

  const navigateWeek = (direction) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + (direction * 7));
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const isRtl = i18n.language === 'ar';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 pb-10">
      <div className="xl:col-span-3 space-y-8">
        {/* Calendar Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <motion.div animate={{ rotate: [0, 15, -10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}>
                <Sparkles className="text-purple" size={18} />
              </motion.div>
              <span className="text-xs font-black text-purple uppercase tracking-[0.2em]">Agenda & Planning</span>
            </div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none">{t('appointments.title')}</h1>
            <p className="text-slate-500 mt-3 font-medium text-lg">{t('appointments.subtitle')}</p>
          </div>
          
          <div className="flex gap-4 items-center bg-white/40 backdrop-blur-md p-2 rounded-[2rem] border border-white/60 shadow-soft">
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => navigateWeek(-1)} className="p-3 text-slate-400 hover:text-purple transition-colors">
              <ChevronLeft size={20} strokeWidth={3} />
            </motion.button>
            <div className="flex items-center gap-3 px-6 py-2 bg-white rounded-2xl shadow-sm border border-slate-100 min-w-[200px] justify-center">
              <CalendarIcon size={18} className="text-purple" />
              <span className="font-black text-sm text-slate-800 uppercase tracking-widest whitespace-nowrap">
                {new Date(selectedDate).toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => navigateWeek(1)} className="p-3 text-slate-400 hover:text-purple transition-colors">
              <ChevronRight size={20} strokeWidth={3} />
            </motion.button>
          </div>
        </div>

        {/* Week Selector */}
        <div className="grid grid-cols-7 gap-3 sm:gap-4">
          {days.map((d, i) => (
            <motion.button 
              key={d.fullDate}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedDate(d.fullDate)}
              className={twMerge(
                "relative p-4 rounded-[2rem] transition-all flex flex-col items-center gap-1.5 overflow-hidden group border",
                d.active 
                  ? 'bg-gradient-to-br from-purple to-indigo text-white shadow-glow border-transparent' 
                  : 'bg-white/60 backdrop-blur-md text-slate-500 border-white/60 hover:border-purple/30'
              )}
            >
              {d.isToday && !d.active && <div className="absolute top-2 w-1.5 h-1.5 rounded-full bg-purple animate-pulse" />}
              <span className={twMerge("text-[10px] font-black uppercase tracking-[0.15em]", d.active ? 'text-white/70' : 'text-slate-400')}>{d.day}</span>
              <span className="text-2xl font-black tracking-tighter relative z-10">{d.date}</span>
              {d.active && (
                <motion.div 
                  layoutId="active-date-bg"
                  className="absolute inset-0 bg-gradient-to-br from-purple to-indigo -z-0"
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Timeline */}
        <div className="glass-card p-0 border border-white/60 min-h-[600px] relative overflow-hidden">
          {/* Subtle noise and gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
               <div className="w-16 h-16 border-4 border-purple/10 border-t-purple rounded-full animate-spin" />
               <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Organisation de la journee...</p>
            </div>
          ) : (
            <div className="relative p-10">
              {error && (
                <div className="mb-8 p-5 bg-coral/5 border border-coral/20 rounded-[2rem] text-coral text-sm font-bold flex items-center gap-3">
                   <AlertCircle size={20} /> {error}
                </div>
              )}
              
              <div className="space-y-4">
                {timeSlots.map((time, idx) => {
                  const hourApts = appointments.filter(apt => {
                    const aptTime = new Date(apt.date_heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                    return aptTime.startsWith(time.split(':')[0]);
                  });

                  return (
                    <div key={time} className="flex gap-10 min-h-[120px] group">
                      <div className="w-20 pt-1">
                        <span className="text-sm font-black text-slate-400 group-hover:text-purple transition-colors uppercase tracking-widest">{time}</span>
                      </div>
                      <div className="flex-1 relative border-l-2 border-slate-100/50 pb-10 pl-10">
                        <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-white border-4 border-slate-200 group-hover:border-purple group-hover:scale-125 transition-all duration-300"></div>
                        
                        <AnimatePresence mode="popLayout">
                          {hourApts.length > 0 ? (
                            <div className="space-y-5">
                              {hourApts.map((apt) => (
                                <motion.div 
                                  key={apt.id} 
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="group/card relative"
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-purple/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity rounded-[2rem]" />
                                  <div className="relative p-6 bg-white/50 backdrop-blur-sm rounded-[2rem] border border-white/60 shadow-soft transition-all hover:shadow-glow hover:border-purple/30 cursor-pointer overflow-hidden group/inner">
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-purple/10 to-indigo/10 rounded-2xl flex items-center justify-center text-purple font-black text-base border border-purple/5 shadow-sm group-hover/inner:scale-110 transition-transform">
                                          {apt.patient_nom.charAt(0)}
                                        </div>
                                        <div>
                                          <h4 className="font-black text-slate-800 text-base mb-1">{apt.patient_nom} {apt.patient_prenom}</h4>
                                          <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                                             <span className="flex items-center gap-1"><Clock size={12} className="text-purple/50" /> {new Date(apt.date_heure).toLocaleTimeString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                             <span className="w-1 h-1 rounded-full bg-slate-200" />
                                             <span className="flex items-center gap-1"><Target size={12} className="text-purple/50" /> {apt.motif}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant={statusBadge(apt.statut)}>
                                          {apt.statut}
                                        </Badge>
                                        <motion.button
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigate('/chat', { state: { contactId: apt.utilisateur_id } });
                                          }}
                                          className="w-10 h-10 flex items-center justify-center bg-white shadow-soft rounded-xl text-slate-400 hover:text-indigo transition-all border border-slate-100"
                                          title={t('chat.message_patient') || 'Message Patient'}
                                        >
                                          <MessageSquare size={18} strokeWidth={2.5} />
                                        </motion.button>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100/50">
                                      <div className="flex items-center gap-4">
                                         <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-100">
                                            <MapPin size={12} /> {apt.type_rdv}
                                         </div>
                                      </div>
                                      
                                      {user?.role === 'medecin' && apt.statut !== 'completed' && (
                                        <motion.button 
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple to-indigo text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-glow transition-all"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/consultation/${apt.id}`);
                                          }}
                                        >
                                          <Stethoscope size={14} />
                                          {t('appointments.consult')}
                                        </motion.button>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-20 border-2 border-dashed border-slate-100/50 rounded-3xl flex items-center justify-center group/btn opacity-0 group-hover:opacity-100 transition-all">
                              {user?.role === 'medecin' && (
                                <motion.button 
                                  whileHover={{ scale: 1.02 }}
                                  onClick={() => {
                                    setModalInitialTime(time);
                                    setIsModalOpen(true);
                                  }}
                                  className="flex items-center gap-3 text-xs font-black text-slate-400 group-hover/btn:text-purple uppercase tracking-[0.2em] transition-all"
                                >
                                  <Plus size={20} className="p-1 bg-slate-50 rounded-lg group-hover/btn:bg-purple/10" />
                                  {t('appointments.schedule_here')}
                                </motion.button>
                              )}
                            </div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Section */}
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card className="rounded-[2.5rem] p-8 border border-white/60 shadow-premium overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-1">{t('appointments.queue')}</h3>
              <p className="text-xs font-medium text-slate-400 mb-6">{t('appointments.waiting_patients')}</p>
              
              <div className="space-y-4">
                {appointments.filter(a => a.statut === 'pending').slice(0, 5).map((apt, i) => (
                  <motion.div 
                    key={apt.id} 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/60 flex items-center gap-4 group/item transition-all hover:bg-white hover:shadow-soft"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple/10 to-indigo/10 rounded-xl flex items-center justify-center text-purple font-black text-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-black text-slate-800 truncate">{apt.patient_nom} {apt.patient_prenom}</h5>
                      <p className="text-[10px] text-emerald font-black uppercase tracking-widest flex items-center gap-1.5">
                         <span className="w-1 h-1 rounded-full bg-emerald animate-pulse" />
                         {t('appointments.waiting')}
                      </p>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                      className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-emerald transition-colors"
                      title="Confirmer l'arrivee"
                    >
                      <CheckCircle2 size={20} />
                    </motion.button>
                  </motion.div>
                ))}
                {appointments.filter(a => a.statut === 'pending').length === 0 && (
                  <div className="text-center py-10 opacity-40 grayscale">
                    <Activity size={32} className="mx-auto mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-widest">{t('appointments.no_waiting')}</p>
                  </div>
                )}
              </div>
              <Button variant="outline" className="w-full mt-8 h-12 rounded-2xl text-[10px] uppercase tracking-[0.2em] font-black" onClick={fetchAppointments}>
                {t('appointments.refresh_queue')}
              </Button>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Card className="rounded-[2.5rem] p-8 border border-white/60 shadow-premium overflow-hidden relative">
            <div className="absolute top-0 left-0 w-32 h-32 bg-coral/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-1">{t('appointments.tasks')}</h3>
              <p className="text-xs font-medium text-slate-400 mb-6">{t('appointments.reminders')}</p>
              
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {tasks.map(task => (
                    <motion.div 
                      key={task.id} 
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={twMerge(
                        "flex items-center justify-between group p-4 rounded-2xl border transition-all hover:scale-[1.02]",
                        task.type === 'urgent' ? 'bg-coral/5 border-coral/10' : 'bg-indigo/5 border-indigo/10'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {task.type === 'urgent' ? (
                          <div className="w-2 h-2 rounded-full bg-coral animate-ping" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-indigo" />
                        )}
                        <span className={twMerge(
                          "text-xs font-bold",
                          task.type === 'urgent' ? 'text-coral' : 'text-slate-600'
                        )}>{task.title}</span>
                      </div>
                      <button 
                        onClick={() => removeTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-coral transition-all"
                      >
                        <X size={14} strokeWidth={3} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <form onSubmit={addTask} className="mt-6 flex gap-2 relative">
                  <input 
                    type="text" 
                    placeholder={t('appointments.new_task')}
                    className="flex-1 h-12 ps-4 pe-12 text-xs font-bold bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-purple/10 focus:border-purple transition-all"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                  />
                  <button type="submit" className="absolute right-1.5 top-1.5 w-9 h-9 bg-purple text-white rounded-xl shadow-glow flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                    <Plus size={18} strokeWidth={3} />
                  </button>
                </form>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <CreateAppointmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreated={fetchAppointments}
        selectedDate={selectedDate}
        initialTime={modalInitialTime}
      />
    </div>
  );
};

export default Appointments;
