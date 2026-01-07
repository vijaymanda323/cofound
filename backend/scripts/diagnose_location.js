const mongoose = require('mongoose');
const Profile = require('../models/Profile');
const User = require('../models/User');
require('dotenv').config();

const diagnoseLocation = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/found';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // Get all profiles
        const profiles = await Profile.find().populate('userId', 'email');
        console.log(`\n--- ALL PROFILES (${profiles.length}) ---`);

        profiles.forEach(p => {
            console.log(`User: ${p.userId?.email} | Location: ${JSON.stringify(p.location.coordinates)} | City: ${p.location.city}`);
        });

        // Check distance between first and second if possible
        if (profiles.length >= 2) {
            const p1 = profiles[0].location.coordinates;
            const p2 = profiles[1].location.coordinates;
            const dist = calculateDistance(p1, p2);
            console.log(`\nDistance between ${profiles[0].userId?.email} and ${profiles[1].userId?.email}: ${dist.toFixed(2)} km`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

function calculateDistance(coords1, coords2) {
    const R = 6371; // km
    const dLat = toRad(coords2[1] - coords1[1]);
    const dLon = toRad(coords2[0] - coords1[0]);
    const lat1 = toRad(coords1[1]);
    const lat2 = toRad(coords2[1]);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function toRad(deg) { return deg * (Math.PI / 180); }

diagnoseLocation();
