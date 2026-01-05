const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true, // email or phone number
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['email', 'phone']
  },
  code: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 6
  },
  purpose: {
    type: String,
    required: true,
    enum: ['registration', 'password_reset', 'email_verification', 'phone_verification']
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true,
    default: Date.now,
    expires: 300 // 5 minutes
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient OTP queries
otpSchema.index({ identifier: 1, type: 1, purpose: 1 });
otpSchema.index({ code: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OTP', otpSchema);
