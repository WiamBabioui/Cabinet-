import React, { useState, useEffect } from 'react';
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
  Heart,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Card from '../components/dashboard/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import api from '../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const PatientPortal = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        const res = await api.get('/patients/portal');
        setData(res.data);
      } catch (err) {
        console.error('Portal fetch error:', err);
        setError(err.response?.data?.message || 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };
    fetchPortalData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 p-8 rounded-3xl text-center">
        <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-red-800 mb-2">Oups !</h2>
        <p className="text-red-600">{error}</p>
        <p className="text-sm text-red-500 mt-4">Si vous venez de créer votre compte, il est possible que votre dossier médical ne soit pas encore lié.</p>
      </div>
    );
  }

  const { patient, dossier, prochainRDV, consultations } = data;

  // Calcul de l'âge
  const age = patient.date_naissance 
    ? new Date().getFullYear() - new Date(patient.date_naissance).getFullYear() 
    : 'N/A';

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="relative overflow-hidden bg-white p-8 rounded-3xl border border-slate-100 shadow-premium">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="w-32 h-32 bg-primary/10 rounded-3xl flex items-center justify-center text-primary border-4 border-white shadow-lg overflow-hidden">
            {patient.photo_url ? (
              <img src={patient.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={64} />
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <h1 className="text-3xl font-black text-slate-800">{patient.prenom} {patient.nom}</h1>
              <Badge variant={patient.statut === 'actif' ? 'success' : 'warning'}>
                {patient.statut === 'actif' ? 'Profil Actif' : patient.statut}
              </Badge>
            </div>
            <p className="text-slate-500 font-medium mt-1">
              ID: #{patient.num_dossier} • {patient.sexe === 'M' ? 'Homme' : 'Femme'} • {age} ans
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
              <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                <Heart size={16} className="text-red-500" />
                <span className="text-sm font-bold text-slate-700">Groupe: {patient.groupe_sanguin || 'Inconnu'}</span>
              </div>
              <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                <Shield size={16} className="text-blue-500" />
                <span className="text-sm font-bold text-slate-700">Allergies: {dossier?.allergies || 'Aucune'}</span>
              </div>
            </div>
          </div>
          <Button variant="outline" icon={Smartphone}>Appareil lié</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Appointment */}
          <Card 
            title="Prochaine Consultation" 
            subtitle="Détails de votre prochain rendez-vous"
            className="border-l-8 border-primary"
          >
            {prochainRDV ? (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mt-4 p-6 bg-primary/5 rounded-2xl">
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-white rounded-2xl flex flex-col items-center justify-center shadow-sm border border-primary/10">
                    <span className="text-[10px] font-bold text-primary uppercase">
                      {format(new Date(prochainRDV.date_heure_debut), 'MMM', { locale: fr })}
                    </span>
                    <span className="text-xl font-black text-slate-800 leading-none">
                      {format(new Date(prochainRDV.date_heure_debut), 'dd')}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800">{prochainRDV.motif}</h4>
                    <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                      <Clock size={14} /> 
                      {format(new Date(prochainRDV.date_heure_debut), 'HH:mm')} • Dr. {prochainRDV.medecin_prenom} {prochainRDV.medecin_nom}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 font-bold">Annuler</Button>
                  <Button size="sm">Déplacer</Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Calendar size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 font-medium">Aucun rendez-vous planifié</p>
                <Button variant="ghost" size="sm" className="mt-2">Prendre rendez-vous</Button>
              </div>
            )}
          </Card>

          {/* Medical Records History */}
          <Card title="Historique Médical" subtitle="Comptes-rendus et ordonnances">
            <div className="space-y-4 mt-6">
              {consultations.length > 0 ? (
                consultations.map((consult, i) => (
                  <div key={consult.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-800 text-sm">Consultation - {consult.diagnostic_principal}</h5>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          Dr. {consult.medecin_nom} • {format(new Date(consult.date_consultation), 'dd MMMM yyyy', { locale: fr })}
                        </span>
                      </div>
                    </div>
                    <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                      <Download size={20} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-400 py-8">Aucun historique disponible</p>
              )}
            </div>
            {consultations.length > 0 && (
              <Button variant="ghost" className="w-full mt-6 text-sm flex items-center justify-center gap-1">
                Voir tous les fichiers <ChevronRight size={16} />
              </Button>
            )}
          </Card>
        </div>

        <div className="space-y-8">
          {/* Medications */}
          <Card title="Traitements" subtitle="Médicaments en cours">
            <div className="space-y-4 mt-6">
              {dossier?.traitements_en_cours ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-bold text-slate-800 text-sm">Traitement Actif</h5>
                    <Badge variant="info">En cours</Badge>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {dossier.traitements_en_cours}
                  </p>
                </div>
              ) : (
                <p className="text-center text-slate-400 text-sm py-6">Aucun traitement répertorié</p>
              )}
            </div>
            <Button className="w-full mt-6 shadow-none" size="sm" variant="outline">Demander un renouvellement</Button>
          </Card>

          {/* Book Appointment CTA */}
          <Card className="bg-slate-800 text-white p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-primary-light mb-4">
                <Calendar size={32} />
              </div>
              <h4 className="font-bold text-lg mb-2">Besoin d'un contrôle ?</h4>
              <p className="text-sm text-white/60 mb-6">Réservez votre prochain rendez-vous en moins de 2 minutes.</p>
              <Button className="w-full bg-white text-slate-800 hover:bg-slate-50 border-none shadow-none font-bold">Réserver maintenant</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientPortal;

