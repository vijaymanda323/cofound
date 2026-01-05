const express = require('express');
const { query, validationResult } = require('express-validator');
const Match = require('../models/Match');
const Profile = require('../models/Profile');
const Message = require('../models/Message');
const Block = require('../models/Block');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all matches for current user
router.get('/', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const matches = await Match.find({
      $or: [
        { user1Id: currentUserId },
        { user2Id: currentUserId }
      ],
      isActive: true
    })
    .populate('user1Id', 'email')
    .populate('user2Id', 'email')
    .sort({ lastInteraction: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Get profiles for matched users
    const matchedProfiles = await Promise.all(
      matches.map(async (match) => {
        const otherUserId = match.user1Id.toString() === currentUserId.toString() 
          ? match.user2Id 
          : match.user1Id;
        
        const profile = await Profile.findOne({ 
          userId: otherUserId,
          isActive: true 
        });

        // Get last message
        const lastMessage = await Message.findOne({
          matchId: match._id,
          isDeleted: false
        })
        .sort({ createdAt: -1 })
        .populate('senderId', 'email');

        // Calculate distance
        const currentUserProfile = await Profile.findOne({ userId: currentUserId });
        let distance = null;
        
        if (currentUserProfile && profile) {
          distance = calculateDistance(
            currentUserProfile.location.coordinates,
            profile.location.coordinates
          );
        }

        return {
          matchId: match._id,
          user: profile,
          matchedAt: match.matchedAt,
          lastInteraction: match.lastInteraction,
          messageCount: match.messageCount,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            senderId: lastMessage.senderId._id,
            timestamp: lastMessage.createdAt,
            type: lastMessage.type
          } : null,
          distance: distance ? Math.round(distance) : null
        };
      })
    );

    // Filter out null profiles (deleted users)
    const validMatches = matchedProfiles.filter(match => match.user);

    res.json({
      matches: validMatches,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: validMatches.length
      }
    });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific match details
router.get('/:matchId', auth, async (req, res) => {
  try {
    const { matchId } = req.params;
    const currentUserId = req.user.id;

    const match = await Match.findOne({
      _id: matchId,
      $or: [
        { user1Id: currentUserId },
        { user2Id: currentUserId }
      ],
      isActive: true
    })
    .populate('user1Id', 'email')
    .populate('user2Id', 'email');

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const otherUserId = match.user1Id.toString() === currentUserId.toString() 
      ? match.user2Id 
      : match.user1Id;

    const profile = await Profile.findOne({ 
      userId: otherUserId,
      isActive: true 
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({
      match: {
        id: match._id,
        user: profile,
        matchedAt: match.matchedAt,
        lastInteraction: match.lastInteraction,
        messageCount: match.messageCount
      }
    });
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove connection (unmatch)
router.delete('/:matchId', auth, async (req, res) => {
  try {
    const { matchId } = req.params;
    const currentUserId = req.user.id;

    const match = await Match.findOne({
      _id: matchId,
      $or: [
        { user1Id: currentUserId },
        { user2Id: currentUserId }
      ],
      isActive: true
    });

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Deactivate match
    match.isActive = false;
    await match.save();

    // Soft delete messages
    await Message.updateMany(
      { matchId },
      { isDeleted: true }
    );

    res.json({ message: 'Connection removed successfully' });
  } catch (error) {
    console.error('Remove match error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Block user from match
router.post('/:matchId/block', auth, async (req, res) => {
  try {
    const { matchId } = req.params;
    const currentUserId = req.user.id;
    const { reason } = req.body;

    const match = await Match.findOne({
      _id: matchId,
      $or: [
        { user1Id: currentUserId },
        { user2Id: currentUserId }
      ],
      isActive: true
    });

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const otherUserId = match.user1Id.toString() === currentUserId.toString() 
      ? match.user2Id 
      : match.user1Id;

    // Create block record
    const block = new Block({
      userId: currentUserId,
      blockedUserId: otherUserId,
      reason: reason || ''
    });

    await block.save();

    // Deactivate match
    match.isActive = false;
    await match.save();

    // Soft delete messages
    await Message.updateMany(
      { matchId },
      { isDeleted: true }
    );

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get match statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const [totalMatches, activeMatches, recentMatches] = await Promise.all([
      Match.countDocuments({
        $or: [
          { user1Id: currentUserId },
          { user2Id: currentUserId }
        ]
      }),
      Match.countDocuments({
        $or: [
          { user1Id: currentUserId },
          { user2Id: currentUserId }
        ],
        isActive: true
      }),
      Match.countDocuments({
        $or: [
          { user1Id: currentUserId },
          { user2Id: currentUserId }
        ],
        isActive: true,
        matchedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      })
    ]);

    res.json({
      stats: {
        totalMatches,
        activeMatches,
        recentMatches
      }
    });
  } catch (error) {
    console.error('Match stats error:', error);
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

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI/180);
}

module.exports = router;
