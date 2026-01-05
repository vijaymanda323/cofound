const express = require('express');
const { body,query, validationResult } = require('express-validator');
const Message = require('../models/Message');
const Match = require('../models/Match');
const Profile = require('../models/Profile');
const auth = require('../middleware/auth');
const { sanitizeInput } = require('../utils/auth');

const router = express.Router();

// Get messages for a match
router.get('/:matchId', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { matchId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const currentUserId = req.user.id;

    // Verify user is part of the match
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

    // Get messages
    const messages = await Message.find({
      matchId,
      isDeleted: false
    })
    .populate('senderId', 'email')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Reverse to show oldest first
    const reversedMessages = messages.reverse();

    // Group messages by date
    const groupedMessages = [];
    let currentDate = null;

    for (const message of reversedMessages) {
      const messageDate = new Date(message.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateLabel;
      if (messageDate.toDateString() === today.toDateString()) {
        dateLabel = 'Today';
      } else if (messageDate.toDateString() === yesterday.toDateString()) {
        dateLabel = 'Yesterday';
      } else {
        dateLabel = messageDate.toLocaleDateString();
      }

      if (dateLabel !== currentDate) {
        currentDate = dateLabel;
        groupedMessages.push({
          type: 'date_separator',
          date: dateLabel,
          timestamp: messageDate
        });
      }

      groupedMessages.push({
        id: message._id,
        content: message.content,
        senderId: message.senderId._id,
        type: message.type,
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        fileSize: message.fileSize,
        status: message.status,
        timestamp: message.createdAt,
        isOwn: message.senderId._id.toString() === currentUserId.toString()
      });
    }

    res.json({
      messages: groupedMessages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.length === limit
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
router.post('/:matchId', auth, [
  body('content').notEmpty().trim().isLength({ max: 1000 }),
  body('type').optional().isIn(['text', 'image', 'document'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { matchId } = req.params;
    const { content, type = 'text', fileUrl, fileName, fileSize } = req.body;
    const currentUserId = req.user.id;

    // Verify user is part of the match
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

    // Create message
    const message = new Message({
      matchId,
      senderId: currentUserId,
      content: sanitizeInput(content),
      type,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      fileSize: fileSize || null,
      status: 'sent'
    });

    await message.save();

    // Update match last interaction and message count
    match.lastInteraction = new Date();
    match.messageCount += 1;
    await match.save();

    // Get sender profile for Socket.IO
    const senderProfile = await Profile.findOne({ userId: currentUserId });

    // Emit real-time message via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(matchId).emit('receive_message', {
        _id: message._id,
        content: message.content,
        senderId: currentUserId,
        type: message.type,
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        fileSize: message.fileSize,
        status: message.status,
        timestamp: message.createdAt,
        senderProfile: {
          fullName: senderProfile?.fullName,
          profilePhoto: senderProfile?.profilePhoto
        }
      });

      // Update message status to delivered for other user
      setTimeout(() => {
        io.to(matchId).emit('message_status', {
          messageId: message._id,
          status: 'delivered'
        });
      }, 1000);
    }

    res.status(201).json({
      message: 'Message sent successfully',
      data: {
        id: message._id,
        content: message.content,
        senderId: message.senderId,
        type: message.type,
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        fileSize: message.fileSize,
        status: message.status,
        timestamp: message.createdAt
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.put('/:matchId/read', auth, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { messageIds } = req.body; // Array of message IDs to mark as read
    const currentUserId = req.user.id;

    // Verify user is part of the match
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

    // Update messages that are not sent by current user
    const updateQuery = {
      matchId,
      senderId: { $ne: currentUserId },
      status: { $ne: 'read' }
    };

    if (messageIds && messageIds.length > 0) {
      updateQuery._id = { $in: messageIds };
    }

    const result = await Message.updateMany(
      updateQuery,
      {
        status: 'read',
        readAt: new Date()
      }
    );

    // Emit read status via Socket.IO
    const io = req.app.get('io');
    if (io && result.modifiedCount > 0) {
      const updatedMessages = await Message.find({
        ...updateQuery,
        status: 'read'
      });

      updatedMessages.forEach(message => {
        io.to(matchId).emit('message_status', {
          messageId: message._id,
          status: 'read',
          readBy: currentUserId
        });
      });
    }

    res.json({
      message: 'Messages marked as read',
      count: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark messages read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete message (soft delete)
router.delete('/:matchId/:messageId', auth, async (req, res) => {
  try {
    const { matchId, messageId } = req.params;
    const currentUserId = req.user.id;

    // Verify user is part of the match
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

    // Verify message belongs to user or allow deletion of own messages only
    const message = await Message.findOne({
      _id: messageId,
      matchId,
      senderId: currentUserId
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found or not authorized' });
    }

    // Soft delete message
    message.isDeleted = true;
    await message.save();

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get chat statistics
router.get('/:matchId/stats', auth, async (req, res) => {
  try {
    const { matchId } = req.params;
    const currentUserId = req.user.id;

    // Verify user is part of the match
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

    const [totalMessages, sentMessages, receivedMessages, unreadMessages] = await Promise.all([
      Message.countDocuments({ matchId, isDeleted: false }),
      Message.countDocuments({ matchId, senderId: currentUserId, isDeleted: false }),
      Message.countDocuments({ matchId, senderId: { $ne: currentUserId }, isDeleted: false }),
      Message.countDocuments({ 
        matchId, 
        senderId: { $ne: currentUserId }, 
        status: { $ne: 'read' },
        isDeleted: false 
      })
    ]);

    res.json({
      stats: {
        totalMessages,
        sentMessages,
        receivedMessages,
        unreadMessages
      }
    });
  } catch (error) {
    console.error('Chat stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
