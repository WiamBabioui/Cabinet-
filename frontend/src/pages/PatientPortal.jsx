import React from 'react';
import { 
  User, 
  FileText, 
  Download, 
  Calendar, 
  ChevronRight, 
  Shield, 
  Smartphone,
  Pill,
  Clock,
  Heart
} from 'lucide-react';
import Card from '../components/dashboard/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

const PatientPortal = () => {
  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="relative overflow-hidden bg-white p-8 rounded-3xl border border-slate-100 shadow-premium">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="w-32 h-32 bg-primary/10 rounded-3xl flex items-center justify-center text-primary border-4 border-white shadow-lg">
            <User size={64} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <h1 className="text-3xl font-black text-slate-800">John Patient</h1>
              <Badge variant="success">Active Profile</Badge>
            </div>
            <p className="text-slate-500 font-medium mt-1">ID: #SM-8849-JP • Male • 34 Years</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
              <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                <Heart size={16} className="text-red-500" />
                <span className="text-sm font-bold text-slate-700">Blood Type: O+</span>
              </div>
              <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                <Shield size={16} className="text-blue-500" />
                <span className="text-sm font-bold text-slate-700">Allergies: None</span>
              </div>
            </div>
          </div>
          <Button variant="outline" icon={Smartphone}>Link Device</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Appointment */}
          <Card 
            title="Next Consultation" 
            subtitle="Details for your upcoming visit"
            className="border-l-8 border-primary"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mt-4 p-6 bg-primary/5 rounded-2xl">
              <div className="flex gap-4">
                <div className="w-14 h-14 bg-white rounded-2xl flex flex-col items-center justify-center shadow-sm border border-primary/10">
                  <span className="text-[10px] font-bold text-primary uppercase">Nov</span>
                  <span className="text-xl font-black text-slate-800 leading-none">28</span>
                </div>
                <div>
                  <h4 className="font-black text-slate-800">Routine Checkup</h4>
                  <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                    <Clock size={14} /> 09:00 AM • Dr. Gregory House
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 font-bold">Cancel</Button>
                <Button size="sm">Reschedule</Button>
              </div>
            </div>
          </Card>

          {/* Medical Records Table */}
          <Card title="Medical Records" subtitle="Reports, prescriptions and imaging">
            <div className="space-y-4 mt-6">
              {[
                { title: 'Blood Test Results', date: 'Oct 15, 2023', type: 'Laboratory', icon: FileText },
                { title: 'Digital Prescription #449', date: 'Oct 15, 2023', type: 'Prescription', icon: Pill },
                { title: 'Chest X-Ray Imaging', date: 'Sept 02, 2023', type: 'Imaging', icon: FileText },
              ].map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                      <doc.icon size={20} />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-800 text-sm">{doc.title}</h5>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{doc.type} • {doc.date}</span>
                    </div>
                  </div>
                  <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                    <Download size={20} />
                  </button>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-6 text-sm flex items-center justify-center gap-1">
              View Archived Files <ChevronRight size={16} />
            </Button>
          </Card>
        </div>

        <div className="space-y-8">
          <Card title="Prescription Refills" subtitle="Currently active medications">
            <div className="space-y-4 mt-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-bold text-slate-800 text-sm">Amoxicillin 500mg</h5>
                  <Badge variant="info">4 Refills left</Badge>
                </div>
                <p className="text-xs text-slate-500">Take twice daily after meals. Important for infection recovery.</p>
                <div className="mt-4 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[60%]"></div>
                </div>
              </div>
            </div>
            <Button className="w-full mt-6 shadow-none" size="sm">Request New Refill</Button>
          </Card>

          <Card className="bg-slate-800 text-white p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-primary-light mb-4">
                <Calendar size={32} />
              </div>
              <h4 className="font-bold text-lg mb-2">Need a checkup?</h4>
              <p className="text-sm text-white/60 mb-6">Book your next appointment in less than 2 minutes.</p>
              <Button className="w-full bg-white text-slate-800 hover:bg-slate-50 border-none shadow-none">Book Now</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientPortal;
