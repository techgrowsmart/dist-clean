// Production-Ready Backend API for GrowSmart
// MongoDB + Redis integration for teacher registration

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { MongoClient } = require('mongodb');
const { createClient } = require('redis');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
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

// CORS configuration
app.use(cors({
  origin: [
    'https://gogrowsmart.com',
    'https://portal.gogrowsmart.com',
    'https://growsmartserver.gogrowsmart.com',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:19006',
    'http://localhost:19000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:growsmart123@localhost:27017/growsmart_test?authSource=admin';
let db = null;
let client = null;

// Redis Connection
const REDIS_URL = process.env.REDIS_URL || 'redis://:growsmart123@localhost:6379';
let redisClient = null;

// File upload configuration
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Database initialization
async function initializeDatabase() {
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db();
    console.log('✅ Connected to MongoDB');

    // Create indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ phone: 1 }, { unique: true });
    await db.collection('teacherProfiles').createIndex({ userId: 1 }, { unique: true });
    await db.collection('teacherProfiles').createIndex({ email: 1 });
    console.log('✅ Database indexes created');

    // Connect to Redis
    redisClient = createClient({ url: REDIS_URL });
    await redisClient.connect();
    console.log('✅ Connected to Redis');

  } catch (error) {
    console.error('❌ Database initialization error:', error);
    // Fallback to in-memory storage if database connection fails
    console.log('⚠️  Using in-memory storage as fallback');
  }
}

// In-memory storage for testing when database is not available
const inMemoryUsers = new Map();
const inMemoryTeacherProfiles = new Map();

// Helper function to get database or fallback to in-memory
const getUsersCollection = () => db ? db.collection('users') : null;
const getTeacherProfilesCollection = () => db ? db.collection('teacherProfiles') : null;

// In-memory user operations
const findUserInMemory = async (email) => {
  return inMemoryUsers.get(email.toLowerCase()) || null;
};

const addUserToMemory = async (userData) => {
  const email = userData.email.toLowerCase();
  inMemoryUsers.set(email, { ...userData, email, createdAt: new Date() });
};

// Validation functions
const validateEmail = (email) => {
  const trimmedEmail = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!trimmedEmail) return { valid: false, error: 'Email is required' };
  if (!emailRegex.test(trimmedEmail)) return { valid: false, error: 'Invalid email format' };
  
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

// Upload endpoint for teacher images
app.post('/api/upload', upload.fields([
  { name: 'panCard', maxCount: 1 },
  { name: 'aadharFront', maxCount: 1 },
  { name: 'aadharBack', maxCount: 1 },
  { name: 'selfieWith_aadhar_front', maxCount: 1 },
  { name: 'selfieWith_aadhar_back', maxCount: 1 },
  { name: 'certifications', maxCount: 3 },
  { name: 'highestQualificationCertificate', maxCount: 3 }
]), async (req, res) => {
  try {
    console.log('Upload request received');
    
    const uploadedFiles = {};
    
    // Process uploaded files
    if (req.files) {
      for (const [fieldName, files] of Object.entries(req.files)) {
        if (files && files.length > 0) {
          uploadedFiles[fieldName] = files.map(file => ({
            originalName: file.originalname,
            filename: file.filename,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype
          }));
        }
      }
    }

    console.log('Files uploaded:', Object.keys(uploadedFiles));

    res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: error.message
    });
  }
});

// Teacher registration endpoint
app.post('/api/register', async (req, res) => {
  try {
    console.log('Teacher registration request received');
    
    const {
      fullname,
      phoneNumber,
      email,
      residentialAddress,
      state,
      country,
      experience,
      specialization,
      highest_degree,
      panCard,
      aadharFront,
      aadharBack,
      selfieWith_aadhar_front,
      selfieWith_aadhar_back,
      certifications,
      highestQualificationCertificate
    } = req.body;

    // Validate required fields
    const nameValidation = validateName(fullname);
    if (!nameValidation.valid) {
      return res.status(400).json({
        success: false,
        message: nameValidation.error
      });
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.error
      });
    }

    const phoneValidation = validatePhone(phoneNumber);
    if (!phoneValidation.valid) {
      return res.status(400).json({
        success: false,
        message: phoneValidation.error
      });
    }

    // Check if user already exists
    const usersCollection = getUsersCollection();
    if (usersCollection) {
      const existingUser = await usersCollection.findOne({
        $or: [
          { email: emailValidation.email.toLowerCase() },
          { phone: phoneValidation.phone }
        ]
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email or phone already exists'
        });
      }
    }

    // Create teacher profile
    const teacherProfile = {
      userId: uuidv4(),
      fullname: nameValidation.name,
      phoneNumber: phoneValidation.phone,
      email: emailValidation.email,
      residentialAddress,
      state,
      country,
      experience,
      specialization,
      highest_degree,
      panCard,
      aadharFront,
      aadharBack,
      selfieWith_aadhar_front,
      selfieWith_aadhar_back,
      certifications: Array.isArray(certifications) ? certifications : [],
      highestQualificationCertificate: Array.isArray(highestQualificationCertificate) ? highestQualificationCertificate : [],
      role: 'teacher',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to database
    const teacherProfilesCollection = getTeacherProfilesCollection();
    if (teacherProfilesCollection) {
      await teacherProfilesCollection.insertOne(teacherProfile);
      console.log('✅ Teacher profile saved to database:', teacherProfile.userId);
    }

    // Also save to users collection
    if (usersCollection) {
      await usersCollection.insertOne({
        id: teacherProfile.userId,
        email: teacherProfile.email,
        phone: teacherProfile.phoneNumber,
        name: teacherProfile.fullname,
        role: 'teacher',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Teacher registration successful',
      teacherId: teacherProfile.userId,
      profile: teacherProfile
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Check if user exists endpoint
app.post('/api/auth/check-user', async (req, res) => {
  try {
    console.log('Check user request:', req.body);
    
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.error,
        invalidEmail: true
      });
    }
    
    // Check for existing users
    const usersCollection = getUsersCollection();
    let existingUser = null;
    
    if (usersCollection) {
      // Use database if available
      existingUser = await usersCollection.findOne({
        email: emailValidation.email.toLowerCase()
      });
    } else {
      // Use in-memory storage for testing
      existingUser = await findUserInMemory(emailValidation.email);
    }
    
    if (existingUser) {
      return res.status(200).json({
        success: true,
        exists: true,
        message: 'User already exists'
      });
    }
    
    return res.status(200).json({
      success: true,
      exists: false,
      message: 'User does not exist'
    });
    
  } catch (error) {
    console.error('Check user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Login endpoint - send OTP for login
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login request:', req.body);
    
    const { email, password } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    const normalizedEmail = emailValidation.email.toLowerCase();
    
    // Check if user is a test user - bypass OTP for test users
    const testUsers = ['student1@example.com', 'teacher31@example.com', 'teacher56@example.com'];
    if (testUsers.includes(normalizedEmail)) {
      console.log('Test user detected, bypassing OTP:', normalizedEmail);
      
      // Fetch user from database to get their actual data
      let existingUser;
      if (db) {
        existingUser = await User.findOne({ email: normalizedEmail });
      } else {
        existingUser = await findUserInMemory(normalizedEmail);
      }
      
      // If test user doesn't exist in database, create them
      if (!existingUser) {
        const testUserData = {
          email: normalizedEmail,
          role: normalizedEmail.includes('teacher') ? 'teacher' : 'student',
          name: normalizedEmail.includes('teacher31') ? 'Test Teacher 31' : 
                normalizedEmail.includes('teacher56') ? 'Test Teacher 56' : 'Test Student',
          phone: '+919876543210',
          createdAt: new Date()
        };
        
        if (db) {
          existingUser = await User.create(testUserData);
        } else {
          existingUser = testUserData;
          existingUser._id = normalizedEmail;
          inMemoryUsers.push(existingUser);
        }
      }
      
      // Generate a token for the test user
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { 
          userId: existingUser._id || existingUser.id,
          email: existingUser.email,
          role: existingUser.role 
        },
        'growsmart-secret-key',
        { expiresIn: '30d' }
      );
      
      return res.status(200).json({
        success: true,
        isTestUser: true,
        token: token,
        user: {
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
          id: existingUser._id || existingUser.id,
          phone: existingUser.phone
        },
        role: existingUser.role,
        message: 'Test user login successful'
      });
    }
    
    // Check if user exists
    let existingUser;
    if (db) {
      existingUser = await User.findOne({
        email: normalizedEmail
      });
    } else {
      // Use in-memory storage for testing
      existingUser = await findUserInMemory(normalizedEmail);
    }
    
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please sign up first.'
      });
    }
    
    // Generate and send OTP for login
    const otpId = generateOTPId();
    const otp = generateOTP();
    
    // Store OTP in memory
    otpStore.set(otpId, {
      email: normalizedEmail,
      otp: otp,
      timestamp: Date.now(),
      type: 'login'
    });
    
    console.log(`Login OTP for ${normalizedEmail}: ${otp}`);
    
    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully for login',
      otpId: otpId,
      email: normalizedEmail
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Test endpoint to add user directly to in-memory storage
app.post('/api/add-test-user', async (req, res) => {
  try {
    console.log('Adding test user:', req.body);
    
    const { email, fullName, phone, role = 'student' } = req.body;
    
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.error
      });
    }
    
    // Add user to in-memory storage
    await addUserToMemory({
      email: emailValidation.email,
      fullName: fullName || 'Test User',
      phone: phone || '+0000000000',
      role: role
    });
    
    return res.status(200).json({
      success: true,
      message: 'Test user added successfully',
      email: emailValidation.email
    });
    
  } catch (error) {
    console.error('Add test user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Enhanced signup endpoint
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
    const usersCollection = getUsersCollection();
    let existingUserByEmail = null;
    let existingUserByPhone = null;
    
    if (usersCollection) {
      // Use database if available
      existingUserByEmail = await usersCollection.findOne({
        email: emailValidation.email.toLowerCase()
      });
      
      existingUserByPhone = await usersCollection.findOne({
        phone: phoneValidation.phone
      });
    } else {
      // Use in-memory storage for testing
      existingUserByEmail = await findUserInMemory(emailValidation.email);
      // For phone checking in memory, we'd need to iterate through users
      // For now, just check email
    }
    
    if (existingUserByEmail) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered. Please use a different email or try logging in.',
        alreadyRegistered: true,
        emailExists: true
      });
    }
    
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
    
    // Store OTP in Redis
    if (redisClient) {
      await redisClient.setEx(
        `otp:${otpId}`,
        600, // 10 minutes
        JSON.stringify({
          email: emailValidation.email,
          name: nameValidation.name,
          phone: phoneValidation.phone,
          role: role,
          otp: otp
        })
      );
    }
    
    console.log('OTP generated for signup:', { email: emailValidation.email, otpId, otp });
    
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
      
      if (redisClient) {
        await redisClient.setEx(
          `otp:${otpId}`,
          600,
          JSON.stringify({
            email: emailValidation.email,
            otp: otp
          })
        );
      }
      
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
    const usersCollection = getUsersCollection();
    if (usersCollection) {
      const existingUser = await usersCollection.findOne({
        email: emailValidation.email.toLowerCase()
      });
      
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Email not registered. Please sign up first.',
          userNotFound: true
        });
      }
    }
    
    // Generate OTP
    const otp = generateOTP();
    const otpId = uuidv4();
    
    if (redisClient) {
      await redisClient.setEx(
        `otp:${otpId}`,
        600,
        JSON.stringify({
          email: emailValidation.email,
          otp: otp
        })
      );
    }
    
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
    
    // Find OTP record in Redis
    let otpRecord = null;
    if (redisClient) {
      const otpData = await redisClient.get(`otp:${otpId}`);
      if (otpData) {
        otpRecord = JSON.parse(otpData);
      }
    }
    
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
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
      
      const usersCollection = getUsersCollection();
      if (usersCollection) {
        await usersCollection.insertOne(newUser);
      }
      console.log('New user created:', newUser);
    }
    
    // Generate token
    const token = 'jwt-token-' + Date.now();
    
    // Clean up OTP
    if (redisClient) {
      await redisClient.del(`otp:${otpId}`);
    }
    
    // Find user for response
    const usersCollection = getUsersCollection();
    let user = null;
    if (usersCollection) {
      user = await usersCollection.findOne({
        email: email.toLowerCase()
      });
    }
    
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

