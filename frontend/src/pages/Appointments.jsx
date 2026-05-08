import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Plus,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Card from '../components/dashboard/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import api from '../services/api';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/appointments?date=${selectedDate}`);
      setAppointments(res.data.appointments);
    } catch (err) {
      setError('Impossible de charger les rendez-vous.');
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (statut) => {
    const map = {
      pending: 'warning', confirmed: 'success',
      completed: 'info', cancelled: 'error',
    };
    return map[statut] || 'info';
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={48} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-800">Rendez-vous</h1>
        <input 
          type="date" 
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-200"
        />
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl">{error}</div>}

      <div className="grid grid-cols-1 gap-4">
        {appointments.length > 0 ? (
          appointments.map((apt) => (
            <Card key={apt.id} className="p-5 flex items-center justify-between border-l-4 border-primary">
              <div>
                <h4 className="font-bold text-slate-800">{apt.patient_nom} {apt.patient_prenom}</h4>
                <p className="text-sm text-slate-500">{apt.motif}</p>
                <div className="flex gap-4 mt-2 text-xs text-slate-400">
                  <span>{new Date(apt.date_heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>{apt.type_rdv}</span>
                </div>
              </div>
              <Badge variant={statusBadge(apt.statut)}>{apt.statut}</Badge>
            </Card>
          ))
        ) : (
          <p className="text-center text-slate-500 py-10">Aucun rendez-vous pour cette date.</p>
        )}
      </div>
    </div>
  );
};

export default Appointments;
