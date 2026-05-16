import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: {
    type: [Number],
    required: true,
    validate: [arr => arr.length === 2, 'Conversation must have exactly 2 participants']
  },
  lastMessage: {
    type: String,
    maxLength: 100
  },
  lastMessageAt: {
    type: Date
  },
  unreadCounts: {
    type: Map,
    of: Number,
    default: {}
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Indexes
conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });

export default mongoose.model('Conversation', conversationSchema);
