import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Stethoscope, 
  Activity, 
  Pill, 
  ChevronRight,
  ClipboardList,
  Save,
  Download,
  Plus,
  Loader2,
  Trash2
} from 'lucide-react';
import Card from '../components/dashboard/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import api from '../services/api';

import { useTranslation } from 'react-i18next';

const Consultation = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('notes');
  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    poids_kg: '',
    taille_cm: '',
    tension_sys: '',
    tension_dia: '',
    temperature: '',
    frequence_cardiaque: '',
    spo2: '',
    anamnese: '',
    examen_clinique: '',
    diagnostic_principal: '',
    codes_cim10: '',
    conduite_a_tenir: ''
  });

  const [ordonnances, setOrdonnances] = useState([]);
  const [newMed, setNewMed] = useState({ medicament: '', posologie: '', duree: '' });

  useEffect(() => {
    if (appointmentId) {
      fetchAppointmentDetails();
    }
  }, [appointmentId]);

  const fetchAppointmentDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/appointments/${appointmentId}`);
      setAppointment(res.data.appointment);
    } catch (err) {
      console.error('Error fetching appointment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addMedication = () => {
    if (!newMed.medicament || !newMed.posologie) return;
    setOrdonnances([...ordonnances, newMed]);
    setNewMed({ medicament: '', posologie: '', duree: '' });
  };

  const removeMedication = (index) => {
    setOrdonnances(ordonnances.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!appointmentId) return;
    setSaving(true);
    try {
      await api.post('/consultations', {
        rendez_vous_id: appointmentId,
        ...formData,
        ordonnances
      });
      alert(t('consultation.success'));
      navigate('/appointments');
    } catch (err) {
      alert(t('common.error_loading') + ': ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-soft flex items-center justify-center text-primary border border-slate-100">
            <Stethoscope size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{t('consultation.title')}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold text-slate-700">
                {t('consultation.patient')}: {appointment ? `${appointment.patient_prenom} ${appointment.patient_nom}` : t('common.loading')}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                {t('consultation.reason')}: {appointment?.motif}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" icon={ClipboardList} className="border border-slate-200" onClick={() => navigate(`/patients/${appointment?.patient_id}`)}>{t('consultation.patient_file')}</Button>
          <Button icon={saving ? Loader2 : Save} onClick={handleSave} disabled={saving || !appointment}>
            {saving ? t('consultation.saving') : t('consultation.save_and_finish')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Tabs */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'notes', label: t('consultation.tabs.observations'), icon: FileText },
            { id: 'vitals', label: t('consultation.tabs.vitals'), icon: Activity },
            { id: 'diagnosis', label: t('consultation.tabs.diagnosis'), icon: ClipboardList },
            { id: 'prescription', label: t('consultation.tabs.prescription'), icon: Pill },
          ].map((tab) => (
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
        </div>

        {/* Dynamic Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="min-h-[500px]">
            {activeTab === 'notes' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-4">{t('consultation.observations.title')}</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-bold text-slate-700 block mb-2">{t('consultation.observations.anamnese')}</label>
                      <textarea 
                        name="anamnese"
                        value={formData.anamnese}
                        onChange={handleInputChange}
                        className="w-full h-32 p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-primary/30 transition-all text-slate-700 resize-none"
                        placeholder={t('consultation.observations.anamnese_placeholder')}
                      ></textarea>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-700 block mb-2">{t('consultation.observations.exam')}</label>
                      <textarea 
                        name="examen_clinique"
                        value={formData.examen_clinique}
                        onChange={handleInputChange}
                        className="w-full h-32 p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-primary/30 transition-all text-slate-700 resize-none"
                        placeholder={t('consultation.observations.exam_placeholder')}
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'vitals' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-xl font-bold text-slate-800 mb-4">{t('consultation.vitals.title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label={t('consultation.vitals.temp')} name="temperature" value={formData.temperature} onChange={handleInputChange} placeholder="37.2" />
                  <div className="flex gap-2 items-end">
                    <Input label={t('consultation.vitals.bp_sys')} name="tension_sys" value={formData.tension_sys} onChange={handleInputChange} placeholder="120" />
                    <Input label={t('consultation.vitals.bp_dia')} name="tension_dia" value={formData.tension_dia} onChange={handleInputChange} placeholder="80" />
                  </div>
                  <Input label={t('consultation.vitals.hr')} name="frequence_cardiaque" value={formData.frequence_cardiaque} onChange={handleInputChange} placeholder="72" />
                  <Input label={t('consultation.vitals.spo2')} name="spo2" value={formData.spo2} onChange={handleInputChange} placeholder="98" />
                  <Input label={t('consultation.vitals.weight')} name="poids_kg" value={formData.poids_kg} onChange={handleInputChange} placeholder="75" />
                  <Input label={t('consultation.vitals.height')} name="taille_cm" value={formData.taille_cm} onChange={handleInputChange} placeholder="180" />
                </div>
              </div>
            )}

            {activeTab === 'diagnosis' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-xl font-bold text-slate-800 mb-4">{t('consultation.diagnosis.title')}</h3>
                <div className="space-y-4">
                  <Input label={t('consultation.diagnosis.main')} name="diagnostic_principal" value={formData.diagnostic_principal} onChange={handleInputChange} placeholder="Ex: Grippe saisonnière" />
                  <Input label={t('consultation.diagnosis.cim10')} name="codes_cim10" value={formData.codes_cim10} onChange={handleInputChange} placeholder="Ex: J11.1" />
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-2">{t('consultation.diagnosis.advice')}</label>
                    <textarea 
                      name="conduite_a_tenir"
                      value={formData.conduite_a_tenir}
                      onChange={handleInputChange}
                      className="w-full h-32 p-4 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:border-primary/30 transition-all"
                      placeholder={t('consultation.diagnosis.advice_placeholder')}
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'prescription' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-800">{t('consultation.prescription.title')}</h3>
                </div>
                
                <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Input 
                      placeholder={t('consultation.prescription.med')} 
                      value={newMed.medicament} 
                      onChange={e => setNewMed({...newMed, medicament: e.target.value})} 
                    />
                    <Input 
                      placeholder={t('consultation.prescription.dosage')} 
                      value={newMed.posologie} 
                      onChange={e => setNewMed({...newMed, posologie: e.target.value})} 
                    />
                    <Input 
                      placeholder={t('consultation.prescription.duration')} 
                      value={newMed.duree} 
                      onChange={e => setNewMed({...newMed, duree: e.target.value})} 
                    />
                  </div>
                  <Button variant="outline" className="w-full" icon={Plus} onClick={addMedication}>{t('consultation.prescription.add')}</Button>
                </div>

                <div className="border border-slate-100 rounded-2xl overflow-hidden mb-6 bg-white">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 text-left">{t('consultation.prescription.med')}</th>
                        <th className="px-6 py-4 text-left">{t('consultation.prescription.dosage')}</th>
                        <th className="px-6 py-4 text-left">{t('consultation.prescription.duration')}</th>
                        <th className="px-6 py-4 text-right">{t('dashboard.table.action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ordonnances.map((med, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800">{med.medicament}</td>
                          <td className="px-6 py-4 text-slate-600 font-medium">{med.posologie}</td>
                          <td className="px-6 py-4 text-slate-600">{med.duree}</td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => removeMedication(idx)} className="text-red-400 hover:text-red-600 p-2 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {ordonnances.length === 0 && (
                        <tr>
                          <td colSpan="4" className="px-6 py-8 text-center text-slate-400 italic">{t('consultation.prescription.no_meds')}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {ordonnances.length > 0 && (
                  <div className="p-6 bg-primary/5 rounded-2xl border border-dashed border-primary/20 flex flex-col items-center justify-center text-center">
                    <Download size={32} className="text-primary mb-2" />
                    <h4 className="font-bold text-slate-800">{t('consultation.prescription.ready')}</h4>
                    <p className="text-sm text-slate-500 mt-1">{t('consultation.prescription.ready_desc')}</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Consultation;

