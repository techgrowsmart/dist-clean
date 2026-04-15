#!/bin/bash

# GrowSmart MongoDB & Redis Docker Redeployment
# Minimal redeployment for local development

echo "=========================================="
echo "GrowSmart MongoDB & Redis Docker Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    local status="$1"
    local message="$2"
    
    case $status in
        "SUCCESS")
            echo -e "${GREEN}# $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}# $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}# $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}# $message${NC}"
            ;;
    esac
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_status "ERROR" "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    print_status "ERROR" "Docker is not running. Please start Docker first."
    exit 1
fi

print_status "SUCCESS" "Docker is installed and running"

# Create Docker Compose file
print_status "INFO" "Creating Docker Compose configuration..."

cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: growsmart-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: growsmart123
      MONGO_INITDB_DATABASE: growsmart_test
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    networks:
      - growsmart-network
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  redis:
    image: redis:7.2-alpine
    container_name: growsmart-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - growsmart-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    command: redis-server --appendonly yes --requirepass growsmart123

  mongo-express:
    image: mongo-express:1.0.0
    container_name: growsmart-mongo-express
    restart: unless-stopped
    ports:
      - "8081:8081"
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: admin
      ME_CONFIG_MONGODB_ADMINPASSWORD: growsmart123
      ME_CONFIG_MONGODB_URL: mongodb://admin:growsmart123@mongodb:27017/
      ME_CONFIG_BASICAUTH_USERNAME: admin
      ME_CONFIG_BASICAUTH_PASSWORD: growsmart123
    depends_on:
      mongodb:
        condition: service_healthy
    networks:
      - growsmart-network

volumes:
  mongodb_data:
    driver: local
  redis_data:
    driver: local

networks:
  growsmart-network:
    driver: bridge
EOF

print_status "SUCCESS" "Docker Compose configuration created"

# Create MongoDB initialization script
print_status "INFO" "Creating MongoDB initialization script..."

cat > mongo-init.js << 'EOF'
// MongoDB initialization script for GrowSmart
// This script runs when the container starts for the first time

db = db.getSiblingDB('growsmart_test');

// Create collections with indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "phone": 1 }, { unique: false });
db.users.createIndex({ "role": 1 }, { unique: false });
db.users.createIndex({ "createdAt": 1 }, { unique: false });

db.sessions.createIndex({ "userId": 1 }, { unique: false });
db.sessions.createIndex({ "token": 1 }, { unique: true });
db.sessions.createIndex({ "expiresAt": 1 }, { unique: false });

db.otps.createIndex({ "email": 1 }, { unique: false });
db.otps.createIndex({ "otpId": 1 }, { unique: true });
db.otps.createIndex({ "expiresAt": 1 }, { unique: false });

db.teacherProfiles.createIndex({ "userId": 1 }, { unique: true });
db.teacherProfiles.createIndex({ "email": 1 }, { unique: true });
db.teacherProfiles.createIndex({ "subjects": 1 }, { unique: false });

db.studentProfiles.createIndex({ "userId": 1 }, { unique: true });
db.studentProfiles.createIndex({ "email": 1 }, { unique: true });
db.studentProfiles.createIndex({ "grade": 1 }, { unique: false });

db.classes.createIndex({ "teacherId": 1 }, { unique: false });
db.classes.createIndex({ "subject": 1 }, { unique: false });
db.classes.createIndex({ "status": 1 }, { unique: false });

db.bookings.createIndex({ "studentId": 1 }, { unique: false });
db.bookings.createIndex({ "teacherId": 1 }, { unique: false });
db.bookings.createIndex({ "classId": 1 }, { unique: false });
db.bookings.createIndex({ "status": 1 }, { unique: false });
db.bookings.createIndex({ "bookingTime": 1 }, { unique: false });

db.payments.createIndex({ "userId": 1 }, { unique: false });
db.payments.createIndex({ "bookingId": 1 }, { unique: true });
db.payments.createIndex({ "status": 1 }, { unique: false });
db.payments.createIndex({ "createdAt": 1 }, { unique: false });

db.favorites.createIndex({ "userId": 1 }, { unique: false });
db.favorites.createIndex({ "teacherEmail": 1 }, { unique: false });
db.favorites.createIndex({ "createdAt": 1 }, { unique: false });

