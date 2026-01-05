const express = require('express');
const { body, validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');
const Profile = require('../models/Profile');
const User = require('../models/User');
const Block = require('../models/Block');
const Document = require('../models/Document');
const { sendFeedbackEmail } = require('../utils/email');
const { sanitizeInput } = require('../utils/auth');
const auth = require('../middleware/auth');

const router = express.Router();

// Submit feedback
router.post('/feedback', auth, [
  body('content').notEmpty().trim().isLength({ min: 1, max: 200 }),
  body('type').optional().isIn(['bug', 'feature', 'general', 'complaint', 'compliment']),
  body('rating').optional().isInt({ min: 1, max: 5 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, type = 'general', rating } = req.body;
    const currentUserId = req.user.id;

    // Get user details
    const user = await User.findById(currentUserId);
    const profile = await Profile.findOne({ userId: currentUserId });

    // Create feedback record
    const feedback = new Feedback({
      userId: currentUserId,
      content: sanitizeInput(content),
      type,
      rating,
      email: user.email,
      isAnonymous: false
    });

    await feedback.save();

    // Send email notification
    const emailData = {
      content,
      type,
      rating,
      email: user.email,
      userName: profile?.fullName || user.email
    };

    const emailSent = await sendFeedbackEmail(emailData);
    
    if (!emailSent) {
      console.error('Failed to send feedback email');
    }

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: {
        id: feedback._id,
        content: feedback.content,
        type: feedback.type,
        rating: feedback.rating,
        status: feedback.status,
        createdAt: feedback.createdAt
      }
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ message: 'Server error submitting feedback' });
  }
});

// Get verification status
router.get('/verification', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const profile = await Profile.findOne({ userId: currentUserId })
      .populate('verificationDocuments');

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const verificationDocuments = profile.verificationDocuments || [];
    const verifiedDocuments = verificationDocuments.filter(doc => doc.verificationStatus === 'approved');
    
    const isVerified = profile.isVerified || verifiedDocuments.length > 0;

    res.json({
      verificationStatus: {
        isVerified,
        verificationDocuments: verificationDocuments.map(doc => ({
          id: doc._id,
          fileName: doc.originalName,
          fileType: doc.fileType,
          verificationStatus: doc.verificationStatus,
          verificationNotes: doc.verificationNotes,
          uploadedAt: doc.uploadedAt
        })),
        overallStatus: isVerified ? 'verified' : 'not_verified'
      }
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get blocked users
router.get('/blocked', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const blockedUsers = await Block.find({
      userId: currentUserId,
      isActive: true
    })
    .populate('blockedUserId', 'email')
    .sort({ createdAt: -1 });

    // Get profiles for blocked users
    const blockedProfiles = await Promise.all(
      blockedUsers.map(async (block) => {
        const profile = await Profile.findOne({ 
          userId: block.blockedUserId._id,
          isActive: true 
        });

        return {
          blockId: block._id,
          user: profile,
          reason: block.reason,
          blockedAt: block.createdAt,
          count: block.count
        };
      })
    );

    // Filter out null profiles (deleted users)
    const validBlockedUsers = blockedProfiles.filter(block => block.user);

    res.json({
      blockedUsers: validBlockedUsers
    });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Block user
router.post('/block', auth, [
  body('userId').notEmpty(),
  body('reason').optional().trim().isLength({ max: 200 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId: targetUserId, reason } = req.body;
    const currentUserId = req.user.id;

    // Check if already blocked
    const existingBlock = await Block.findOne({
      userId: currentUserId,
      blockedUserId: targetUserId,
      isActive: true
    });

    if (existingBlock) {
      return res.status(400).json({ message: 'User already blocked' });
    }

    // Create block record
    const block = new Block({
      userId: currentUserId,
      blockedUserId: targetUserId,
      reason: sanitizeInput(reason) || ''
    });

    await block.save();

    res.status(201).json({
      message: 'User blocked successfully',
      block: {
        id: block._id,
        reason: block.reason,
        blockedAt: block.createdAt
      }
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unblock user
router.delete('/block/:blockId', auth, async (req, res) => {
  try {
    const { blockId } = req.params;
    const currentUserId = req.user.id;

    const block = await Block.findOne({
      _id: blockId,
      userId: currentUserId,
      isActive: true
    });

    if (!block) {
      return res.status(404).json({ message: 'Block record not found' });
    }

    // Deactivate block
    block.isActive = false;
    await block.save();

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get discover settings
router.get('/discover', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const profile = await Profile.findOne({ userId: currentUserId });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({
      discoverSettings: profile.discoverSettings
    });
  } catch (error) {
    console.error('Get discover settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update discover settings
router.put('/discover', auth, [
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
    const currentUserId = req.user.id;

    const profile = await Profile.findOneAndUpdate(
      { userId: currentUserId },
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
    res.status(500).json({ message: 'Server error' });
  }
});

// Get account settings
router.get('/account', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const user = await User.findById(currentUserId).select('-password');
    const profile = await Profile.findOne({ userId: currentUserId });

    res.json({
      account: {
        user: {
          email: user.email,
          phone: user.phone,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          registrationStep: user.registrationStep,
          createdAt: user.createdAt
        },
        profile: profile ? {
          fullName: profile.fullName,
          isVerified: profile.isVerified,
          profilePhoto: profile.profilePhoto,
          lastSeen: profile.lastSeen
        } : null
      }
    });
  } catch (error) {
    console.error('Get account settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete account
router.delete('/account', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Deactivate user account
    await User.findByIdAndUpdate(currentUserId, { isActive: false });
    
    // Deactivate profile
    await Profile.findOneAndUpdate(
      { userId: currentUserId },
      { isActive: false }
    );

    // Deactivate all blocks (both as blocker and blocked)
    await Block.updateMany(
      { 
        $or: [
          { userId: currentUserId },
          { blockedUserId: currentUserId }
        ]
      },
      { isActive: false }
    );

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get help and support info
router.get('/support', auth, async (req, res) => {
  try {
    const supportInfo = {
      whatsappQR: 'https://wa.me/919876543210', // Example WhatsApp number
      supportEmail: 'support@found.com',
      helpArticles: [
        {
          id: 1,
          title: 'How to create a compelling profile',
          content: 'Learn tips and tricks to make your profile stand out...'
        },
        {
          id: 2,
          title: 'Understanding the matching algorithm',
          content: 'Find out how we connect you with potential co-founders...'
        },
        {
          id: 3,
          title: 'Safety and verification guidelines',
          content: 'Important information about staying safe on Found...'
        }
      ],
      faqs: [
        {
          question: 'How do I verify my profile?',
          answer: 'Upload your documents in the verification section of settings.'
        },
        {
          question: 'Can I block someone?',
          answer: 'Yes, you can block users from the chat menu or settings.'
        },
        {
          question: 'How does matching work?',
          answer: 'When both users tap Yes on each other\'s profiles, a match is created.'
        }
      ]
    };

    res.json({ supportInfo });
  } catch (error) {
    console.error('Get support info error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
