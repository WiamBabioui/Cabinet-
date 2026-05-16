import mongoose from 'mongoose';

const ConsultationSchema = new mongoose.Schema({
  patientId: {
    type: Number, // MySQL Patient ID
    required: true
  },
  doctorId: {
    type: Number, // MySQL Doctor ID
    required: true
  },
  appointmentId: {
    type: Number, // MySQL Appointment ID
    required: false // Can be null if consultation is not tied to a specific appointment
  },
  consultationType: {
    type: String, // e.g., 'Initial', 'Follow-up', 'Emergency'
    required: true
  },
  symptoms: {
    type: [String], // Array of symptoms
    default: []
  },
  diagnosis: {
    type: String
  },
  treatment: {
    type: String
  },
  prescription: {
    type: String
  },
  doctorNotes: {
    type: String
  },
  attachments: {
    type: [String], // Array of attachment URLs/file paths
    default: []
  },
  consultationDate: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('Consultation', ConsultationSchema);
