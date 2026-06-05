import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from '../common/Button';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, FileText, Mail, Sparkles, Zap, ChevronDown, Stethoscope, User } from 'lucide-react';
import { motion } from 'framer-motion';

const CreateAppointmentModal = ({ isOpen, onClose, onCreated, selectedDate, initialTime }) => {
  const { user } = useAuth();
  const isSecretaire = user?.role?.toLowerCase().trim() === 'secretaire';

  const [formData, setFormData] = useState({
    patient_email: '',
    heure: '',
    motif: 'Consultation de routine',
    type_rdv: 'suivi',
    medecin_id: ''   // utilisateur_id of selected doctor (for secretaire)
  });

  const [medecins, setMedecins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load doctors list for secretaire
  useEffect(() => {
    if (isSecretaire && isOpen) {
      api.get('/medecins')
        .then(res => setMedecins(res.data.medecins || []))
        .catch(() => {});
    }
  }, [isOpen, isSecretaire]);

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        heure: initialTime || '09:00'
      }));
      setError('');
    }
  }, [isOpen, initialTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...formData };
      // Build the datetime string in local ISO format (no UTC conversion)
      payload.date_heure = `${selectedDate}T${formData.heure}:00`;

      // medecin_id: for medecin role, use own id; for secretaire, use selected doctor
      if (user?.role?.toLowerCase().trim() === 'medecin') {
        payload.medecin_id = user.id;
      }

      if (isSecretaire && !payload.medecin_id) {
        setError('Veuillez sélectionner un médecin');
        setLoading(false);
        return;
      }

      await api.post('/appointments', payload);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la creation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Planifier une séance">
      <form onSubmit={handleSubmit} className="space-y-6 p-2">
        {/* Selected Date Display */}
        <div className="p-5 bg-purple/5 rounded-[1.5rem] border border-purple/10 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-purple shadow-soft border border-purple/5">
            <Calendar size={24} strokeWidth={2.5} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-purple uppercase tracking-widest mb-1">Date Sélectionnée</p>
            <p className="text-sm font-black text-slate-700">
              {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Doctor selector — only for secretaire */}
          {isSecretaire && (
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ms-1">Médecin</label>
              <div className="relative">
                <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <select
                  required
                  className="w-full h-14 ps-12 pe-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-purple focus:ring-4 focus:ring-purple/5 outline-none transition-all appearance-none"
                  value={formData.medecin_id}
                  onChange={e => setFormData({ ...formData, medecin_id: e.target.value })}
                >
                  <option value="">— Choisir un médecin —</option>
                  {medecins.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.titre || 'Dr'} {m.prenom} {m.nom} — {m.specialite}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
              </div>
            </div>
          )}

          {/* Patient email */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ms-1">Email du Patient</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="email"
                required
                placeholder="patient@exemple.com"
                className="w-full h-14 ps-12 pe-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-purple focus:ring-4 focus:ring-purple/5 outline-none transition-all"
                onChange={e => setFormData({ ...formData, patient_email: e.target.value })}
                value={formData.patient_email}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Time */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ms-1">Heure</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="time"
                  required
                  className="w-full h-14 ps-12 pe-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-purple focus:ring-4 focus:ring-purple/5 outline-none transition-all"
                  value={formData.heure}
                  onChange={e => setFormData({ ...formData, heure: e.target.value })}
                />
              </div>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ms-1">Type</label>
              <div className="relative">
                <select
                  className="w-full h-14 px-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-purple focus:ring-4 focus:ring-purple/5 outline-none transition-all appearance-none"
                  value={formData.type_rdv}
                  onChange={e => setFormData({ ...formData, type_rdv: e.target.value })}
                >
                  <option value="suivi">Suivi</option>
                  <option value="premiere">Première consultation</option>
                  <option value="urgence">Urgence</option>
                  <option value="teleconsultation">Téléconsultation</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
              </div>
            </div>
          </div>

          {/* Motif */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ms-1">Motif de consultation</label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 text-slate-300" size={18} />
              <textarea
                required
                placeholder="Motif de la consultation..."
                rows={3}
                className="w-full ps-12 pe-4 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-sm font-bold text-slate-700 focus:bg-white focus:border-purple focus:ring-4 focus:ring-purple/5 outline-none transition-all resize-none"
                onChange={e => setFormData({ ...formData, motif: e.target.value })}
                value={formData.motif}
              />
            </div>
          </div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-coral/5 border border-coral/10 rounded-xl text-coral text-xs font-bold flex items-center gap-2">
            <Zap size={14} className="fill-coral" /> {error}
          </motion.div>
        )}

        <div className="flex gap-3 pt-4">
          <Button variant="outline" className="flex-1 h-14 rounded-2xl" onClick={onClose} type="button">Annuler</Button>
          <Button type="submit" className="flex-[2] h-14 rounded-2xl shadow-glow font-black uppercase tracking-widest text-xs" isLoading={loading} icon={Zap}>
            {loading ? 'Création...' : 'Confirmer le RDV'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateAppointmentModal;
