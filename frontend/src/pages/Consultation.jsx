import React, { useState } from 'react';
import { 
  FileText, 
  Stethoscope, 
  Activity, 
  Pill, 
  ChevronRight,
  ClipboardList,
  Save,
  Download,
  Plus
} from 'lucide-react';
import Card from '../components/dashboard/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';

const Consultation = () => {
  const [activeTab, setActiveTab] = useState('notes');

  const tabs = [
    { id: 'notes', label: 'Clinical Notes', icon: FileText },
    { id: 'diagnosis', label: 'Diagnosis', icon: Activity },
    { id: 'prescription', label: 'Prescription', icon: Pill },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-soft flex items-center justify-center text-primary border border-slate-100">
            <Stethoscope size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Current Consultation</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold text-slate-700">Patient: John Doe</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">ID: #SM-4382</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" icon={ClipboardList} className="border border-slate-200">Patient Profile</Button>
          <Button icon={Save}>Finish & Save</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Tabs */}
        <div className="lg:col-span-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 border-2 ${
                activeTab === tab.id 
                  ? 'bg-primary/5 border-primary text-primary shadow-sm' 
                  : 'bg-white border-transparent text-slate-500 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <tab.icon size={20} />
                <span className="font-bold">{tab.label}</span>
              </div>
              <ChevronRight size={18} className={activeTab === tab.id ? 'opacity-100' : 'opacity-0'} />
            </button>
          ))}

          <div className="p-6 bg-slate-800 rounded-3xl mt-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2"></div>
            <h4 className="text-sm font-bold mb-2">Previous Visit</h4>
            <p className="text-xs text-white/60 mb-4">OCT 15, 2023</p>
            <p className="text-sm text-white/80 line-clamp-3 italic">"Patient complained of recurrent headaches and minor fatigue..."</p>
            <button className="mt-4 text-xs font-bold text-primary-light hover:underline uppercase tracking-widest flex items-center gap-1">
              View History <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="min-h-[500px]">
            {activeTab === 'notes' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-4">Clinical Observations</h3>
                  <textarea 
                    className="w-full h-40 p-5 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all text-slate-700 resize-none font-medium placeholder:text-slate-400"
                    placeholder="Document symptoms, physical exam findings, and patient concerns here..."
                  ></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Temperature (°C)" placeholder="37.2" />
                  <Input label="Blood Pressure" placeholder="120/80" />
                  <Input label="Heart Rate (BPM)" placeholder="72" />
                  <Input label="Weight (kg)" placeholder="78.5" />
                </div>
              </div>
            )}

            {activeTab === 'diagnosis' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Assessment & Diagnosis</h3>
                <div className="space-y-4">
                  <Input label="Primary Diagnosis" placeholder="Type to search ICD-10 codes..." />
                  <Input label="Secondary Conditions" placeholder="Optional..." />
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">Internal Remarks</label>
                    <textarea 
                      className="w-full h-32 p-4 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:border-primary/30 transition-all"
                      placeholder="Private notes for medical staff only..."
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'prescription' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-slate-800">Prescription Builder</h3>
                  <Button variant="ghost" size="sm" icon={Plus} className="text-primary hover:bg-primary/5">Add Medication</Button>
                </div>
                
                <div className="border border-slate-100 rounded-2xl overflow-hidden mb-6">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                      <tr>
                        <th className="px-6 py-4 text-left">Medication</th>
                        <th className="px-6 py-4 text-left">Dosage</th>
                        <th className="px-6 py-4 text-left">Frequency</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-6 py-4 font-bold text-slate-800">Amoxicillin 500mg</td>
                        <td className="px-6 py-4 text-slate-600">1 Capsule</td>
                        <td className="px-6 py-4 text-slate-600 font-medium">Twice daily for 7 days</td>
                        <td className="px-6 py-4 text-right"><button className="text-red-400 hover:text-red-600">Remove</button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-6 bg-primary/5 rounded-2xl border border-dashed border-primary/20 flex flex-col items-center justify-center text-center">
                  <Download size={32} className="text-primary mb-2" />
                  <h4 className="font-bold text-slate-800">Generate Prescription PDF</h4>
                  <p className="text-sm text-slate-500 mt-1 mb-4">You can download or print the digital prescription for the patient.</p>
                  <Button variant="outline" size="sm">Download UI Preview</Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Consultation;
