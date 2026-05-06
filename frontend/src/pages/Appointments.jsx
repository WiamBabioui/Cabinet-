import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Plus,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import Card from '../components/dashboard/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { useData } from '../context/DataContext';

const Appointments = () => {
  const { appointments } = useData();
  const [selectedDate, setSelectedDate] = useState('2023-11-28');

  const days = [
    { day: 'Mon', date: '27', active: false },
    { day: 'Tue', date: '28', active: true },
    { day: 'Wed', date: '29', active: false },
    { day: 'Thu', date: '30', active: false },
    { day: 'Fri', date: '01', active: false },
    { day: 'Sat', date: '02', active: false },
    { day: 'Sun', date: '03', active: false },
  ];

  const timeSlots = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
      <div className="xl:col-span-3 space-y-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Schedules</h1>
            <p className="text-slate-500 mt-1">Manage your daily appointments and consultations.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" icon={ChevronLeft} className="border border-slate-200"></Button>
            <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-sm flex items-center gap-2">
              <CalendarIcon size={18} className="text-primary" />
              November 2023
            </div>
            <Button variant="ghost" icon={ChevronRight} className="border border-slate-200"></Button>
          </div>
        </div>

        {/* Week Selector */}
        <div className="grid grid-cols-7 gap-4">
          {days.map((d) => (
            <button 
              key={d.date}
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
        <Card className="p-0 overflow-visible">
          <div className="relative p-6 pt-10">
            {timeSlots.map((time, idx) => {
              const apt = appointments.find(a => a.time === time);
              return (
                <div key={time} className="flex gap-6 min-h-[100px] group">
                  <div className="w-20 text-right">
                    <span className="text-sm font-bold text-slate-400 group-hover:text-primary transition-colors">{time}</span>
                  </div>
                  <div className="flex-1 relative border-l-2 border-slate-100 pb-8 pl-8">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-slate-200 group-hover:border-primary transition-colors"></div>
                    
                    {apt ? (
                      <div className={`p-5 rounded-2xl border-l-4 shadow-sm transition-all hover:shadow-md cursor-pointer ${
                        apt.status === 'Confirmed' ? 'bg-green-50 border-green-500' : 
                        apt.status === 'Pending' ? 'bg-amber-50 border-amber-500' : 'bg-red-50 border-red-500'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 font-bold">
                              {apt.patientName.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm">{apt.patientName}</h4>
                              <p className="text-xs text-slate-500 font-medium">{apt.type}</p>
                            </div>
                          </div>
                          <Badge variant={apt.status === 'Confirmed' ? 'success' : apt.status === 'Pending' ? 'warning' : 'error'}>
                            {apt.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Clock size={14} /> 45 mins
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin size={14} /> Room 304
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-20 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center group/btn opacity-0 group-hover:opacity-100 transition-all">
                        <button className="flex items-center gap-2 text-sm font-bold text-slate-400 group-hover/btn:text-primary transition-all">
                          <Plus size={18} />
                          Schedule Here
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Appointment Queue" subtitle="Upcoming patients in line">
          <div className="space-y-4 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-primary font-bold">
                  {i}
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-bold text-slate-800">Sarah Miller</h5>
                  <p className="text-[11px] text-slate-500 font-medium uppercase tracking-tighter">Waiting for 15 mins</p>
                </div>
                <button className="p-2 text-slate-400 hover:text-green-500 transition-colors">
                  <CheckCircle2 size={20} />
                </button>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-6 text-sm">Manage Queue</Button>
        </Card>

        <Card title="Quick Tasks" subtitle="Personal reminders">
          <div className="space-y-3 mt-4">
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
              <AlertCircle size={18} className="text-red-500" />
              <span className="text-sm font-medium text-red-700">Follow up Dr. Smith</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <Clock size={18} className="text-blue-500" />
              <span className="text-sm font-medium text-blue-700">Read Lab Reports</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Appointments;
