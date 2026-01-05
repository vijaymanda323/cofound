const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  user1Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user2Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  matchedAt: {
    type: Date,
    default: Date.now
  },
  lastInteraction: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  messageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
matchSchema.index({ user1Id: 1, isActive: 1 });
matchSchema.index({ user2Id: 1, isActive: 1 });
matchSchema.index({ matchedAt: -1 });
matchSchema.index({ lastInteraction: -1 });

// Ensure uniqueness of matches (prevent duplicate matches)
matchSchema.index({ user1Id: 1, user2Id: 1 }, { unique: true });

module.exports = mongoose.model('Match', matchSchema);
