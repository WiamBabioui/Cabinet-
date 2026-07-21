import Consultation from '../models/Consultation.js';
import pool from '../config/db.mysql.js';

// ─── GET /api/consultations ───────────────────────────────
export const getConsultations = async (req, res) => {
  try {
    const { patientId } = req.query;
    let query = {};
    
    if (req.user.role === 'medecin') {
      query.doctorId = req.user.id;
    } else if (req.user.role === 'patient') {
      query.patientId = req.user.id;
    }

    if (patientId) {
      query.patientId = parseInt(patientId);
    }

    const consultations = await Consultation.find(query)
                                            .sort({ createdAt: -1 });
    res.json({ consultations });
  } catch (err) {
    console.error('getConsultations error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── GET /api/consultations/:id ───────────────────────────
export const getConsultationById = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation introuvable' });
    }

    // Access control
    if (req.user.role === 'medecin' && consultation.doctorId !== req.user.id) {
       return res.status(403).json({ message: 'Accès refusé' });
    }
    if (req.user.role === 'patient' && consultation.patientId !== req.user.id) {
       return res.status(403).json({ message: 'Accès refusé' });
    }

    res.json({ consultation });
  } catch (err) {
    console.error('getConsultationById error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── POST /api/consultations ──────────────────────────────
export const createConsultation = async (req, res) => {
  try {
    const { 
      patientId,
      rendez_vous_id,
      appointmentId,
      consultationType,
      symptoms,
      diagnosis,
      treatment,
      prescription,
      doctorNotes,
      consultationDate,
      // Champs spécifiques au formulaire Consultation.jsx
      anamnese,
      examen_clinique,
      diagnostic_principal,
      codes_cim10,
      conduite_a_tenir,
      ordonnances,
      // Vitaux
      poids_kg, taille_cm, tension_sys, tension_dia,
      temperature, frequence_cardiaque, spo2,
    } = req.body;

    // ── Résoudre le patientId (ID MySQL table patients) ────────────────────
    let resolvedPatientId = patientId ? parseInt(patientId) : null;
    const rvId = rendez_vous_id || appointmentId;

    if (!resolvedPatientId && rvId) {
      // Chercher dans MySQL le patient_id lié au rendez-vous
      const [rvRows] = await pool.execute(
        `SELECT patient_id FROM rendez_vous WHERE id = ? LIMIT 1`,
        [parseInt(rvId)]
      );
      if (rvRows.length > 0) {
        resolvedPatientId = rvRows[0].patient_id;
      }
    }

    if (!resolvedPatientId) {
      return res.status(400).json({ message: 'patientId introuvable — rendez-vous invalide ?' });
    }

    // ── Construire le texte de prescription depuis l'array ordonnances ─────
    let prescriptionText = prescription || '';
    if (!prescriptionText && ordonnances && ordonnances.length > 0) {
      prescriptionText = ordonnances
        .map(m => `${m.medicament} — ${m.posologie}${m.duree ? ` (${m.duree})` : ''}`)
        .join('\n');
    }

    // ── Construire les symptômes depuis anamnese / examen_clinique ─────────
    const symptomsArray = symptoms || (anamnese ? [anamnese] : []);

    const newConsultation = new Consultation({
      patientId: resolvedPatientId,
      doctorId: req.user.id,
      appointmentId: rvId ? parseInt(rvId) : null,
      consultationType: consultationType || 'Consultation',
      symptoms: symptomsArray,
      diagnosis: diagnosis || diagnostic_principal || '',
      treatment: treatment || conduite_a_tenir || '',
      prescription: prescriptionText,
      doctorNotes: doctorNotes || examen_clinique || '',
      consultationDate: consultationDate || new Date(),
    });

    await newConsultation.save();
    res.status(201).json({ message: 'Consultation créée avec succès', consultation: newConsultation });
  } catch (err) {
    console.error('createConsultation error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

