const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: String,
    country: String
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say']
  },
  yearOfBirth: {
    type: Number,
    min: 1920,
    max: 2006
  },
  mission: {
    type: String,
    required: true,
    maxlength: 500
  },
  goal: {
    type: String,
    required: true,
    enum: [
      'I have a startup',
      'I have startup ideas, looking for co-founder',
      'I want to join someone\'s startup'
    ]
  },
  skills: [{
    name: {
      type: String,
      required: true,
      maxlength: 50
    },
    level: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    },
    isCustom: {
      type: Boolean,
      default: false
    }
  }],
  industries: [{
    type: String,
    maxlength: 50
  }],
  experience: {
    type: Number,
    min: 0,
    max: 70,
    default: 0
  },
  role: {
    type: String,
    enum: ['Co-Founder', 'Team Member', 'Investor', 'Mentor'],
    default: 'Co-Founder'
  },
  equityRange: {
    type: String
  },
  bio: {
    type: String,
    maxlength: 200
  },
  education: {
    college: String,
    university: String,
    degree: String,
    field: String,
    graduationYear: Number
  },
  linkedinUrl: {
    type: String,
    validate: {
      validator: function (v) {
        return !v || /^https?:\/\/(www\.)?linkedin\.com\/.*/.test(v);
      },
      message: 'Invalid LinkedIn URL format'
    }
  },
  profilePhoto: {
    type: String, // URL to uploaded photo
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDocuments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  discoverSettings: {
    maxDistance: {
      type: Number,
      default: 100, // km
      min: 1,
      max: 1000
    },
    minAge: {
      type: Number,
      default: 18,
      min: 18
    },
    maxAge: {
      type: Number,
      default: 65,
      max: 100
    },
    preferredGoals: [{
      type: String
    }],
    preferredSkills: [{
      type: String
    }],
    preferredIndustries: [{
      type: String
    }],
    goalOverride: {
      type: String,
      enum: [
        'I have a startup',
        'I have startup ideas, looking for co-founder',
        'I want to join someone\'s startup',
        null
      ],
      default: null
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Geospatial index for location-based queries
profileSchema.index({ location: '2dsphere' });

// Compound indexes for efficient filtering
profileSchema.index({ 'location.coordinates': '2dsphere' });
profileSchema.index({ skills: 1 });
profileSchema.index({ industries: 1 });
profileSchema.index({ goal: 1 });
profileSchema.index({ isVerified: 1 });
profileSchema.index({ isActive: 1 });

module.exports = mongoose.model('Profile', profileSchema);
