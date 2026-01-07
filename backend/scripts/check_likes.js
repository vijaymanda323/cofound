const mongoose = require('mongoose');
const Like = require('../models/Like');
const User = require('../models/User');
const Match = require('../models/Match');
require('dotenv').config();

const checkLikes = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/found';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const likesCount = await Like.countDocuments();
        console.log(`Total Likes in DB: ${likesCount}`);

        const matchesCount = await Match.countDocuments();
        console.log(`Total Matches in DB: ${matchesCount}`);

        const latestLikes = await Like.find().sort({ createdAt: -1 }).limit(10).populate('fromUserId', 'email').populate('toUserId', 'email');
        latestLikes.forEach(l => {
            console.log(`${l.fromUserId.email} swiped ${l.type} on ${l.toUserId.email}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkLikes();
