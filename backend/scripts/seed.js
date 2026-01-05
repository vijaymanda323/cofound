const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Skill = require('../models/Skill');
const Industry = require('../models/Industry');

// Sample data
const sampleSkills = [
  { name: 'JavaScript', category: 'technical', isPopular: true },
  { name: 'Python', category: 'technical', isPopular: true },
  { name: 'React', category: 'technical', isPopular: true },
  { name: 'Node.js', category: 'technical', isPopular: true },
  { name: 'UI/UX Design', category: 'design', isPopular: true },
  { name: 'Marketing', category: 'marketing', isPopular: true },
  { name: 'Sales', category: 'sales', isPopular: true },
  { name: 'Finance', category: 'finance', isPopular: true },
  { name: 'Business Strategy', category: 'business', isPopular: true },
  { name: 'Product Management', category: 'business', isPopular: true },
  { name: 'Data Science', category: 'technical', isPopular: true },
  { name: 'Mobile Development', category: 'technical', isPopular: true },
  { name: 'DevOps', category: 'technical', isPopular: true },
  { name: 'Blockchain', category: 'technical', isPopular: true },
  { name: 'AI/ML', category: 'technical', isPopular: true },
];

const sampleIndustries = [
  { name: 'Technology', isPopular: true },
  { name: 'Healthcare', isPopular: true },
  { name: 'Finance', isPopular: true },
  { name: 'Education', isPopular: true },
  { name: 'E-commerce', isPopular: true },
  { name: 'Real Estate', isPopular: true },
  { name: 'Transportation', isPopular: true },
  { name: 'Food & Beverage', isPopular: true },
  { name: 'Entertainment', isPopular: true },
  { name: 'Energy', isPopular: true },
  { name: 'Agriculture', isPopular: true },
  { name: 'Manufacturing', isPopular: true },
  { name: 'Retail', isPopular: true },
  { name: 'Travel', isPopular: true },
  { name: 'Social Impact', isPopular: true },
];

const sampleUsers = [
  {
    email: 'john.doe@example.com',
    password: 'Password123!',
    phone: '+1234567890',
  },
  {
    email: 'jane.smith@example.com',
    password: 'Password123!',
    phone: '+1234567891',
  },
  {
    email: 'mike.wilson@example.com',
    password: 'Password123!',
    phone: '+1234567892',
  },
  {
    email: 'sarah.jones@example.com',
    password: 'Password123!',
    phone: '+1234567893',
  },
  {
    email: 'alex.brown@example.com',
    password: 'Password123!',
    phone: '+1234567894',
  },
];

