const mongoose = require('mongoose');

const industrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50
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

industrySchema.index({ name: 1 });
industrySchema.index({ isPopular: 1 });

module.exports = mongoose.model('Industry', industrySchema);