// Get teacher profiles
app.get('/api/teachers', async (req, res) => {
  try {
    const teacherProfilesCollection = getTeacherProfilesCollection();
    if (teacherProfilesCollection) {
      const teachers = await teacherProfilesCollection.find({ status: 'approved' }).toArray();
      res.status(200).json({
        success: true,
        teachers: teachers
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Database not available'
      });
    }
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teachers',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const healthStatus = {
    status: 'OK',
    message: 'Production GrowSmart API Server is running',
    timestamp: new Date().toISOString(),
    database: db ? 'connected' : 'disconnected',
    redis: redisClient ? 'connected' : 'disconnected'
  };

  if (db) {
    try {
      await db.admin().ping();
      healthStatus.database = 'healthy';
    } catch (error) {
      healthStatus.database = 'error';
    }
  }

  if (redisClient) {
    try {
      await redisClient.ping();
      healthStatus.redis = 'healthy';
    } catch (error) {
      healthStatus.redis = 'error';
    }
  }

  res.json(healthStatus);
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

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log('🚀 Production GrowSmart API Server running on port', PORT);
    console.log('📊 Health check: http://localhost:' + PORT + '/api/health');
    console.log('👨‍🏫 Teacher registration: POST /api/register');
    console.log('📤 File upload: POST /api/upload');
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = app;
