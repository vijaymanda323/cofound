const mongoose = require('mongoose');
const Profile = require('../models/Profile');
const User = require('../models/User');
require('dotenv').config();

const diagnose = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/found';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // Get a random user to check their discovery
        const user = await User.findOne();
        if (!user) {
            console.log('No users found in database.');
            process.exit(0);
        }

        console.log(`Diagnosing for User: ${user.email} (${user._id})`);

        const profile = await Profile.findOne({ userId: user._id });
        if (!profile) {
            console.log('❌ User has NO profile. This is why discovery is empty.');
        } else {
            console.log('✅ User has profile.');
            console.log('Location:', JSON.stringify(profile.location));
            console.log('Active:', profile.isActive);
            console.log('Discovery Settings:', JSON.stringify(profile.discoverSettings));

            // Check how many other profiles exist
            const othersCount = await Profile.countDocuments({
                userId: { $ne: user._id },
                isActive: true
            });
            console.log(`Total other active profiles in DB: ${othersCount}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

diagnose();
