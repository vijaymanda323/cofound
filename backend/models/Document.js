const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true,
    maxlength: 255
  },
  originalName: {
    type: String,
    required: true,
    maxlength: 255
  },
  fileType: {
    type: String,
    required: true,
    enum: ['pdf', 'docx', 'doc', 'ppt', 'pptx', 'jpg', 'jpeg', 'png']
  },
  fileSize: {
    type: Number,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  documentType: {
    type: String,
    enum: ['profile', 'verification', 'education', 'work', 'other'],
    default: 'other'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  verificationNotes: {
    type: String,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient document queries
documentSchema.index({ userId: 1, documentType: 1 });
documentSchema.index({ verificationStatus: 1 });
documentSchema.index({ fileType: 1 });
documentSchema.index({ isActive: 1 });

module.exports = mongoose.model('Document', documentSchema);
