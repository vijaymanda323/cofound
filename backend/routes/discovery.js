const express = require('express');
const { query, validationResult } = require('express-validator');
const Profile = require('../models/Profile');
const Like = require('../models/Like');
const Block = require('../models/Block');
const Match = require('../models/Match');
const auth = require('../middleware/auth');

const router = express.Router();

// Get next profile for discovery
router.get('/next', auth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const currentUserId = req.user.id;

    // Get current user's profile and settings
    const currentUserProfile = await Profile.findOne({ userId: currentUserId });
    if (!currentUserProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Get users already liked/blocked by current user
    const likedUsers = await Like.find({ fromUserId: currentUserId })
      .distinct('toUserId');

    const blockedUsers = await Block.find({
      userId: currentUserId,
      isActive: true
    }).distinct('blockedUserId');

    const usersWhoBlockedMe = await Block.find({
      blockedUserId: currentUserId,
      isActive: true
    }).distinct('userId');

    // Get users already matched with current user
    const matchedUsers = await Match.find({
      $or: [
        { user1Id: currentUserId },
        { user2Id: currentUserId }
      ],
      isActive: true
    }).select('user1Id user2Id');

    const matchedUserIds = matchedUsers.map(match =>
      match.user1Id.toString() === currentUserId.toString()
        ? match.user2Id
        : match.user1Id
    );

    // Combine all excluded user IDs
    const excludedUserIds = [
      currentUserId,
      ...likedUsers,
      ...blockedUsers,
      ...usersWhoBlockedMe,
      ...matchedUserIds
    ];

    // Build discovery query
    const discoveryQuery = {
      userId: { $nin: excludedUserIds },
      isActive: true,
      'location.coordinates': {
        $near: {
          $geometry: currentUserProfile.location,
          $maxDistance: currentUserProfile.discoverSettings.maxDistance * 1000 // Convert km to meters
        }
      }
    };

    // Add age filter if specified
    const currentYear = new Date().getFullYear();
    if (currentUserProfile.discoverSettings.minAge) {
      const minBirthYear = currentYear - currentUserProfile.discoverSettings.maxAge;
      discoveryQuery.yearOfBirth = { $gte: minBirthYear };
    }

    if (currentUserProfile.discoverSettings.maxAge) {
      const maxBirthYear = currentYear - currentUserProfile.discoverSettings.minAge;
      discoveryQuery.yearOfBirth = discoveryQuery.yearOfBirth || {};
      discoveryQuery.yearOfBirth.$lte = maxBirthYear;
    }

    // Add goal filter if specified
    const preferredGoals = currentUserProfile.discoverSettings.goalOverride
      ? [currentUserProfile.discoverSettings.goalOverride]
      : currentUserProfile.discoverSettings.preferredGoals;

    if (preferredGoals?.length > 0) {
      discoveryQuery.goal = { $in: preferredGoals };
    }

    // Add skills filter if specified
    if (currentUserProfile.discoverSettings.preferredSkills?.length > 0) {
      discoveryQuery['skills.name'] = { $in: currentUserProfile.discoverSettings.preferredSkills };
    }

    // Add industries filter if specified
    if (currentUserProfile.discoverSettings.preferredIndustries?.length > 0) {
      discoveryQuery.industries = { $in: currentUserProfile.discoverSettings.preferredIndustries };
    }

    // Find next profile
    const nextProfile = await Profile.findOne(discoveryQuery)
      .populate('userId', 'email')
      .sort({ 'location.coordinates': 1 });

    if (nextProfile) {
      // Increment viewCount
      nextProfile.viewCount = (nextProfile.viewCount || 0) + 1;
      await nextProfile.save();
    }

    if (!nextProfile) {
      return res.json({
        message: 'No more profiles found. Try expanding your filters.',
        profile: null
      });
    }

    // Calculate distance
    const distance = calculateDistance(
      currentUserProfile.location.coordinates,
      nextProfile.location.coordinates
    );

    res.json({
      profile: {
        ...nextProfile.toObject(),
        distance: Math.round(distance)
      }
    });
  } catch (error) {
    console.error('Discovery next error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Pass a profile
router.post('/action', auth, [
  query('profileId').notEmpty(),
  query('action').isIn(['yes', 'no'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { profileId, action } = req.query;
    const fromUserId = req.user.id;

    // Get target user ID from profile
    const targetProfile = await Profile.findOne({ userId: profileId });
    if (!targetProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const toUserId = targetProfile.userId;

    // Check if already liked/blocked
    const existingLike = await Like.findOne({
      fromUserId,
      toUserId
    });

    if (existingLike) {
      return res.status(400).json({ message: 'Already interacted with this profile' });
    }

    // Create like record
    const like = new Like({
      fromUserId,
      toUserId,
      type: action
    });

    await like.save();

    // If action is 'yes', check for mutual match
    if (action === 'yes') {
      const mutualLike = await Like.findOne({
        fromUserId: toUserId,
        toUserId: fromUserId,
        type: 'yes'
      });

      if (mutualLike) {
        // Create match
        const match = new Match({
          user1Id: fromUserId,
          user2Id: toUserId,
          initiatedBy: fromUserId
        });

        await match.save();

        // Emit match event via Socket.IO
        const io = req.app.get('io');
        const connectedUsers = req.app.get('connectedUsers');

        // Fetch current user profile for socket data
        const currentUserProfile = await Profile.findOne({ userId: fromUserId });

        if (io) {
          // Notify both users
          const user1SocketId = connectedUsers.get(fromUserId.toString());
          const user2SocketId = connectedUsers.get(toUserId.toString());

          if (user1SocketId) {
            io.to(user1SocketId).emit('new_match', {
              id: match._id,
              user: targetProfile,
              matchedAt: match.matchedAt
            });
          }

          if (user2SocketId) {
            io.to(user2SocketId).emit('new_match', {
              id: match._id,
              user: currentUserProfile,
              matchedAt: match.matchedAt
            });
          }
        }

        return res.json({
          message: 'Connection established!',
          match: true,
          matchData: {
            id: match._id,
            user: targetProfile,
            matchedAt: match.matchedAt
          }
        });
      }
    }

    res.json({
      message: `Profile ${action === 'yes' ? 'liked' : 'passed'} successfully`,
      match: false
    });
  } catch (error) {
    console.error('Discovery action error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get discovery statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const [likesGiven, likesReceived, passesGiven] = await Promise.all([
      Like.countDocuments({ fromUserId: currentUserId, type: 'yes' }),
      Like.countDocuments({ toUserId: currentUserId, type: 'yes' }),
      Like.countDocuments({ fromUserId: currentUserId, type: 'no' })
    ]);

    const matches = await Match.countDocuments({
      $or: [
        { user1Id: currentUserId },
        { user2Id: currentUserId }
      ],
      isActive: true
    });

    res.json({
      stats: {
        likesGiven,
        likesReceived,
        passesGiven,
        matches,
        totalInteractions: likesGiven + passesGiven
      }
    });
  } catch (error) {
    console.error('Discovery stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to calculate distance between two coordinates
function calculateDistance(coords1, coords2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(coords2[1] - coords1[1]);
  const dLon = toRad(coords2[0] - coords1[0]);
  const lat1 = toRad(coords1[1]);
  const lat2 = toRad(coords2[1]);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

module.exports = router;
