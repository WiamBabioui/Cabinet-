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
  Stethoscope
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/dashboard/Card';

import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import api from '../services/api';
import CreateAppointmentModal from '../components/dashboard/CreateAppointmentModal';
import { useAuth } from '../context/AuthContext';

import { useTranslation } from 'react-i18next';

const Appointments = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [appointments, setAppointments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialTime, setModalInitialTime] = useState('09:00');
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Suivi Dr. Smith', type: 'urgent' },
    { id: 2, title: 'Lire rapports labo', type: 'info' }
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const { user } = useAuth();

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
      alert(t('common.error_loading'));
    }
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setTasks([...tasks, { id: Date.now(), title: newTaskTitle, type: 'info' }]);
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
        active: iso === selectedDate
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
      completed: 'info', cancelled: 'error',
    };
    return map[statut] || 'info';
  };

  const navigateWeek = (direction) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + (direction * 7));
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
      <div className="xl:col-span-3 space-y-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{t('appointments.title')}</h1>
            <p className="text-slate-500 mt-1">{t('appointments.subtitle')}</p>
          </div>
          <div className="flex gap-3">
            {user?.role === 'medecin' && (
              <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
                <Plus size={18} /> {t('appointments.new')}
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="ghost" icon={ChevronLeft} onClick={() => navigateWeek(-1)} className="border border-slate-200 p-2 h-10 w-10"></Button>
              <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-sm flex items-center gap-2">
                <CalendarIcon size={18} className="text-primary" />
                {new Date(selectedDate).toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', { month: 'long', year: 'numeric' })}
              </div>
              <Button variant="ghost" icon={ChevronRight} onClick={() => navigateWeek(1)} className="border border-slate-200 p-2 h-10 w-10"></Button>
            </div>
          </div>
        </div>

        {/* Week Selector */}
        <div className="grid grid-cols-7 gap-4">
          {days.map((d) => (
            <button 
              key={d.fullDate}
              onClick={() => setSelectedDate(d.fullDate)}
              className={`p-4 rounded-3xl transition-all flex flex-col items-center gap-1 ${
                d.active 
                  ? 'bg-primary text-white shadow-xl shadow-primary/30 ring-4 ring-primary/10' 
                  : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-widest">{d.day}</span>
              <span className="text-xl font-black">{d.date}</span>
            </button>
          ))}
        </div>

        {/* Timeline */}
        <Card className="p-0 overflow-visible min-h-[600px]">
          {loading ? (
            <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={48} /></div>
          ) : (
            <div className="relative p-6 pt-10">
              {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl">{error}</div>}
              
              {timeSlots.map((time, idx) => {
                // Find appointments that start in this hour
                const hourApts = appointments.filter(apt => {
                  const aptTime = new Date(apt.date_heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                  return aptTime.startsWith(time.split(':')[0]);
                });

                return (
                  <div key={time} className="flex gap-6 min-h-[100px] group">
                    <div className="w-20 text-right">
                      <span className="text-sm font-bold text-slate-400 group-hover:text-primary transition-colors">{time}</span>
                    </div>
                    <div className="flex-1 relative border-l-2 border-slate-100 pb-8 pl-8">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-slate-200 group-hover:border-primary transition-colors"></div>
                      
                      {hourApts.length > 0 ? (
                        <div className="space-y-4">
                          {hourApts.map((apt) => (
                            <div key={apt.id} className={`p-5 rounded-2xl border-l-4 shadow-sm transition-all hover:shadow-md cursor-pointer bg-white border-primary`}>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-slate-100 shadow-sm flex items-center justify-center text-primary font-bold">
                                    {apt.patient_nom.charAt(0)}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-slate-800 text-sm">{apt.patient_nom} {apt.patient_prenom}</h4>
                                    <p className="text-xs text-slate-500 font-medium">{apt.motif}</p>
                                  </div>
                                </div>
                                <Badge variant={statusBadge(apt.statut)}>
                                  {apt.statut}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                  <div className="flex items-center gap-1">
                                    <Clock size={14} /> {new Date(apt.date_heure).toLocaleTimeString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin size={14} /> {apt.type_rdv}
                                  </div>
                                </div>
                                
                                {user?.role === 'medecin' && apt.statut !== 'completed' && (
                                  <Button 
                                    size="xs" 
                                    icon={Stethoscope}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/consultation/${apt.id}`);
                                    }}
                                  >
                                    {t('appointments.consult')}
                                  </Button>
                                )}
                              </div>
                            </div>

                          ))}
                        </div>
                      ) : (
                        <div className="h-20 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center group/btn opacity-0 group-hover:opacity-100 transition-all">
                          {user?.role === 'medecin' && (
                            <button 
                              onClick={() => {
                                setModalInitialTime(time);
                                setIsModalOpen(true);
                              }}
                              className="flex items-center gap-2 text-sm font-bold text-slate-400 group-hover/btn:text-primary transition-all"
                            >
                              <Plus size={18} />
                              {t('appointments.schedule_here')}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="space-y-6">
        <Card title={t('appointments.queue')} subtitle={t('appointments.waiting_patients')}>
          <div className="space-y-4 mt-4">
            {appointments.filter(a => a.statut === 'pending').slice(0, 5).map((apt, i) => (
              <div key={apt.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 group/item transition-all hover:bg-white hover:shadow-sm">
                <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-primary font-bold">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-bold text-slate-800">{apt.patient_nom} {apt.patient_prenom}</h5>
                  <p className="text-[11px] text-slate-500 font-medium uppercase tracking-tighter">{t('appointments.waiting')}</p>
                </div>
                <button 
                  onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                  className="p-2 text-slate-400 hover:text-green-500 transition-colors"
                  title="Confirmer l'arrivée"
                >
                  <CheckCircle2 size={20} />
                </button>
              </div>
            ))}
            {appointments.filter(a => a.statut === 'pending').length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">{t('appointments.no_waiting')}</p>
            )}
          </div>
          <Button variant="outline" className="w-full mt-6 text-sm" onClick={fetchAppointments}>{t('appointments.refresh_queue')}</Button>
        </Card>

        <Card title={t('appointments.tasks')} subtitle={t('appointments.reminders')}>
          <div className="space-y-3 mt-4">
            {tasks.map(task => (
              <div key={task.id} className={`flex items-center justify-between group p-3 rounded-xl border ${
                task.type === 'urgent' ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'
              }`}>
                <div className="flex items-center gap-3">
                  {task.type === 'urgent' ? (
                    <AlertCircle size={18} className="text-red-500" />
                  ) : (
                    <Clock size={18} className="text-blue-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    task.type === 'urgent' ? 'text-red-700' : 'text-blue-700'
                  }`}>{task.title}</span>
                </div>
                <button 
                  onClick={() => removeTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                >
                  <Plus size={14} className="rotate-45" />
                </button>
              </div>
            ))}

            <form onSubmit={addTask} className="mt-4 flex gap-2">
              <input 
                type="text" 
                placeholder={t('appointments.new_task')}
                className="flex-1 px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
              />
              <button type="submit" className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                <Plus size={18} />
              </button>
            </form>
          </div>
        </Card>
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
