# Production Backend Setup Guide for GrowSmart

## Overview

This guide explains how to set up the production-ready backend for GrowSmart teacher registration with MongoDB and Redis integration.

## Current Status

**Issues Found:**
- Current backend files (`backend-enhanced-signup.js`, `backend-simple-signup.js`) use in-memory storage (Map) - NOT production-ready
- Missing `/api/upload` and `/api/register` endpoints for teacher registration
- No MongoDB integration for persistent data storage

**Solution Implemented:**
- Created `backend-production.js` with full MongoDB + Redis integration
- Added `/api/upload` endpoint for file uploads
- Added `/api/register` endpoint for teacher registration
- Implemented proper database schema for `teacherProfiles` collection

## Database Schema

### MongoDB Collections

#### `users` Collection
```javascript
{
  id: String (UUID),
  email: String (unique),
  phone: String (unique),
  name: String,
  role: String ('student' | 'teacher' | 'admin'),
  createdAt: Date,
  updatedAt: Date
}
```

#### `teacherProfiles` Collection
```javascript
{
  userId: String (UUID, unique),
  fullname: String,
  phoneNumber: String,
  email: String,
  residentialAddress: String,
  state: String,
  country: String,
  experience: String,
  specialization: String,
  highest_degree: String,
  panCard: String (file path),
  aadharFront: String (file path),
  aadharBack: String (file path),
  selfieWith_aadhar_front: String (file path),
  selfieWith_aadhar_back: String (file path),
  certifications: Array[String],
  highestQualificationCertificate: Array[String],
  role: String ('teacher'),
  status: String ('pending' | 'approved' | 'rejected'),
  createdAt: Date,
  updatedAt: Date
}
```

## Installation Steps

### 1. Install Dependencies

```bash
cd /Users/matul/Desktop/Work/Gogrowsmart
npm install express cors helmet mongodb redis uuid multer dotenv
npm install --save-dev nodemon
```

### 2. Setup MongoDB

#### Option A: Local MongoDB (Development)
```bash
# Using Docker
docker run -d -p 27017:27017 \
  --name growsmart-mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=growsmart123 \
  mongo:7.0

# Or using MongoDB Atlas (Production)
# 1. Create account at https://www.mongodb.com/cloud/atlas
# 2. Create cluster
# 3. Get connection string
# 4. Update .env.production with your connection string
```

#### Option B: MongoDB Atlas (Production)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster
4. Create database user with username and password
5. Whitelist IP addresses (0.0.0.0/0 for all, or specific server IPs)
6. Get connection string
7. Update `.env.production`:
```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/growsmart_production?retryWrites=true&w=majority
```

### 3. Setup Redis

#### Option A: Local Redis (Development)
```bash
# Using Docker
docker run -d -p 6379:6379 \
  --name growsmart-redis \
  redis:7.2 redis-server --requirepass growsmart123
```

#### Option B: Redis Cloud (Production)
1. Go to https://redis.com/try-free/
2. Create a free Redis Cloud account
3. Create a new database
4. Get connection string
5. Update `.env.production`:
```
REDIS_URL=redis://default:<password>@<host>:<port>
```

### 4. Configure Environment Variables

Update `.env.production`:
```bash
# Backend Database Configuration
MONGODB_URI=mongodb://admin:growsmart123@localhost:27017/growsmart_production?authSource=admin
REDIS_URL=redis://:growsmart123@localhost:6379
PORT=3000
```

### 5. Start the Production Backend

```bash
# Start the backend
node backend-production.js

# Or use nodemon for development with auto-reload
npm run dev
```

## API Endpoints

### Teacher Registration

#### POST /api/upload
Upload teacher identity documents and certificates.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Headers: Authorization: Bearer <token>

**Form Data:**
- `panCard` (file) - PAN card image
- `aadharFront` (file) - Aadhar card front image
- `aadharBack` (file) - Aadhar card back image
- `selfieWith_aadhar_front` (file) - Selfie with Aadhar front
- `selfieWith_aadhar_back` (file) - Selfie with Aadhar back
- `certifications` (files, multiple) - Certification documents
- `highestQualificationCertificate` (files, multiple) - Qualification certificates

**Response:**
```json
{
  "success": true,
  "message": "Files uploaded successfully",
  "files": {
    "panCard": [{ "filename": "...", "path": "..." }],
    "aadharFront": [{ "filename": "...", "path": "..." }],
    // ...
  }
}
```

#### POST /api/register
Register a new teacher profile.

**Request:**
- Method: POST
- Content-Type: application/json
- Headers: Authorization: Bearer <token>

**Body:**
```json
{
  "fullname": "John Doe",
  "phoneNumber": "+919876543210",
  "email": "john@example.com",
  "residentialAddress": "123 Main St",
  "state": "California",
  "country": "USA",
  "experience": "5 years",
  "specialization": "Mathematics",
  "highest_degree": "M.Sc.",
  "panCard": "/uploads/pan-123.jpg",
  "aadharFront": "/uploads/aadhar-front-123.jpg",
  "aadharBack": "/uploads/aadhar-back-123.jpg",
  "selfieWith_aadhar_front": "/uploads/selfie-front-123.jpg",
  "selfieWith_aadhar_back": "/uploads/selfie-back-123.jpg",
  "certifications": ["/uploads/cert1.jpg", "/uploads/cert2.jpg"],
  "highestQualificationCertificate": ["/uploads/degree1.jpg"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Teacher registration successful",
  "teacherId": "uuid-123-456",
  "profile": { /* teacher profile object */ }
}
```

