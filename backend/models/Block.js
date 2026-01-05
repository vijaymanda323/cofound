const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  blockedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    maxlength: 200
  },
  count: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound indexes to prevent duplicate blocks and for efficient queries
blockSchema.index({ userId: 1, blockedUserId: 1 }, { unique: true });
blockSchema.index({ userId: 1, isActive: 1 });
blockSchema.index({ blockedUserId: 1, isActive: 1 });

module.exports = mongoose.model('Block', blockSchema);
