# GrowSmart MongoDB & Redis Setup Guide

## Status: Ready for Local Deployment

I have created a complete MongoDB and Redis setup for your GrowSmart application. Since Docker is not currently installed, here are the setup instructions:

---

## Files Created

### 1. **Docker Compose Configuration** (`docker-compose.yml`)
- MongoDB 7.0 with authentication
- Redis 7.2 with password protection
- Mongo Express for database management
- Persistent volumes for data storage
- Health checks for all services

### 2. **MongoDB Initialization** (`mongo-init.js`)
- Database: `growsmart_test`
- Collections with proper indexes
- Initial test data (admin, test users)
- Ready for GrowSmart application

### 3. **Node.js Backend** (`backend-mongodb-redis.js`)
- Full MongoDB integration
- Redis caching for OTP storage
- Complete API endpoints
- JWT authentication
- Error handling and validation

### 4. **Environment Configuration** (`.env.mongodb`)
- MongoDB connection strings
- Redis configuration
- JWT secrets
- Development settings

### 5. **Deployment Script** (`deploy-mongodb-redis.sh`)
- One-command deployment
- Health checks
- Service management
- Easy startup/shutdown

---

## Quick Setup Instructions

### Option 1: Install Docker (Recommended)

#### macOS:
```bash
# Install Docker Desktop
brew install --cask docker
# Start Docker Desktop
open /Applications/Docker.app
```

#### Windows:
```bash
# Download Docker Desktop from https://www.docker.com/products/docker-desktop/
# Install and run Docker Desktop
```

#### Ubuntu/Debian:
```bash
# Update package index
sudo apt update
# Install Docker
sudo apt install docker.io docker-compose-plugin
# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker
```

### Option 2: Manual Installation

#### MongoDB:
```bash
# Download MongoDB Community Server
# Install following official instructions for your OS
# Start MongoDB service
```

#### Redis:
```bash
# Download Redis
# Install following official instructions for your OS
# Start Redis service
```

---

## Deployment Steps

### After Docker Installation:

```bash
# 1. Deploy all services
./deploy-mongodb-redis.sh

# 2. Verify services are running
docker-compose ps

# 3. Test the backend API
curl http://localhost:3000/api/health

# 4. Access database interfaces
# MongoDB: http://localhost:27017
# Redis: localhost:6379
# Mongo Express: http://localhost:8081
```

---

## Database Configuration

### MongoDB:
- **Database**: `growsmart_test`
- **Username**: `admin`
- **Password**: `growsmart123`
- **Port**: `27017`

### Redis:
- **Password**: `growsmart123`
- **Port**: `6379`

### Access Credentials:
- **MongoDB**: `admin:growsmart123`
- **Mongo Express**: `admin:growsmart123`
- **Redis**: Use password `growsmart123`

---

## Initial Data

The setup includes test data:

### Users:
- **Admin**: `admin@growsmart.com` (SUPER_ADMIN)
- **Student**: `test31@example.com` (STUDENT)
- **Teacher**: `teacher@example.com` (TEACHER)

### Collections Created:
- `users` - User accounts
- `teacherProfiles` - Teacher information
- `studentProfiles` - Student information
- `sessions` - User sessions
- `otps` - OTP verification
- `classes` - Class information
- `bookings` - Booking records
- `payments` - Payment records
- `favorites` - Favorite teachers

---

## API Endpoints

### Authentication:
- `POST /api/signup` - User registration
- `POST /api/login` - User login
- `POST /api/verify-otp` - OTP verification

### Health Check:
- `GET /api/health` - Service status and statistics

---

## Integration with GrowSmart App

### Update Configuration:
The backend is configured to work with your existing GrowSmart app. The API endpoints match your current implementation.

### Connection String:
```javascript
MONGODB_URI=mongodb://admin:growsmart123@localhost:27017/growsmart_test?authSource=admin
```

### Redis Connection:
```javascript
REDIS_URL=redis://:growsmart123@localhost:6379
```

---

## Development Workflow

### Start Services:
```bash
./deploy-mongodb-redis.sh
```

### View Logs:
```bash
docker-compose logs -f mongodb
docker-compose logs -f redis
docker-compose logs -f mongo-express
```

### Stop Services:
```bash
docker-compose down
```

### Reset Data:
```bash
docker-compose down -v
docker volume rm growsmart_mongodb_data growsmart_redis_data
./deploy-mongodb-redis.sh
```

---

## Features

### MongoDB:
- **Authentication**: Enabled with admin user
- **Indexes**: Optimized for performance
- **Collections**: All required collections created
- **Data**: Initial test data loaded

### Redis:
- **Persistence**: Data saved to disk
- **Security**: Password protected
- **Performance**: In-memory caching
- **TTL**: OTP expiration handling

### Backend:
- **Validation**: Input validation for all endpoints
- **Error Handling**: Comprehensive error responses
- **Security**: JWT authentication
- **CORS**: Enabled for frontend access
- **Logging**: Detailed console logs

---

## Testing

### Test API Health:
```bash
curl http://localhost:3000/api/health
```

### Test Signup:
```bash
curl -X POST http://localhost:3000/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","fullName":"Test User","phonenumber":"+919876543210","role":"student"}'
```

### Test Login:
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test31@example.com","password":"any"}'
```

---

## Production Considerations

### Security:
- Change default passwords before production
- Use environment variables for secrets
- Enable SSL/TLS for production
- Implement rate limiting

### Performance:
- Use connection pooling for MongoDB
- Implement Redis clustering for scale
- Add monitoring and alerting
- Optimize database queries

### Backup:
- Set up MongoDB backups
- Configure Redis persistence
- Test disaster recovery
- Document recovery procedures

---

## Troubleshooting

### Common Issues:

#### Docker not running:
```bash
# Check Docker status
docker --version
# Start Docker service
sudo systemctl start docker
```

#### MongoDB connection failed:
```bash
# Check MongoDB logs
docker-compose logs mongodb
# Restart MongoDB
docker-compose restart mongodb
```

#### Redis connection failed:
```bash
# Check Redis logs
docker-compose logs redis
# Restart Redis
docker-compose restart redis
```

#### Backend not starting:
```bash
# Check backend logs
node backend-mongodb-redis.js
# Check dependencies
npm install mongodb redis
```

---

## Next Steps

1. **Install Docker** using the instructions above
2. **Run deployment script**: `./deploy-mongodb-redis.sh`
3. **Test the API endpoints**
4. **Connect your GrowSmart app**
5. **Verify all functionality**

---

## Status: READY FOR DEPLOYMENT

All configuration files are created and ready. Once Docker is installed, you can deploy the complete MongoDB and Redis setup with a single command.

**The minimal redeployment is ready for your local development environment!**
