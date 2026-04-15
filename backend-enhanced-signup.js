// Enhanced Backend API for GrowSmart Signup Validation
// Handles duplicate registration prevention and proper error responses

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://portal.gogrowsmart.com"],
      frameAncestors: ["'none'"],
    },
  },
}));

// Enhanced CORS configuration
app.use(cors({
  origin: [
    'https://gogrowsmart.com',
    'https://portal.gogrowsmart.com',
    'https://growsmartserver.gogrowsmart.com',
    'http://localhost:8081',
    'http://localhost:8082'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// In-memory storage for demo (replace with actual database)
const users = new Map();
const otpStore = new Map();

// Enhanced validation functions
const validateEmail = (email) => {
  const trimmedEmail = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!trimmedEmail) return { valid: false, error: 'Email is required' };
  if (!emailRegex.test(trimmedEmail)) return { valid: false, error: 'Invalid email format' };
  
  // Additional validation
  const invalidPatterns = [
    /^[^.]+@[^.]+\.[^.]+$/, // No domain parts
    /^[^.@]+@/, // No username
    /@[^.]+$/, // No domain extension
    /\.\./, // Double dots
    /^\.|\.@|@\./, // Leading/trailing dots
  ];
  
  for (const pattern of invalidPatterns) {
    if (pattern.test(trimmedEmail)) {
      return { valid: false, error: 'Invalid email format' };
    }
  }
  
  return { valid: true, email: trimmedEmail };
};

const validateName = (name) => {
  const trimmedName = name.trim();
  
  if (!trimmedName) return { valid: false, error: 'Name is required' };
  if (trimmedName.length < 2) return { valid: false, error: 'Name must be at least 2 characters' };
  if (trimmedName.length > 50) return { valid: false, error: 'Name must be less than 50 characters' };
  
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(trimmedName)) {
    return { valid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  
  return { valid: true, name: trimmedName };
};

const validatePhone = (phone) => {
  const trimmedPhone = phone.trim();
  
  if (!trimmedPhone) return { valid: false, error: 'Phone number is required' };
  
  const digitsOnly = trimmedPhone.replace(/\D/g, '');
  if (digitsOnly.length < 10) return { valid: false, error: 'Phone number must be at least 10 digits' };
  if (digitsOnly.length > 15) return { valid: false, error: 'Phone number must be less than 15 digits' };
  
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  if (!phoneRegex.test(trimmedPhone)) {
    return { valid: false, error: 'Invalid phone number format' };
  }
  
  return { valid: true, phone: trimmedPhone };
};

const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Enhanced signup endpoint with duplicate checking
app.post('/api/signup', async (req, res) => {
  try {
    console.log('Signup request:', req.body);
    
    const { email, fullName, phonenumber, role = 'student' } = req.body;
    
    // Validate all required fields
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.error,
        invalidEmail: true
      });
    }
    
    const nameValidation = validateName(fullName);
    if (!nameValidation.valid) {
      return res.status(400).json({
        success: false,
        message: nameValidation.error,
        invalidName: true
      });
    }
    
    const phoneValidation = validatePhone(phonenumber);
    if (!phoneValidation.valid) {
      return res.status(400).json({
        success: false,
        message: phoneValidation.error,
        invalidPhone: true
      });
    }
    
    // Check for existing users
    const existingUserByEmail = Array.from(users.values()).find(
      user => user.email.toLowerCase() === emailValidation.email.toLowerCase()
    );
    
    if (existingUserByEmail) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered. Please use a different email or try logging in.',
        alreadyRegistered: true,
        emailExists: true
      });
    }
    
    const existingUserByPhone = Array.from(users.values()).find(
      user => user.phone === phoneValidation.phone
    );
    
    if (existingUserByPhone) {
      return res.status(409).json({
        success: false,
        message: 'This phone number is already registered. Please use a different phone number.',
        phoneExists: true
      });
    }
    
    // Generate OTP
    const otp = generateOTP();
    const otpId = uuidv4();
    
    // Store OTP
    otpStore.set(otpId, {
      email: emailValidation.email,
      name: nameValidation.name,
      phone: phoneValidation.phone,
      role: role,
      otp: otp,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });
    
    console.log('OTP generated for signup:', { email: emailValidation.email, otpId, otp });
    
    // In production, send actual email
    console.log('OTP would be sent to:', emailValidation.email);
    
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      otpId: otpId,
      email: emailValidation.email
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred. Please try again later.',
      serverError: true
    });
  }
});

// Enhanced login endpoint
app.post('/api/login', async (req, res) => {
  try {
    console.log('Login request:', req.body);
    
    const { email, password } = req.body;
    
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.error,
        invalidEmail: true
      });
    }
    
    // Check for test users
    const testUsers = ['test31@example.com', 'test@example.com', 'admin@test.com'];
    if (testUsers.includes(emailValidation.email)) {
      const otp = generateOTP();
      const otpId = uuidv4();
      
      otpStore.set(otpId, {
        email: emailValidation.email,
        otp: otp,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      });
      
      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        otpId: otpId,
        isTestUser: true,
        token: 'test-token-' + Date.now(),
        user: {
          id: 'test-user',
          email: emailValidation.email,
          name: emailValidation.email.split('@')[0],
          role: 'student'
        }
      });
    }
    
    // Check if user exists
    const existingUser = Array.from(users.values()).find(
      user => user.email.toLowerCase() === emailValidation.email.toLowerCase()
    );
    
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Email not registered. Please sign up first.',
        userNotFound: true
      });
    }
    
    // Generate OTP
    const otp = generateOTP();
    const otpId = uuidv4();
    
    otpStore.set(otpId, {
      email: emailValidation.email,
      otp: otp,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });
    
    console.log('OTP generated for login:', { email: emailValidation.email, otpId, otp });
    
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      otpId: otpId
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred. Please try again later.',
      serverError: true
    });
  }
});

// Enhanced OTP verification endpoint
app.post('/api/verify-otp', async (req, res) => {
  try {
    console.log('OTP verification request:', req.body);
    
    const { email, otp, otpId, userName, role, phonenumber } = req.body;
    
    // Find OTP record
    const otpRecord = otpStore.get(otpId);
    
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }
    
    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      otpStore.delete(otpId);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }
    
    // Check if OTP matches
    if (otpRecord.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.'
      });
    }
    
    // For signup, create user account
    if (userName && role) {
      const newUser = {
        id: uuidv4(),
        email: otpRecord.email,
        name: userName,
        phone: phonenumber,
        role: role,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      users.set(newUser.id, newUser);
      console.log('New user created:', newUser);
    }
    
    // Generate token
    const token = 'jwt-token-' + Date.now();
    
    // Clean up OTP
    otpStore.delete(otpId);
    
    // Find user for response
    const user = Array.from(users.values()).find(
      u => u.email.toLowerCase() === email.toLowerCase()
    );
    
    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      token: token,
      user: user || {
        id: 'temp-user',
        email: email,
        name: userName || email.split('@')[0],
        role: role || 'student'
      }
    });
    
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred. Please try again later.',
      serverError: true
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Enhanced GrowSmart API Server is running',
    timestamp: new Date().toISOString(),
    users: users.size,
    activeOTPs: otpStore.size
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    serverError: true
  });
});

// Start server
app.listen(PORT, () => {
  console.log('Enhanced GrowSmart API Server running on port', PORT);
  console.log('Enhanced signup validation enabled');
  console.log('Health check: http://localhost:' + PORT + '/api/health');
});

module.exports = app;
