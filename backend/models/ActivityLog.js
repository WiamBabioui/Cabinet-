import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true
  },
  patientId: {
    type: Number,
    default: null
  },
  action: {
    type: String,
    required: true
  },
  module: {
    type: String,
    enum: [
      'auth',
      'appointments',
      'patients',
      'consultations',
      'chat',
      'notifications',
      'users',
      'medecins',
      'system'
    ],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ patientId: 1, createdAt: -1 });
activityLogSchema.index({ module: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });

// TTL Index for auto-deletion after 1 year (31536000 seconds)
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

export default mongoose.model('ActivityLog', activityLogSchema);
