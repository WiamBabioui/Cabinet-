import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: [
      'appointment_new',
      'appointment_confirmed',
      'appointment_cancelled',
      'appointment_completed',
      'message_new',
      'patient_new',
      'system_alert',
      'system_welcome',
      'info',
      'appointment'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

export default mongoose.model('Notification', notificationSchema);
