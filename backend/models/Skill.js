const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50
  },
  category: {
    type: String,
    required: true,
    enum: [
      'technical',
      'business',
      'design',
      'marketing',
      'sales',
      'operations',
      'finance',
      'legal',
      'other'
    ]
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

skillSchema.index({ name: 1 });
skillSchema.index({ category: 1 });
skillSchema.index({ isPopular: 1 });

module.exports = mongoose.model('Skill', skillSchema);
