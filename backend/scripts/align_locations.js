const mongoose = require('mongoose');
const Profile = require('../models/Profile');
require('dotenv').config();

const alignLocations = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/found';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const DELHI = [77.2090, 28.6139];

        const result = await Profile.updateMany({}, {
            'location.coordinates': DELHI,
            'location.city': 'New Delhi',
            'location.address': 'New Delhi, India',
            'discoverSettings.maxDistance': 2000 // Increase max distance as well to be safe
        });

        console.log(`Updated ${result.modifiedCount} profiles to New Delhi.`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

alignLocations();
