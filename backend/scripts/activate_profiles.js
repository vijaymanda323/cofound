const mongoose = require('mongoose');
const User = require('../models/User');
const Profile = require('../models/Profile');
require('dotenv').config();

const activateUsers = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/found';
        console.log('Connecting to:', mongoUri);
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const users = await User.find();
        console.log(`Found ${users.length} total users.`);

        let profilesCreated = 0;

        for (const user of users) {
            const existingProfile = await Profile.findOne({ userId: user._id });

            if (!existingProfile) {
                console.log(`Creating profile for ${user.email}...`);

                const newProfile = new Profile({
                    userId: user._id,
                    fullName: user.email.split('@')[0],
                    location: {
                        type: 'Point',
                        coordinates: [78.4867, 17.3850], // Default Hyderabad (optional)
                        address: 'Hyderabad, India',
                        city: 'Hyderabad',
                        country: 'India'
                    },
                    mission: 'Looking for a brilliant co-founder to build the future.',
                    goal: 'I have startup ideas, looking for co-founder',
                    skills: [{ name: 'Strategy', level: 8 }],
                    industries: ['Technology'],
                    bio: 'Looking to connect with other founders!',
                    isActive: true
                });

                await newProfile.save();

                // Mark user as fully registered
                user.registrationStep = 2; // Assuming 2 means fully onboarded
                await user.save();
                profilesCreated++;
            }
        }

        console.log(`Success! Created ${profilesCreated} new profiles.`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

activateUsers();
