import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, Phone, Mail, FileText, Calendar,
  Heart, Pill, AlertTriangle, Edit, Save, X, Loader2
} from 'lucide-react';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import api from '../services/api';

// ─── Onglet Info Patient ──────────────────────────────────────────────────────
const InfoTab = ({ patient }) => {
  const calcAge = (d) => Math.floor((Date.now() - new Date(d)) / (1000 * 60 * 60 * 24 * 365.25));

  const fields = [
    { label: 'Prénom & Nom',    value: `${patient.prenom} ${patient.nom}` },
    { label: 'Âge',             value: `${calcAge(patient.date_naissance)} ans` },
    { label: 'Date naissance',  value: new Date(patient.date_naissance).toLocaleDateString('fr-MA') },
    { label: 'Sexe',            value: patient.sexe === 'M' ? 'Homme' : patient.sexe === 'F' ? 'Femme' : 'Autre' },
    { label: 'Téléphone',       value: patient.telephone },
    { label: 'Email',           value: patient.email || '-' },
    { label: 'CIN',             value: patient.cin || '-' },
    { label: 'Ville',           value: patient.adresse_ville || '-' },
    { label: 'Groupe sanguin',  value: patient.groupe_sanguin || '-' },
    { label: 'Assurance',       value: patient.assurance_nom || '-' },
    { label: 'N° Assurance',    value: patient.assurance_numero || '-' },
    { label: 'N° Dossier',      value: patient.num_dossier },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map((f) => (
        <div key={f.label} className="p-4 bg-slate-50 rounded-xl">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{f.label}</p>
          <p className="text-sm font-semibold text-slate-700">{f.value}</p>
        </div>
      ))}
    </div>
  );
};

// ─── Onglet Dossier Médical ───────────────────────────────────────────────────
const DossierTab = ({ dossier, patientId, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({
    allergies: '', antecedents_perso: '', antecedents_familiaux: '',
    traitements_en_cours: '', mode_vie: '',
  });

  useEffect(() => {
    if (dossier) {
      setForm({
        allergies:             dossier.allergies || '',
        antecedents_perso:     dossier.antecedents_perso || '',
        antecedents_familiaux: dossier.antecedents_familiaux || '',
        traitements_en_cours:  dossier.traitements_en_cours || '',
        mode_vie:              dossier.mode_vie || '',
      });
    }
  }, [dossier]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/patients/${patientId}/dossier`, form);
      onUpdate();
      setEditing(false);
    } catch { }
    finally { setSaving(false); }
  };

  const fields = [
    { key: 'allergies',             label: 'Allergies',               icon: AlertTriangle, color: 'text-red-500' },
    { key: 'antecedents_perso',     label: 'Antécédents personnels',  icon: User,          color: 'text-blue-500' },
    { key: 'antecedents_familiaux', label: 'Antécédents familiaux',   icon: Heart,         color: 'text-pink-500' },
    { key: 'traitements_en_cours',  label: 'Traitements en cours',    icon: Pill,          color: 'text-green-500' },
    { key: 'mode_vie',              label: 'Mode de vie',             icon: User,          color: 'text-amber-500' },
  ];

  return (
    <div>
      <div className="flex justify-end mb-4">
        {editing ? (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setEditing(false)} icon={X}>Annuler</Button>
            <Button onClick={handleSave} isLoading={saving} icon={Save}>Enregistrer</Button>
          </div>
        ) : (
          <Button onClick={() => setEditing(true)} icon={Edit}>Modifier le dossier</Button>
        )}
      </div>

      <div className="space-y-4">
        {fields.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} className={color} />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
            </div>
            {editing ? (
              <textarea
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                rows={3}
                className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                placeholder={`Entrez les ${label.toLowerCase()}...`}
              />
            ) : (
              <p className="text-sm text-slate-700">
                {form[key] || <span className="text-slate-400 italic">Non renseigné</span>}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Onglet Historique ────────────────────────────────────────────────────────
const HistoriqueTab = ({ consultations, rendezvous }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-sm font-bold text-slate-700 mb-3">Dernières consultations</h3>
      {consultations.length === 0 ? (
        <p className="text-sm text-slate-400 italic">Aucune consultation</p>
      ) : (
        <div className="space-y-3">
          {consultations.map((c) => (
            <div key={c.id} className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-700">{c.diagnostic_principal}</p>
                  <p className="text-xs text-slate-500 mt-1">{c.anamnese?.substring(0, 100)}...</p>
                  <p className="text-xs text-slate-400 mt-2">Dr. {c.medecin}</p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap ml-4">
                  {new Date(c.date_consultation).toLocaleDateString('fr-MA')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    <div>
      <h3 className="text-sm font-bold text-slate-700 mb-3">Derniers rendez-vous</h3>
      {rendezvous.length === 0 ? (
        <p className="text-sm text-slate-400 italic">Aucun rendez-vous</p>
      ) : (
        <div className="space-y-3">
          {rendezvous.map((r) => (
            <div key={r.id} className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-700">{r.motif}</p>
                  <p className="text-xs text-slate-500">{r.type_consultation}</p>
                </div>
                <div className="text-right">
                  <Badge variant={r.statut === 'termine' ? 'success' : r.statut === 'annule' ? 'error' : 'info'}>
                    {r.statut}
                  </Badge>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(r.date_heure_debut).toLocaleDateString('fr-MA')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// ─── Page Principale ──────────────────────────────────────────────────────────
const PatientDetail = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setTab]   = useState('info');

  const fetchData = async () => {
    try {
      const res = await api.get(`/patients/${id}`);
      setData(res.data);
    } catch { navigate('/patients'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="animate-spin text-primary" size={48} />
    </div>
  );

  const tabs = [
    { key: 'info',      label: 'Informations' },
    { key: 'dossier',   label: 'Dossier médical' },
    { key: 'historique', label: 'Historique' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/patients')}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-xl font-bold">
            {data.patient.prenom.charAt(0)}{data.patient.nom.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {data.patient.prenom} {data.patient.nom}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                {data.patient.num_dossier}
              </span>
              <Badge variant={data.patient.statut === 'actif' ? 'success' : 'error'}>
                {data.patient.statut}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Contact rapide */}
      <div className="flex gap-4">
        <a href={`tel:${data.patient.telephone}`}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary">
          <Phone size={16} /> {data.patient.telephone}
        </a>
        {data.patient.email && (
          <a href={`mailto:${data.patient.email}`}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary">
            <Mail size={16} /> {data.patient.email}
          </a>
        )}
      </div>

      {/* Onglets */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === t.key
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        {activeTab === 'info' && <InfoTab patient={data.patient} />}
        {activeTab === 'dossier' && (
          <DossierTab
            dossier={data.dossier_medical}
            patientId={id}
            onUpdate={fetchData}
          />
        )}
        {activeTab === 'historique' && (
          <HistoriqueTab
            consultations={data.consultations}
            rendezvous={data.rendezvous}
          />
        )}
      </div>
    </div>
  );
};

export default PatientDetail;