const sampleProfiles = [
  {
    fullName: 'John Doe',
    location: {
      type: 'Point',
      coordinates: [-74.0060, 40.7128], // New York
      address: 'New York, NY, USA',
      city: 'New York',
      country: 'USA',
    },
    gender: 'male',
    yearOfBirth: 1990,
    mission: 'Building the next generation of fintech solutions to democratize investing for everyone.',
    goal: 'I have a startup',
    skills: [
      { name: 'JavaScript', level: 9, isCustom: false },
      { name: 'React', level: 8, isCustom: false },
      { name: 'Finance', level: 7, isCustom: false },
      { name: 'Business Strategy', level: 6, isCustom: false },
    ],
    industries: ['Technology', 'Finance'],
    experience: 8,
    bio: 'Passionate about fintech and building products that make a difference.',
    education: {
      college: 'MIT',
      university: 'Massachusetts Institute of Technology',
      degree: 'Bachelor\'s',
      field: 'Computer Science',
      graduationYear: 2012,
    },
    linkedinUrl: 'https://linkedin.com/in/johndoe',
    isVerified: true,
  },
  {
    fullName: 'Jane Smith',
    location: {
      type: 'Point',
      coordinates: [-118.2437, 34.0522], // Los Angeles
      address: 'Los Angeles, CA, USA',
      city: 'Los Angeles',
      country: 'USA',
    },
    gender: 'female',
    yearOfBirth: 1992,
    mission: 'Creating innovative healthcare solutions that improve patient outcomes through technology.',
    goal: 'I have startup ideas, looking for co-founder',
    skills: [
      { name: 'UI/UX Design', level: 9, isCustom: false },
      { name: 'Product Management', level: 8, isCustom: false },
      { name: 'Marketing', level: 7, isCustom: false },
      { name: 'Data Science', level: 6, isCustom: false },
    ],
    industries: ['Healthcare', 'Technology'],
    experience: 6,
    bio: 'Healthcare enthusiast with a passion for user-centered design.',
    education: {
      college: 'Stanford',
      university: 'Stanford University',
      degree: 'Master\'s',
      field: 'Human-Computer Interaction',
      graduationYear: 2014,
    },
    linkedinUrl: 'https://linkedin.com/in/janesmith',
    isVerified: true,
  },
  {
    fullName: 'Mike Wilson',
    location: {
      type: 'Point',
      coordinates: [-87.6298, 41.8781], // Chicago
      address: 'Chicago, IL, USA',
      city: 'Chicago',
      country: 'USA',
    },
    gender: 'male',
    yearOfBirth: 1988,
    mission: 'Revolutionizing e-commerce with AI-powered personalization and logistics.',
    goal: 'I want to join someone\'s startup',
    skills: [
      { name: 'Python', level: 9, isCustom: false },
      { name: 'AI/ML', level: 8, isCustom: false },
      { name: 'DevOps', level: 7, isCustom: false },
      { name: 'Mobile Development', level: 6, isCustom: false },
    ],
    industries: ['E-commerce', 'Technology'],
    experience: 10,
    bio: 'AI/ML engineer with extensive experience in scaling e-commerce platforms.',
    education: {
      college: 'University of Chicago',
      university: 'University of Chicago',
      degree: 'Master\'s',
      field: 'Computer Science',
      graduationYear: 2010,
    },
    linkedinUrl: 'https://linkedin.com/in/mikewilson',
    isVerified: false,
  },
  {
    fullName: 'Sarah Jones',
    location: {
      type: 'Point',
      coordinates: [-71.0589, 42.3601], // Boston
      address: 'Boston, MA, USA',
      city: 'Boston',
      country: 'USA',
    },
    gender: 'female',
    yearOfBirth: 1991,
    mission: 'Building educational technology that makes learning accessible and engaging for all.',
    goal: 'I have a startup',
    skills: [
      { name: 'Marketing', level: 9, isCustom: false },
      { name: 'Sales', level: 8, isCustom: false },
      { name: 'Business Strategy', level: 7, isCustom: false },
      { name: 'Product Management', level: 6, isCustom: false },
    ],
    industries: ['Education', 'Technology'],
    experience: 7,
    bio: 'Education technology advocate focused on creating impactful learning experiences.',
    education: {
      college: 'Harvard',
      university: 'Harvard University',
      degree: 'MBA',
      field: 'Business Administration',
      graduationYear: 2013,
    },
    linkedinUrl: 'https://linkedin.com/in/sarahjones',
    isVerified: true,
  },
  {
    fullName: 'Alex Brown',
    location: {
      type: 'Point',
      coordinates: [-122.4194, 37.7749], // San Francisco
      address: 'San Francisco, CA, USA',
      city: 'San Francisco',
      country: 'USA',
    },
    gender: 'other',
    yearOfBirth: 1993,
    mission: 'Developing sustainable transportation solutions for urban environments.',
    goal: 'I have startup ideas, looking for co-founder',
    skills: [
      { name: 'Mobile Development', level: 9, isCustom: false },
      { name: 'Node.js', level: 8, isCustom: false },
      { name: 'DevOps', level: 7, isCustom: false },
      { name: 'Blockchain', level: 6, isCustom: false },
    ],
    industries: ['Transportation', 'Technology'],
    experience: 5,
    bio: 'Full-stack developer passionate about sustainable tech and urban innovation.',
    education: {
      college: 'UC Berkeley',
      university: 'University of California, Berkeley',
      degree: 'Bachelor\'s',
      field: 'Electrical Engineering & Computer Science',
      graduationYear: 2015,
    },
    linkedinUrl: 'https://linkedin.com/in/alexbrown',
    isVerified: false,
  },
];

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Profile.deleteMany({});
    await Skill.deleteMany({});
    await Industry.deleteMany({});

    console.log('Cleared existing data');

    // Insert skills
    const skills = await Skill.insertMany(sampleSkills);
    console.log(`Inserted ${skills.length} skills`);

    // Insert industries
    const industries = await Industry.insertMany(sampleIndustries);
    console.log(`Inserted ${industries.length} industries`);

    // Create users and profiles
    const createdUsers = [];
    
    for (let i = 0; i < sampleUsers.length; i++) {
      const userData = sampleUsers[i];
      const profileData = sampleProfiles[i];

      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create user
      const user = new User({
        ...userData,
        password: hashedPassword,
        isEmailVerified: true,
        registrationStep: 2, // Fully registered
      });

      const savedUser = await user.save();
      createdUsers.push(savedUser);

      // Create profile
      const profile = new Profile({
        ...profileData,
        userId: savedUser._id,
      });

      await profile.save();
    }

    console.log(`Created ${createdUsers.length} users and profiles`);

    console.log('Database seeding completed successfully!');
    console.log('\nSample login credentials:');
    sampleUsers.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}, Password: ${user.password}`);
    });

  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

// Connect to database and seed
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/found', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  seedDatabase().then(() => {
    process.exit(0);
  });
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});