### Authentication Endpoints

#### POST /api/signup
User signup with OTP verification.

#### POST /api/login
User login with OTP verification.

#### POST /api/verify-otp
Verify OTP and complete authentication.

### Other Endpoints

#### GET /api/teachers
Get all approved teacher profiles.

#### GET /api/health
Health check endpoint to verify server and database status.

## Accessing the Database

### Using MongoDB Compass (GUI)
1. Download MongoDB Compass from https://www.mongodb.com/try/download/compass
2. Connect using your MongoDB URI
3. Navigate to `growsmart_production` database
4. View collections: `users`, `teacherProfiles`

### Using MongoDB Shell
```bash
# Connect to MongoDB
mongosh "mongodb://admin:growsmart123@localhost:27017/growsmart_production?authSource=admin"

# Switch to database
use growsmart_production

# View all teacher profiles
db.teacherProfiles.find().pretty()

# View pending teacher registrations
db.teacherProfiles.find({ status: 'pending' }).pretty()

# Approve a teacher
db.teacherProfiles.updateOne(
  { userId: 'teacher-uuid' },
  { $set: { status: 'approved' } }
)

# Count teachers by status
db.teacherProfiles.aggregate([
  { $group: { _id: '$status', count: { $sum: 1 } } }
])
```

### Using Redis CLI
```bash
# Connect to Redis
redis-cli -a growsmart123

# View all OTP keys
KEYS otp:*

# View specific OTP
GET otp:otp-id-here

# Delete expired OTPs
DEL otp:otp-id-here
```

## Testing the Backend

### Test Health Check
```bash
curl http://localhost:3000/api/health
```

### Test Teacher Registration
```bash
# First upload files
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer your-token" \
  -F "panCard=@/path/to/pan.jpg" \
  -F "aadharFront=@/path/to/aadhar-front.jpg"

# Then register
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "fullname": "Test Teacher",
    "phoneNumber": "+919876543210",
    "email": "teacher@example.com",
    "experience": "5 years",
    "specialization": "Mathematics"
  }'
```

## Production Deployment

### AWS EC2 Deployment

1. **Launch EC2 Instance**
   - Ubuntu 20.04 LTS
   - t3.medium (2 vCPU, 4 GB RAM)
   - Security Group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000 (Backend)

2. **Install Dependencies**
```bash
ssh ubuntu@your-ec2-ip
sudo apt update
sudo apt install -y nodejs npm mongodb redis-server
```

3. **Setup MongoDB**
```bash
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

4. **Setup Redis**
```bash
sudo systemctl start redis
sudo systemctl enable redis
```

5. **Deploy Backend**
```bash
git clone your-repo
cd gogrowsmart
npm install
cp .env.production .env
# Update .env with production values
node backend-production.js
```

6. **Setup PM2 for Process Management**
```bash
npm install -g pm2
pm2 start backend-production.js --name growsmart-backend
pm2 save
pm2 startup
```

7. **Setup Nginx Reverse Proxy**
```nginx
server {
    listen 80;
    server_name growsmartserver.gogrowsmart.com;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring and Maintenance

### Check Server Status
```bash
# Health check
curl https://growsmartserver.gogrowsmart.com/api/health

# Check PM2 processes
pm2 status

# View logs
pm2 logs growsmart-backend
```

### Database Backup
```bash
# MongoDB backup
mongodump --uri="mongodb://admin:password@localhost:27017/growsmart_production" --out=/backup/$(date +%Y%m%d)

# Restore from backup
mongorestore --uri="mongodb://admin:password@localhost:27017" /backup/20240101
```

### Redis Backup
```bash
# Redis backup
redis-cli -a password BGSAVE

# Copy Redis dump file
cp /var/lib/redis/dump.rdb /backup/
```

## Troubleshooting

### MongoDB Connection Failed
```bash
# Check MongoDB status
sudo systemctl status mongodb

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Restart MongoDB
sudo systemctl restart mongodb
```

### Redis Connection Failed
```bash
# Check Redis status
sudo systemctl status redis

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log

# Restart Redis
sudo systemctl restart redis
```

### Backend Not Starting
```bash
# Check logs
pm2 logs growsmart-backend

# Check if port is in use
sudo lsof -i :3000

# Kill process using port
sudo kill -9 $(sudo lsof -t -i:3000)
```

## Security Checklist

- [ ] Change default MongoDB password
- [ ] Change default Redis password
- [ ] Enable SSL/TLS for production
- [ ] Use environment variables for all secrets
- [ ] Implement rate limiting
- [ ] Enable CORS only for trusted domains
- [ ] Set up regular database backups
- [ ] Monitor server logs
- [ ] Implement error tracking (Sentry, etc.)
- [ ] Use PM2 for process management

## Next Steps

1. ✅ Production backend created
2. ✅ MongoDB schema defined
3. ✅ Redis integration added
4. ✅ File upload endpoint created
5. ✅ Teacher registration endpoint created
6. ⏳ Deploy to production server
7. ⏳ Configure production MongoDB Atlas
8. ⏳ Configure production Redis Cloud
9. ⏳ Set up SSL certificates
10. ⏳ Implement monitoring and alerting

## Status: READY FOR PRODUCTION

The production backend is now ready. Follow the deployment steps above to deploy it to your production server.
