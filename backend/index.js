const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const discoveryRoutes = require('./routes/discovery');
const matchRoutes = require('./routes/match');
const chatRoutes = require('./routes/chat');
const documentRoutes = require('./routes/document');
const settingsRoutes = require('./routes/settings');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:19006",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/found');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Socket.IO connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('user_online', (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.userId = userId;
    
    // Notify other users that this user is online
    socket.broadcast.emit('user_status_changed', { userId, status: 'online' });
  });

  socket.on('join_chat', (matchId) => {
    socket.join(matchId);
  });

  socket.on('send_message', (data) => {
    const { matchId, message, senderId } = data;
    
    // Broadcast message to all users in the chat room
    socket.to(matchId).emit('receive_message', {
      ...message,
      senderId,
      timestamp: new Date()
    });

    // Update message status to delivered
    socket.to(matchId).emit('message_status', {
      messageId: message._id,
      status: 'delivered'
    });
  });

  socket.on('message_read', (data) => {
    const { matchId, messageId, userId } = data;
    
    // Notify sender that message was read
    socket.to(matchId).emit('message_status', {
      messageId,
      status: 'read',
      readBy: userId
    });
  });

  socket.on('typing_start', (data) => {
    const { matchId, userId } = data;
    socket.to(matchId).emit('user_typing', { userId, typing: true });
  });

  socket.on('typing_stop', (data) => {
    const { matchId, userId } = data;
    socket.to(matchId).emit('user_typing', { userId, typing: false });
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      
      // Notify other users that this user is offline
      socket.broadcast.emit('user_status_changed', { 
        userId: socket.userId, 
        status: 'offline' 
      });
    }
    console.log('User disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);
app.set('connectedUsers', connectedUsers);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/settings', settingsRoutes);

// 🔍 MongoDB read/write test route
app.get('/mongo-test', async (req, res) => {
  try {
    const User = require('./models/User');

    const user = await User.create({
      email: `test@example.com`,
      password: 'Test@12345'
    });

    const found = await User.findById(user._id);

    res.json({
      write: 'SUCCESS',
      read: 'SUCCESS',
      userId: found._id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };
