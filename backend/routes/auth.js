const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { generateToken, generateOTP: generateOTPCode, validatePassword, sanitizeInput } = require('../utils/auth');
const { sendOTP } = require('../utils/email');
const auth = require('../middleware/auth');

const router = express.Router();

// Register with email/phone
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('phone').optional({ checkFalsy: true }).isMobilePhone()
], async (req, res) => {
  try {
    console.log('Registration request received:', req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, phone } = req.body;
    console.log('Processing registration for:', email);

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      console.log('Password validation failed:', passwordValidation.errors);
      return res.status(400).json({
        message: 'Password does not meet requirements',
        errors: passwordValidation.errors
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, ...(phone ? [{ phone }] : [])]
    });

    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      return res.status(400).json({
        message: 'User with this email or phone already exists'
      });
    }

    console.log('Creating new user...');
    // Create new user
    const user = new User({
      email: sanitizeInput(email),
      password,
      phone: phone ? sanitizeInput(phone) : undefined
    });

    await user.save();
    console.log('User saved successfully:', user._id);

    // Generate and send OTP
    const otp = generateOTPCode();
    const otpRecord = new OTP({
      identifier: email,
      type: 'email',
      code: otp,
      purpose: 'email_verification'
    });

    await otpRecord.save();
    console.log('OTP generated:', otp);

    // Send OTP email
    const emailSent = await sendOTP(email, otp, 'verification');
    if (!emailSent) {
      console.log('Failed to send OTP email');
      return res.status(500).json({
        message: 'Failed to send verification email'
      });
    }

    console.log('OTP email sent successfully');

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registration successful. Please verify your email.',
      token,
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        registrationStep: user.registrationStep
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Server error during registration',
      error: error.message
    });
  }
});

// Login
router.post('/login', [
  body('identifier').notEmpty(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { identifier, password } = req.body;

    // Find user by email or phone
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { phone: identifier }
      ]
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        registrationStep: user.registrationStep
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Verify OTP
router.post('/verify-otp', [
  body('identifier').notEmpty(),
  body('code').isLength({ min: 6, max: 6 }),
  body('purpose').isIn(['email_verification', 'phone_verification', 'password_reset'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { identifier, code, purpose } = req.body;

    // Find valid OTP
    const otpRecord = await OTP.findOne({
      identifier,
      code,
      purpose,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Update user verification status
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { phone: identifier }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (purpose === 'email_verification') {
      user.isEmailVerified = true;
    } else if (purpose === 'phone_verification') {
      user.isPhoneVerified = true;
    }

    await user.save();

    res.json({
      message: 'OTP verified successfully',
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
});

// Resend OTP
router.post('/resend-otp', [
  body('identifier').notEmpty(),
  body('purpose').isIn(['email_verification', 'phone_verification', 'password_reset'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { identifier, purpose } = req.body;

    // Check if user exists
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { phone: identifier }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate new OTP
    const otp = generateOTPCode();
    const otpRecord = new OTP({
      identifier,
      type: identifier.includes('@') ? 'email' : 'phone',
      code: otp,
      purpose
    });

    await otpRecord.save();

    // Send OTP
    if (identifier.includes('@')) {
      const emailSent = await sendOTP(identifier, otp, purpose);
      if (!emailSent) {
        return res.status(500).json({ message: 'Failed to send OTP email' });
      }
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error while resending OTP' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update registration step
router.put('/registration-step', auth, [
  body('step').isInt({ min: 0, max: 2 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { step } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.registrationStep = step;
    await user.save();

    res.json({
      message: 'Registration step updated',
      registrationStep: user.registrationStep
    });
  } catch (error) {
    console.error('Update registration step error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Google OAuth routes
router.get('/google', (req, res) => {
  // For Expo Go, use the correct deep link format
  const redirectUri = 'exp://192.168.1.7:8081';

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=profile email&` +
    `access_type=offline`;

  res.json({ authUrl: googleAuthUrl });
});

router.post('/google/callback', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Authorization code required' });
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: 'exp://192.168.1.7:8081',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return res.status(400).json({ message: 'Failed to exchange authorization code' });
    }

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const googleUser = await userResponse.json();

    if (!googleUser.email) {
      return res.status(400).json({ message: 'Failed to get user information' });
    }

    // Check if user exists
    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
      // Create new user from Google
      user = new User({
        email: sanitizeInput(googleUser.email),
        isEmailVerified: true,
        registrationStep: 1, // Skip to onboarding
        googleId: sanitizeInput(googleUser.id),
      });

      await user.save();
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = sanitizeInput(googleUser.id);
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Google authentication successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        registrationStep: user.registrationStep,
        name: googleUser.name || user.email,
      }
    });

  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ message: 'Server error during Google authentication' });
  }
});

module.exports = router;