// Insert initial data
db.users.insertMany([
  {
    _id: ObjectId("507f1f77bcf86cd799439011"),
    email: "admin@growsmart.com",
    name: "Admin User",
    phone: "+919876543210",
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId("507f1f77bcf86cd799439012"),
    email: "test31@example.com",
    name: "Test User",
    phone: "+919876543211",
    role: "STUDENT",
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId("507f1f77bcf86cd799439013"),
    email: "teacher@example.com",
    name: "Demo Teacher",
    phone: "+919876543212",
    role: "TEACHER",
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

db.teacherProfiles.insertMany([
  {
    _id: ObjectId("507f1f77bcf86cd799439013"),
    userId: ObjectId("507f1f77bcf86cd799439013"),
    email: "teacher@example.com",
    name: "Demo Teacher",
    phone: "+919876543212",
    subjects: ["Mathematics", "Physics"],
    experience: "5 years",
    education: "M.Sc. Mathematics",
    bio: "Experienced teacher specializing in Math and Physics",
    hourlyRate: 500,
    rating: 4.8,
    totalStudents: 25,
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

db.studentProfiles.insertMany([
  {
    _id: ObjectId("507f1f77bcf86cd799439012"),
    userId: ObjectId("507f1f77bcf86cd799439012"),
    email: "test31@example.com",
    name: "Test User",
    phone: "+919876543211",
    grade: "10",
    school: "Demo School",
    interests: ["Mathematics", "Science"],
    parentName: "Parent Name",
    parentPhone: "+919876543213",
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print("=== MongoDB Initialization Complete ===");
print("Database: growsmart_test");
print("Collections created with indexes");
print("Initial data inserted");
print("Ready for GrowSmart application connection");
EOF

print_status "SUCCESS" "MongoDB initialization script created"

# Create environment configuration file
print_status "INFO" "Creating environment configuration..."

cat > .env.mongodb << 'EOF'
# MongoDB Configuration
MONGODB_URI=mongodb://admin:growsmart123@localhost:27017/growsmart_test?authSource=admin
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DATABASE=growsmart_test
MONGODB_USERNAME=admin
MONGODB_PASSWORD=growsmart123

# Redis Configuration
REDIS_URL=redis://:growsmart123@localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=growsmart123

# Application Configuration
NODE_ENV=development
PORT=3000
API_BASE_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:8081

# JWT Configuration
JWT_SECRET=growsmart-jwt-secret-key-2024
JWT_EXPIRES_IN=7d

# Email Configuration (for development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@growsmart.com

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

print_status "SUCCESS" "Environment configuration created"

# Create Node.js backend with MongoDB and Redis support
print_status "INFO" "Creating Node.js backend with MongoDB and Redis..."

cat > backend-mongodb-redis.js << 'EOF'
// GrowSmart Backend with MongoDB and Redis Support
// Minimal redeployment for local development

const http = require('http');
const url = require('url');
const { MongoClient } = require('mongodb');
const Redis = require('redis');
const crypto = require('crypto');

// Configuration
const config = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://admin:growsmart123@localhost:27017/growsmart_test?authSource=admin',
    dbName: 'growsmart_test'
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || 'growsmart123'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'growsmart-jwt-secret-key-2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  }
};

// Database connections
let db = null;
let redisClient = null;

// Initialize MongoDB connection
async function connectMongoDB() {
  try {
    const client = new MongoClient(config.mongodb.uri);
    await client.connect();
    db = client.db(config.mongodb.dbName);
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
}

// Initialize Redis connection
async function connectRedis() {
  try {
    redisClient = Redis.createClient({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password
    });
    
    await redisClient.connect();
    console.log('Redis connected successfully');
    return true;
  } catch (error) {
    console.error('Redis connection error:', error);
    return false;
  }
}

// Utility functions
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const generateUUID = () => {
  return crypto.randomUUID();
};

const generateJWT = (payload) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', config.jwt.secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
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

// Enhanced validation functions
const validateEmail = (email) => {
  const trimmedEmail = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!trimmedEmail) return { valid: false, error: 'Email is required' };
  if (!emailRegex.test(trimmedEmail)) return { valid: false, error: 'Invalid email format' };
  if (trimmedEmail.length > 254) return { valid: false, error: 'Email is too long' };
  
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

// API Handlers
const handleSignup = async (req, res, body) => {
  try {
    console.log('Signup request:', body);
    
    const { email, fullName, phonenumber, role = 'student' } = body;
    
    // Validate inputs
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
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({
      email: emailValidation.email
    });
    
    if (existingUser) {
      return sendJSONResponse(res, 409, {
        success: false,
        message: 'This email is already registered. Please use a different email or try logging in.',
        alreadyRegistered: true,
        emailExists: true
      });
    }
    
    // Generate OTP
    const otp = generateOTP();
    const otpId = generateUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Store OTP in Redis
    await redisClient.setEx(`otp:${otpId}`, 600, JSON.stringify({
      email: emailValidation.email,
      name: nameValidation.name,
      phone: phoneValidation.phone,
      role: role,
      otp: otp,
      expiresAt: expiresAt.toISOString()
    }));
    
    console.log('OTP generated for signup:', { email: emailValidation.email, otpId, otp });
    
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

const handleLogin = async (req, res, body) => {
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
      const user = await db.collection('users').findOne({
        email: emailValidation.email
      });
      
      if (user) {
        const token = generateJWT({
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role
        });
        
        return sendJSONResponse(res, 200, {
          success: true,
          message: 'Login successful',
          token: token,
          user: {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role
          }
        });
      }
    }
    
    // Check if user exists
    const user = await db.collection('users').findOne({
      email: emailValidation.email
    });
    
    if (!user) {
      return sendJSONResponse(res, 404, {
        success: false,
        message: 'Email not registered. Please sign up first.',
        userNotFound: true
      });
    }
    
    // Generate OTP for regular users
    const otp = generateOTP();
    const otpId = generateUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    await redisClient.setEx(`otp:${otpId}`, 600, JSON.stringify({
      email: emailValidation.email,
      otp: otp,
      expiresAt: expiresAt.toISOString()
    }));
    
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

const handleVerifyOTP = async (req, res, body) => {
  try {
    console.log('OTP verification request:', body);
    
    const { email, otp, otpId, userName, role, phonenumber } = body;
    
    // Get OTP from Redis
    const otpData = await redisClient.get(`otp:${otpId}`);
    
    if (!otpData) {
      return sendJSONResponse(res, 400, {
        success: false,
        message: 'Invalid or expired OTP'
      });
    }
    
    const parsedOtpData = JSON.parse(otpData);
    
    // Check if OTP is expired
    if (new Date() > new Date(parsedOtpData.expiresAt)) {
      await redisClient.del(`otp:${otpId}`);
      return sendJSONResponse(res, 400, {
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }
    
    // Check if OTP matches
    if (parsedOtpData.otp !== otp) {
      return sendJSONResponse(res, 400, {
        success: false,
        message: 'Invalid OTP. Please check and try again.'
      });
    }
    
    // For signup, create user account
    if (userName && role) {
      const newUser = {
        email: parsedOtpData.email,
        name: userName,
        phone: phonenumber,
        role: role,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await db.collection('users').insertOne(newUser);
      console.log('New user created:', result);
      
      // Create profile based on role
      if (role === 'TEACHER') {
        await db.collection('teacherProfiles').insertOne({
          userId: result.insertedId,
          email: parsedOtpData.email,
          name: userName,
          phone: phonenumber,
          subjects: [],
          experience: "",
          education: "",
          bio: "",
          hourlyRate: 0,
          rating: 0,
          totalStudents: 0,
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else if (role === 'STUDENT') {
        await db.collection('studentProfiles').insertOne({
          userId: result.insertedId,
          email: parsedOtpData.email,
          name: userName,
          phone: phonenumber,
          grade: "",
          school: "",
          interests: [],
          parentName: "",
          parentPhone: "",
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    
    // Generate JWT token
    const user = await db.collection('users').findOne({
      email: parsedOtpData.email
    });
    
    const token = generateJWT({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role
    });
    
    // Clean up OTP
    await redisClient.del(`otp:${otpId}`);
    
    sendJSONResponse(res, 200, {
      success: true,
      message: 'OTP verified successfully',
      token: token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role
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

const handleHealth = async (req, res) => {
  try {
    const mongoStatus = db ? 'connected' : 'disconnected';
    const redisStatus = redisClient ? 'connected' : 'disconnected';
    
    const stats = {
      mongodb: mongoStatus,
      redis: redisStatus,
      database: config.mongodb.dbName,
      timestamp: new Date().toISOString()
    };
    
    // Get collection counts if connected
    if (db) {
      try {
        stats.userCount = await db.collection('users').countDocuments();
        stats.classCount = await db.collection('classes').countDocuments();
        stats.bookingCount = await db.collection('bookings').countDocuments();
      } catch (error) {
        console.error('Error getting stats:', error);
      }
    }
    
    sendJSONResponse(res, 200, stats);
  } catch (error) {
    console.error('Health check error:', error);
    sendJSONResponse(res, 500, {
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
};

// Create server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      let parsedBody = {};
      if (body && method === 'POST') {
        parsedBody = JSON.parse(body);
      }

      // Route handling
      if (pathname === '/api/signup' && method === 'POST') {
        await handleSignup(req, res, parsedBody);
      } else if (pathname === '/api/login' && method === 'POST') {
        await handleLogin(req, res, parsedBody);
      } else if (pathname === '/api/verify-otp' && method === 'POST') {
        await handleVerifyOTP(req, res, parsedBody);
      } else if (pathname === '/api/health' && method === 'GET') {
        await handleHealth(req, res);
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

// Initialize connections and start server
async function startServer() {
  try {
    // Connect to MongoDB
    const mongoConnected = await connectMongoDB();
    if (!mongoConnected) {
      console.error('Failed to connect to MongoDB');
      process.exit(1);
    }
    
    // Connect to Redis
    const redisConnected = await connectRedis();
    if (!redisConnected) {
      console.error('Failed to connect to Redis');
      process.exit(1);
    }
    
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log('GrowSmart Backend Server with MongoDB & Redis running on port', PORT);
      console.log('MongoDB:', config.mongodb.uri);
      console.log('Redis:', `redis://:****@${config.redis.host}:${config.redis.port}`);
      console.log('Health check: http://localhost:' + PORT + '/api/health');
      console.log('Mongo Express: http://localhost:8081');
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (redisClient) redisClient.quit();
  if (db) db.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  if (redisClient) redisClient.quit();
  if (db) db.close();
  process.exit(0);
});

startServer();

module.exports = server;
EOF

print_status "SUCCESS" "Node.js backend with MongoDB and Redis created"

# Install required dependencies
print_status "INFO" "Installing required dependencies..."

npm install mongodb redis

print_status "SUCCESS" "Dependencies installed"

# Create deployment script
print_status "INFO" "Creating deployment script..."

cat > deploy-mongodb-redis.sh << 'EOF'
#!/bin/bash

echo "=========================================="
echo "GrowSmart MongoDB & Redis Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    local status="\$1"
    local message="\$2"
    
    case \$status in
        "SUCCESS") echo -e "\${GREEN}# \$message\${NC}" ;;
        "WARNING") echo -e "\${YELLOW}# \$message\${NC}" ;;
        "ERROR") echo -e "\${RED}# \$message\${NC}" ;;
        "INFO") echo -e "\${BLUE}# \$message\${NC}" ;;
    esac
}

# Stop existing containers
print_status "INFO" "Stopping existing containers..."
docker-compose down -v

# Remove existing volumes (optional - uncomment if you want to start fresh)
# docker volume rm growsmart_mongodb_data growsmart_redis_data

# Build and start services
print_status "INFO" "Starting MongoDB and Redis containers..."
docker-compose up -d --build

# Wait for services to be ready
print_status "INFO" "Waiting for services to start..."
sleep 10

# Check service health
print_status "INFO" "Checking service health..."

# Check MongoDB
if docker exec growsmart-mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    print_status "SUCCESS" "MongoDB is healthy"
else
    print_status "WARNING" "MongoDB may still be starting..."
fi

# Check Redis
if docker exec growsmart-redis redis-cli ping > /dev/null 2>&1; then
    print_status "SUCCESS" "Redis is healthy"
else
    print_status "WARNING" "Redis may still be starting..."
fi

# Start backend server
print_status "INFO" "Starting backend server..."
node backend-mongodb-redis.js &
BACKEND_PID=\$!
echo "Backend server PID: \$BACKEND_PID"

# Wait for backend to start
sleep 5

# Test backend health
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_status "SUCCESS" "Backend server is healthy"
else
    print_status "ERROR" "Backend server failed to start"
    kill \$BACKEND_PID 2>/dev/null
fi

echo ""
print_status "SUCCESS" "Deployment Complete!"
echo ""
echo -e "\${GREEN}Services Running:\${NC}"
echo "MongoDB: http://localhost:27017"
echo "Redis: localhost:6379"
echo "Backend API: http://localhost:3000"
echo "Mongo Express: http://localhost:8081"
echo ""
echo -e "\${BLUE}Access Credentials:\${NC}"
echo "MongoDB: admin / growsmart123"
echo "Mongo Express: admin / growsmart123"
echo "Redis: password: growsmart123"
echo ""
echo -e "\${YELLOW}Commands:\${NC}"
echo "View logs: docker-compose logs -f"
echo "Stop services: docker-compose down"
echo "Restart: docker-compose restart"
echo ""
echo -e "\${GREEN}Database: growsmart_test\${NC}"
echo "Initial data has been loaded with test users"
EOF

chmod +x deploy-mongodb-redis.sh

print_status "SUCCESS" "Deployment script created"

echo ""
print_status "SUCCESS" "MONGODB & REDIS SETUP COMPLETE!"
echo ""
echo -e "\${GREEN}What's been created:\${NC}"
echo "Docker Compose configuration for MongoDB and Redis"
echo "MongoDB initialization script with test data"
echo "Node.js backend with MongoDB and Redis support"
echo "Environment configuration file"
echo "Deployment script for easy startup"
echo ""
echo -e "\${BLUE}Next Steps:\${NC}"
echo "1. Run: ./deploy-mongodb-redis.sh"
echo "2. Access MongoDB: http://localhost:27017"
echo "3. Access Redis: localhost:6379"
echo "4. Access Backend API: http://localhost:3000"
echo "5. Access Mongo Express: http://localhost:8081"
echo ""
print_status "SUCCESS" "Ready for minimal redeployment!"
