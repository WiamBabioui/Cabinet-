import Consultation from '../models/Consultation.js';

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
      appointmentId, 
      consultationType, 
      symptoms, 
      diagnosis, 
      treatment, 
      prescription, 
      doctorNotes,
      consultationDate 
    } = req.body;

    const newConsultation = new Consultation({
      patientId: parseInt(patientId),
      doctorId: req.user.id,
      appointmentId: appointmentId ? parseInt(appointmentId) : null,
      consultationType,
      symptoms,
      diagnosis,
      treatment,
      prescription,
      doctorNotes,
      consultationDate: consultationDate || new Date()
    });

    await newConsultation.save();
    res.status(201).json({ message: 'Consultation créée avec succès', consultation: newConsultation });
  } catch (err) {
    console.error('createConsultation error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
