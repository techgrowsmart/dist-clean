# Local Development Setup Guide

## IP Address Configuration

The app needs to connect to your local backend server during development. Since mobile devices and emulators can't access `localhost` directly, we use your machine's IP address.

### Current Configuration
- **Your IP**: `172.17.1.63`
- **Backend URL**: `http://172.17.1.63:3000`

### Updating IP Address

If your IP address changes, you can update it in two ways:

#### 1. Automatic Update (Recommended)
Run the provided script:
```bash
./update-local-ip.sh
```

#### 2. Manual Update
Update these files:
- `.env` - Change `EXPO_PUBLIC_API_URL`
- `config.ts` - Change the fallback URL

#### 3. Switch Server Script (Alternative)
```bash
# Switch to local server
node switch-server.js local

# Switch to production server  
node switch-server.js prod

# Restart Expo after switching
npx expo start --clear
```

## What I Fixed

### Backend Changes (`/crowd-teach-gogrowsmart-backend/`)

1. **Enhanced `getUserProfile` function** in `routes/posts-mongo.js`:
   - Now checks MongoDB users collection first
   - Falls back to Cassandra teachers1 table for teachers
   - Falls back to Cassandra users table for all users
   - Proper logging for debugging
   - Returns real names instead of sliced emails

2. **Fixed likes endpoint** to fetch proper user names and profile pictures

### Frontend Changes (`/Gogrowsmart/`)

1. **Improved profile image handling** in `RightScreen.tsx`:
   - Better null/undefined value checking
   - Proper URL construction for both production and local
   - Debug logging for image URLs

2. **Environment configuration**:
   - Production server as primary (growsmartserver.gogrowsmart.com)
   - Local server as fallback (127.0.0.1:3000)
   - Easy switching with `switch-server.js`

## Database Setup

### MongoDB (for posts)
The backend already tries to connect to:
1. Primary: MongoDB Atlas (from MONGO_DB_URL in .env)
2. Fallback: Local MongoDB at mongodb://localhost:27017/gogrowsmart

### Cassandra (for user profiles)
Already configured in `config/db.js` with Astra DB connection.

## Testing

1. **Production Test**: Should work immediately with real data
2. **Local Test**: Make sure your local backend is running on port 3000

### Run Local Backend
```bash
cd /Users/matul/Desktop/Work/crowd-teach-gogrowsmart-backend
npm install
npm start
```

### Verify Data
- Teacher names should show real names (not sliced emails)
- Profile images should load properly
- Posts, comments, and likes should work

## Debug Commands

### Check Backend Logs
```bash
cd /crowd-teach-gogrowsmart-backend
npm start
# Look for logs like:
# ✅ Found teacher in Cassandra teachers1: { email: '...', name: '...', profilePic: '...' }
# ✅ Found user in MongoDB: { email: '...', name: '...', profileImage: '...' }
```

### Check Frontend Logs
In Expo console, look for:
# 🖼️ Profile image URL: http://127.0.0.1:3000/uploads/...
# 🔄 Fetching posts with token: Token exists
# 🌐 BASE_URL: http://127.0.0.1:3000

## Issues Fixed

✅ **Teacher names showing as sliced emails** - Now fetches real names from database
✅ **Empty profile URLs** - Proper URL construction and fallback handling  
✅ **Local server not working** - Environment switching and proper MongoDB setup
✅ **Production/Local switching** - Easy toggle with switch-server.js

## Next Steps

1. Test with production server first (should work immediately)
2. Set up local backend if needed for development
3. Use `switch-server.js` to toggle between environments
4. Check console logs for debugging any remaining issues
