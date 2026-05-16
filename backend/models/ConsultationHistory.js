import mongoose from 'mongoose';

const prescriptionItemSchema = new mongoose.Schema({
  medicament: String,
  posologie: String,
  duree: String,
  instructions: String
}, { _id: false });

const attachmentSchema = new mongoose.Schema({
  fileName: String,
  fileUrl: String,
  fileType: String,
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const consultationHistorySchema = new mongoose.Schema({
  patientId: {
    type: Number,
    required: true
  },
  doctorId: {
    type: Number,
    required: true
  },
  appointmentId: {
    type: Number,
    required: true
  },
  consultationType: {
    type: String,
    enum: [
      'premiere_consultation',
      'suivi',
      'urgence',
      'teleconsultation',
      'bilan'
    ],
    required: true
  },
  vitals: {
    poids_kg: Number,
    taille_cm: Number,
    tension_sys: Number,
    tension_dia: Number,
    temperature: Number,
    frequence_cardiaque: Number,
    spo2: Number
  },
  symptoms: String,
  anamnese: String,
  examen_clinique: String,
  diagnosis: String,
  codes_cim10: String,
  treatment: String,
  prescription: [prescriptionItemSchema],
  doctorNotes: String,
  followUp: String,
  attachments: [attachmentSchema],
  consultationDate: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Indexes
consultationHistorySchema.index({ patientId: 1, consultationDate: -1 });
consultationHistorySchema.index({ doctorId: 1, consultationDate: -1 });
consultationHistorySchema.index({ patientId: 1, createdAt: -1 });

// Text Search Index
consultationHistorySchema.index({
  diagnosis: 'text',
  symptoms: 'text',
  anamnese: 'text',
  doctorNotes: 'text'
});

export default mongoose.model('ConsultationHistory', consultationHistorySchema);
