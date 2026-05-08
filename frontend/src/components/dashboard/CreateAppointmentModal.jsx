import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from '../common/Button';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const CreateAppointmentModal = ({ isOpen, onClose, onCreated, selectedDate, initialTime }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    patient_email: '',
    heure: '',
    motif: 'Consultation de routine',
    type_rdv: 'suivi'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        heure: initialTime || '09:00'
      }));
    }
  }, [isOpen, initialTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...formData };
      
      // Combiner selectedDate et heure pour date_heure
      // selectedDate est au format YYYY-MM-DD
      // heure est au format HH:mm
      payload.date_heure = `${selectedDate}T${formData.heure}:00`;

      if (user?.role === 'medecin') {
        payload.medecin_id = user.id;
      }
      
      await api.post('/appointments', payload);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouveau Rendez-vous">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 mb-4">
          <p className="text-sm font-bold text-primary">
            Date sélectionnée : {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Email du Patient</label>
          <input 
            type="email"
            required
            placeholder="patient@exemple.com"
            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
            onChange={e => setFormData({...formData, patient_email: e.target.value})}
            value={formData.patient_email}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700">Heure du rendez-vous</label>
          <input 
            type="time"
            required
            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
            value={formData.heure}
            onChange={e => setFormData({...formData, heure: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Type de consultation</label>
          <select 
            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
            value={formData.type_rdv}
            onChange={e => setFormData({...formData, type_rdv: e.target.value})}
          >
            <option value="suivi">Suivi</option>
            <option value="premiere">Première consultation</option>
            <option value="urgence">Urgence</option>
            <option value="teleconsultation">Téléconsultation</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Motif</label>
          <textarea 
            required
            placeholder="Motif de la consultation..."
            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
            onChange={e => setFormData({...formData, motif: e.target.value})}
            value={formData.motif}
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Création...' : 'Créer le rendez-vous'}
        </Button>
      </form>
    </Modal>
  );
};

export default CreateAppointmentModal;

