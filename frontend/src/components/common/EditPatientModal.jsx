import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, Mail, MapPin, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from './Button';
import Input from './Input';
import api from '../../services/api';

/**
 * EditPatientModal — Permet à la secrétaire (et admin) de modifier
 * les données administratives du patient (hors données médicales).
 */
const EditPatientModal = ({ patient, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    date_naissance: '',
    sexe: 'M',
    telephone: '',
    email: '',
    cin: '',
    adresse_rue: '',
    adresse_ville: '',
    adresse_code_postal: '',
    adresse_pays: 'Maroc'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (patient) {
      setForm({
        prenom: patient.prenom || '',
        nom: patient.nom || '',
        date_naissance: patient.date_naissance ? patient.date_naissance.split('T')[0] : '',
        sexe: patient.sexe || 'M',
        telephone: patient.telephone || '',
        email: patient.email || '',
        cin: patient.cin || '',
        adresse_rue: patient.adresse_rue || '',
        adresse_ville: patient.adresse_ville || '',
        adresse_code_postal: patient.adresse_code_postal || '',
        adresse_pays: patient.adresse_pays || 'Maroc'
      });
    }
  }, [patient]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.prenom || !form.nom || !form.telephone) {
      setError('Les champs Prénom, Nom et Téléphone sont obligatoires.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.patch(`/patients/${patient.id}/admin`, form);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Update patient admin error:', err);
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour des informations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-indigo/60 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-glow w-full max-w-2xl overflow-hidden border border-white/60"
      >
        <div className="p-8 border-b border-white/30 bg-gradient-to-r from-purple/5 to-transparent flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              Modifier les informations administratives
            </h2>
            <p className="text-sm font-medium text-slate-400 mt-1">
              Patient #{patient?.num_dossier} — {patient?.prenom} {patient?.nom}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-purple/10 rounded-2xl transition-all text-slate-400 hover:text-purple"
          >
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="flex items-center gap-3 p-4 mb-8 bg-coral/5 border border-coral/20 rounded-2xl text-coral text-sm font-bold">
              <AlertCircle size={20} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Prénom *"
                name="prenom"
                value={form.prenom}
                onChange={handleChange}
                required
                icon={User}
              />
              <Input
                label="Nom *"
                name="nom"
                value={form.nom}
                onChange={handleChange}
                required
                icon={User}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Date de Naissance"
                type="date"
                name="date_naissance"
                value={form.date_naissance}
                onChange={handleChange}
                icon={Calendar}
              />
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ms-1">
                  Sexe
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['M', 'F', 'Autre'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, sexe: s })}
                      className={`py-3.5 rounded-2xl text-sm font-bold border transition-all ${
                        form.sexe === s
                          ? 'bg-purple border-transparent text-white shadow-soft'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white hover:border-purple/30 hover:text-purple'
                      }`}
                    >
                      {s === 'M' ? 'Masculin' : s === 'F' ? 'Féminin' : 'Autre'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Téléphone *"
                name="telephone"
                value={form.telephone}
                onChange={handleChange}
                required
                icon={Phone}
              />
              <Input
                label="Email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                icon={Mail}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="N° CIN / Pièce d'identité"
                name="cin"
                value={form.cin}
                onChange={handleChange}
                icon={CreditCard}
              />
              <Input
                label="Ville"
                name="adresse_ville"
                value={form.adresse_ville}
                onChange={handleChange}
                icon={MapPin}
              />
            </div>

            <Input
              label="Adresse (Rue)"
              name="adresse_rue"
              value={form.adresse_rue}
              onChange={handleChange}
              icon={MapPin}
            />

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" className="flex-1 h-14" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" className="flex-1 h-14 shadow-glow" isLoading={loading} icon={Save}>
                Enregistrer les modifications
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default EditPatientModal;
