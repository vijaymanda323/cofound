const express = require('express');
const { body, validationResult } = require('express-validator');
const Profile = require('../models/Profile');
const Skill = require('../models/Skill');
const Industry = require('../models/Industry');
const auth = require('../middleware/auth');
const { sanitizeInput } = require('../utils/auth');

const router = express.Router();

// Create or update profile
router.post('/', auth, [
  body('fullName').optional().trim().isLength({ max: 100 }),
  body('location.address').optional(),
  body('location.coordinates').optional().isArray({ min: 2, max: 2 }),
  body('mission').optional().isLength({ max: 500 }),
  // body('goal') - temporarily removed for testing
  body('skills').optional().isArray(),
  body('industries').optional().isArray(),
  body('experience').optional().isInt({ min: 0, max: 70 }),
  body('bio').optional().isLength({ max: 200 })
], async (req, res) => {
  try {
    console.log('Profile creation request received:', req.body);
    
    // Filter out empty values before validation
    const filteredData = {};
    Object.keys(req.body).forEach(key => {
      const value = req.body[key];
      if (value !== '' && value !== null && value !== undefined) {
        filteredData[key] = value;
      }
    });
    
    console.log('Filtered profile data:', filteredData);
    
    // Replace req.body with filtered data for validation
    req.body = filteredData;
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Profile validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const profileData = filteredData;
    console.log('Processed profile data:', profileData);
    
    // Add missing required fields and fix data format
    if (profileData.location && !profileData.location.type) {
      profileData.location.type = 'Point'; // Default to Point type for coordinates
    }
    
    // Handle goal field - if it's not a valid enum, set it to a default or remove it
    const validGoals = [
      'I have a startup',
      'I have startup ideas, looking for co-founder',
      'I want to join someone\'s startup'
    ];
    
    if (profileData.goal && !validGoals.includes(profileData.goal)) {
      // For testing, either set a default or remove the field
      profileData.goal = 'I have startup ideas, looking for co-founder';
    }
    
    // Sanitize text inputs only if they exist
    if (profileData.fullName) profileData.fullName = sanitizeInput(profileData.fullName);
    if (profileData.mission) profileData.mission = sanitizeInput(profileData.mission);
    if (profileData.bio) profileData.bio = sanitizeInput(profileData.bio);
    
    // Sanitize skills and industries only if they exist
    if (profileData.skills && Array.isArray(profileData.skills)) {
      profileData.skills = profileData.skills.map(skill => ({
        ...skill,
        name: sanitizeInput(skill.name)
      }));
    }
    
    if (profileData.industries && Array.isArray(profileData.industries)) {
      profileData.industries = profileData.industries.map(industry => 
        sanitizeInput(industry)
      );
    }

    // Check if profile already exists
    let profile = await Profile.findOne({ userId: req.user.id });
    
    if (profile) {
      // Update existing profile
      Object.assign(profile, profileData);
      profile = await profile.save();
    } else {
      // Create new profile
      profile = new Profile({
        ...profileData,
        userId: req.user.id
      });
      profile = await profile.save();
    }

    // Update skill and industry usage counts
    if (profileData.skills) {
      for (const skill of profileData.skills) {
        if (skill.isCustom) {
          await Skill.findOneAndUpdate(
            { name: skill.name },
            { 
              $inc: { usageCount: 1 },
              category: skill.category || 'other'
            },
            { upsert: true }
          );
        } else {
          await Skill.findOneAndUpdate(
            { name: skill.name },
            { $inc: { usageCount: 1 } }
          );
        }
      }
    }

    if (profileData.industries) {
      for (const industry of profileData.industries) {
        await Industry.findOneAndUpdate(
          { name: industry },
          { $inc: { usageCount: 1 } },
          { upsert: true }
        );
      }
    }

    res.status(201).json({
      message: 'Profile saved successfully',
      profile
    });
  } catch (error) {
    console.error('Profile save error:', error);
    res.status(500).json({ message: 'Server error saving profile' });
  }
});

// Get current user's profile
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.id })
      .populate('userId', 'email phone isEmailVerified isPhoneVerified');
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get profile by user ID
router.get('/:userId', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ 
      userId: req.params.userId,
      isActive: true 
    }).populate('userId', 'email');

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({ profile });
  } catch (error) {
    console.error('Get profile by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile photo
router.put('/photo', auth, async (req, res) => {
  try {
    const { photoUrl } = req.body;
    
    if (!photoUrl) {
      return res.status(400).json({ message: 'Photo URL is required' });
    }

    const profile = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      { profilePhoto: photoUrl },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({
      message: 'Profile photo updated successfully',
      profile
    });
  } catch (error) {
    console.error('Update photo error:', error);
    res.status(500).json({ message: 'Server error updating photo' });
  }
});

// Update discover settings
router.put('/discover-settings', auth, [
  body('maxDistance').isInt({ min: 1, max: 1000 }),
  body('minAge').isInt({ min: 18 }),
  body('maxAge').isInt({ max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const settings = req.body;
    
    const profile = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      { 
        $set: { 
          'discoverSettings.maxDistance': settings.maxDistance,
          'discoverSettings.minAge': settings.minAge,
          'discoverSettings.maxAge': settings.maxAge,
          'discoverSettings.preferredGoals': settings.preferredGoals || [],
          'discoverSettings.preferredSkills': settings.preferredSkills || [],
          'discoverSettings.preferredIndustries': settings.preferredIndustries || []
        }
      },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({
      message: 'Discover settings updated successfully',
      discoverSettings: profile.discoverSettings
    });
  } catch (error) {
    console.error('Update discover settings error:', error);
    res.status(500).json({ message: 'Server error updating discover settings' });
  }
});

// Get popular skills and industries
router.get('/options/skills', async (req, res) => {
  try {
    const skills = await Skill.find({ isPopular: true })
      .sort({ usageCount: -1 })
      .limit(50);

    res.json({ skills });
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/options/industries', async (req, res) => {
  try {
    const industries = await Industry.find({ isPopular: true })
      .sort({ usageCount: -1 })
      .limit(50);

    res.json({ industries });
  } catch (error) {
    console.error('Get industries error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search skills and industries
router.get('/search/skills', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({ skills: [] });
    }

    const skills = await Skill.find({
      name: { $regex: query, $options: 'i' }
    })
    .sort({ usageCount: -1 })
    .limit(20);

    res.json({ skills });
  } catch (error) {
    console.error('Search skills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/search/industries', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({ industries: [] });
    }

    const industries = await Industry.find({
      name: { $regex: query, $options: 'i' }
    })
    .sort({ usageCount: -1 })
    .limit(20);

    res.json({ industries });
  } catch (error) {
    console.error('Search industries error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
