export const DUMMY_PROFILES = [
    {
        _id: 'dummy1',
        userId: {
            _id: 'user1',
            email: 'rahul@example.com'
        },
        fullName: 'Rahul Sharma',
        yearOfBirth: 1996,
        gender: 'male',
        location: {
            type: 'Point',
            coordinates: [77.5946, 12.9716],
            address: 'Bangalore, India'
        },
        mission: 'Building the next generation of SaaS tools for enterprise productivity. Looking for a technical co-founder with a passion for AI.',
        goal: 'I have startup ideas, looking for co-founder',
        skills: [
            { name: 'Product Management', level: 9, isCustom: false },
            { name: 'Business Strategy', level: 8, isCustom: false },
            { name: 'Marketing', level: 7, isCustom: false }
        ],
        industries: ['SaaS', 'Enterprise Software', 'Artificial Intelligence'],
        experience: 6,
        bio: '8 years of experience building products. Previously worked at a unicorn, now ready to build my own. Looking for someone who shares my vision.',
        education: {
            college: 'IIT Bombay',
            degree: 'B.Tech'
        },
        equityRange: '10% - 25%',
        role: 'Product / Business',
        profilePhoto: null,
        distance: 1.2
    },
    {
        _id: 'dummy2',
        userId: {
            _id: 'user2',
            email: 'sneha@example.com'
        },
        fullName: 'Sneha Kapoor',
        yearOfBirth: 1999,
        gender: 'female',
        location: {
            type: 'Point',
            coordinates: [72.8777, 19.0760],
            address: 'Mumbai, India'
        },
        mission: 'Creating a sustainable fashion marketplace. I have a working MVP and looking for a marketing-savvy co-founder.',
        goal: 'I have a startup',
        skills: [
            { name: 'UI/UX Design', level: 10, isCustom: false },
            { name: 'Frontend Development', level: 8, isCustom: false },
            { name: 'Sustainability', level: 9, isCustom: false }
        ],
        industries: ['E-commerce', 'Fashion', 'Sustainability'],
        experience: 4,
        bio: 'Passionate about sustainable living. I love designing intuitive user experiences and want to make fashion more eco-friendly.',
        education: {
            college: 'NID Ahmedabad',
            degree: 'Design'
        },
        equityRange: '5% - 15%',
        role: 'Design / Tech',
        profilePhoto: null,
        distance: 5.5
    },
    {
        _id: 'dummy3',
        userId: {
            _id: 'user3',
            email: 'amit@example.com'
        },
        fullName: 'Amit Verma',
        yearOfBirth: 1992,
        gender: 'male',
        location: {
            type: 'Point',
            coordinates: [77.2090, 28.6139],
            address: 'Delhi, India'
        },
        mission: 'Revolutionizing the food delivery space with drone technology. Looking for a CTO with experience in hardware and robotics.',
        goal: 'I have startup ideas, looking for co-founder',
        skills: [
            { name: 'Operations', level: 9, isCustom: false },
            { name: 'Sales', level: 8, isCustom: false },
            { name: 'Logistics', level: 9, isCustom: false }
        ],
        industries: ['Food & Tech', 'Logistics', 'Robotics'],
        experience: 10,
        bio: 'Served as operations head in a major delivery firm. Now venturing into the future of delivery with automation.',
        education: {
            college: 'IIM Indore',
            degree: 'MBA'
        },
        equityRange: '15% - 30%',
        role: 'Operations / Growth',
        profilePhoto: null,
        distance: 12.0
    }
];

export const DUMMY_MATCHES = [
    {
        matchId: 'match1',
        user: DUMMY_PROFILES[0], // Rahul Sharma - full profile
        lastMessage: {
            content: 'Hey! I saw your profile and loved your mission. Would love to chat about your ideas!',
            timestamp: new Date()
        },
        messages: [
            {
                id: 'm1',
                content: 'Hey! I saw your profile and loved your mission. Would love to chat about your ideas!',
                senderId: 'user1',
                timestamp: new Date(Date.now() - 3600000),
                status: 'read'
            },
            {
                id: 'm2',
                content: 'Hi Rahul! That sounds great. I am also looking for a co-founder with your background.',
                senderId: 'current_user',
                timestamp: new Date(Date.now() - 3000000),
                status: 'read',
                isOwn: true
            }
        ],
        lastInteraction: new Date(),
        isActive: true
    },
    {
        matchId: 'match2',
        user: DUMMY_PROFILES[1], // Sneha Kapoor - full profile
        lastMessage: null,
        messages: [],
        lastInteraction: new Date(),
        isActive: true
    },
    {
        matchId: 'match3',
        user: DUMMY_PROFILES[2], // Amit Verma - full profile
        lastMessage: null,
        messages: [],
        lastInteraction: new Date(),
        isActive: true
    }
];
