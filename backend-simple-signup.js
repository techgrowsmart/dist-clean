// Simple Enhanced Backend API for GrowSmart Signup Validation
// No external dependencies required

const http = require('http');
const url = require('url');
const querystring = require('querystring');

// In-memory storage for demo (replace with actual database)
const users = new Map();
const otpStore = new Map();

// Enhanced validation functions
const validateEmail = (email) => {
  const trimmedEmail = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!trimmedEmail) return { valid: false, error: 'Email is required' };
  if (!emailRegex.test(trimmedEmail)) return { valid: false, error: 'Invalid email format' };
  
  // Only basic validation - remove overly strict patterns
  if (trimmedEmail.length > 254) return { valid: false, error: 'Email is too long' };
  if (trimmedEmail.split('@')[0].length > 64) return { valid: false, error: 'Email username is too long' };
  
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

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const sendJSONResponse = (res, statusCode, data) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
};

const handleCORS = (req, res) => {
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end();
};

// Enhanced signup endpoint with duplicate checking
const handleSignup = (req, res, body) => {
  try {
    console.log('Signup request:', body);
    
    const { email, fullName, phonenumber, role = 'student' } = body;
    
    // Validate all required fields
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return sendJSONResponse(res, 400, {
        success: false,
        message: emailValidation.error,
        invalidEmail: true
      });
    }
    
    const nameValidation = validateName(fullName);
    if (!nameValidation.valid) {
      return sendJSONResponse(res, 400, {
        success: false,
        message: nameValidation.error,
        invalidName: true
      });
    }
    
    const phoneValidation = validatePhone(phonenumber);
    if (!phoneValidation.valid) {
      return sendJSONResponse(res, 400, {
        success: false,
        message: phoneValidation.error,
        invalidPhone: true
      });
    }
    
    // Check for existing users (including pending users)
    const existingUserByEmail = Array.from(users.values()).find(
      user => user.email.toLowerCase() === emailValidation.email.toLowerCase()
    );
    
    // Also check if there's a pending signup for this email
    const pendingUserByEmail = Array.from(otpStore.values()).find(
      otp => otp.email.toLowerCase() === emailValidation.email.toLowerCase()
    );
    
    if (existingUserByEmail || pendingUserByEmail) {
      return sendJSONResponse(res, 409, {
        success: false,
        message: 'This email is already registered. Please use a different email or try logging in.',
        alreadyRegistered: true,
        emailExists: true
      });
    }
    
    const existingUserByPhone = Array.from(users.values()).find(
      user => user.phone === phoneValidation.phone
    );
    
    // Also check if there's a pending signup for this phone
    const pendingUserByPhone = Array.from(otpStore.values()).find(
      otp => otp.phone === phoneValidation.phone
    );
    
    if (existingUserByPhone || pendingUserByPhone) {
      return sendJSONResponse(res, 409, {
        success: false,
        message: 'This phone number is already registered. Please use a different phone number.',
        phoneExists: true
      });
    }
    
    // Generate OTP
    const otp = generateOTP();
    const otpId = generateUUID();
    
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
    
    sendJSONResponse(res, 200, {
      success: true,
      message: 'OTP sent successfully',
      otpId: otpId,
      email: emailValidation.email
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    sendJSONResponse(res, 500, {
      success: false,
      message: 'Server error occurred. Please try again later.',
      serverError: true
    });
  }
};

// Enhanced login endpoint
const handleLogin = (req, res, body) => {
  try {
    console.log('Login request:', body);
    
    const { email, password } = body;
    
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return sendJSONResponse(res, 400, {
        success: false,
        message: emailValidation.error,
        invalidEmail: true
      });
    }
    
    // Check for test users
    const testUsers = ['test31@example.com', 'test@example.com', 'admin@test.com'];
    if (testUsers.includes(emailValidation.email)) {
      const otp = generateOTP();
      const otpId = generateUUID();
      
      otpStore.set(otpId, {
        email: emailValidation.email,
        otp: otp,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      });
      
      return sendJSONResponse(res, 200, {
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
      return sendJSONResponse(res, 404, {
        success: false,
        message: 'Email not registered. Please sign up first.',
        userNotFound: true
      });
    }
    
    // Generate OTP
    const otp = generateOTP();
    const otpId = generateUUID();
    
    otpStore.set(otpId, {
      email: emailValidation.email,
      otp: otp,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });
    
    console.log('OTP generated for login:', { email: emailValidation.email, otpId, otp });
    
    sendJSONResponse(res, 200, {
      success: true,
      message: 'OTP sent successfully',
      otpId: otpId
    });
    
  } catch (error) {
    console.error('Login error:', error);
    sendJSONResponse(res, 500, {
      success: false,
      message: 'Server error occurred. Please try again later.',
      serverError: true
    });
  }
};

// Enhanced OTP verification endpoint
const handleVerifyOTP = (req, res, body) => {
  try {
    console.log('OTP verification request:', body);
    
    const { email, otp, otpId, userName, role, phonenumber } = body;
    
    // Find OTP record
    const otpRecord = otpStore.get(otpId);
    
    if (!otpRecord) {
      return sendJSONResponse(res, 400, {
        success: false,
        message: 'Invalid or expired OTP'
      });
    }
    
    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      otpStore.delete(otpId);
      return sendJSONResponse(res, 400, {
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }
    
    // Check if OTP matches
    if (otpRecord.otp !== otp) {
      return sendJSONResponse(res, 400, {
        success: false,
        message: 'Invalid OTP. Please check and try again.'
      });
    }
    
    // For signup, create user account
    if (userName && role) {
      const newUser = {
        id: generateUUID(),
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
    
    sendJSONResponse(res, 200, {
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
    sendJSONResponse(res, 500, {
      success: false,
      message: 'Server error occurred. Please try again later.',
      serverError: true
    });
  }
};

// Health check endpoint
const handleHealth = (req, res) => {
  sendJSONResponse(res, 200, { 
    status: 'OK', 
    message: 'Enhanced GrowSmart API Server is running',
    timestamp: new Date().toISOString(),
    users: users.size,
    activeOTPs: otpStore.size
  });
};

// Create server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return handleCORS(req, res);
  }

  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      let parsedBody = {};
      if (body && method === 'POST') {
        parsedBody = JSON.parse(body);
      }

      // Route handling
      if (pathname === '/api/signup' && method === 'POST') {
        handleSignup(req, res, parsedBody);
      } else if (pathname === '/api/login' && method === 'POST') {
        handleLogin(req, res, parsedBody);
      } else if (pathname === '/api/verify-otp' && method === 'POST') {
        handleVerifyOTP(req, res, parsedBody);
      } else if (pathname === '/api/health' && method === 'GET') {
        handleHealth(req, res);
      } else {
        sendJSONResponse(res, 404, {
          success: false,
          message: 'Endpoint not found'
        });
      }
    } catch (error) {
      console.error('Request parsing error:', error);
      sendJSONResponse(res, 400, {
        success: false,
        message: 'Invalid JSON in request body'
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log('Enhanced GrowSmart API Server running on port', PORT);
  console.log('Enhanced signup validation enabled');
  console.log('Health check: http://localhost:' + PORT + '/api/health');
});

module.exports = server;
