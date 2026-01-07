const mongoose = require('mongoose');
const User = require('../models/User');
const Profile = require('../models/Profile');
require('dotenv').config();

const listAll = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/found';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const users = await User.find();
        console.log(`\n--- ALL USERS (${users.length}) ---`);
        for (const u of users) {
            const p = await Profile.findOne({ userId: u._id });
            console.log(`${u.email} | Profile: ${p ? '✅' : '❌'}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

listAll();
