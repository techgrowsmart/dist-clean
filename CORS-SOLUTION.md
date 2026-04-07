# CORS Solution for Growsmart Development

## Problem
The frontend (`http://localhost:8081`) gets CORS errors when accessing the production API (`https://growsmartserver.gogrowsmart.com`).

## Solutions

### Solution 1: Browser Extension (Recommended for Development)
Install a CORS browser extension for development:

**Chrome/Edge:**
1. Install "CORS Unblock" or "Allow CORS" extension
2. Enable it for development
3. Restart your browser

**Firefox:**
1. Install "CORS Everywhere" extension
2. Enable it for development

### Solution 2: Server-side CORS Fix
Ask the backend team to add these headers to the server:
```http
Access-Control-Allow-Origin: http://localhost:8081
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Solution 3: Use Development Mode
Enable development mode in `authService.ts`:
```typescript
const IS_DEVELOPMENT_MODE = true; // Change to true
```

This will use mock responses instead of real API calls.

### Solution 4: Production Domain Testing
Test using the production domain:
1. Set `EXPO_PUBLIC_DOMAIN=portal.gogrowsmart.com` in `.env`
2. Access via `https://portal.gogrowsmart.com` instead of localhost

## Current Configuration
- ✅ API URL: `https://growsmartserver.gogrowsmart.com`
- ✅ CORS headers added to fetch requests
- ✅ Development mode disabled (using real API)
- ✅ Proper error handling for network issues

## Quick Test
Try these test users (they bypass OTP):
- `student1@example.com`
- `teacher56@example.com` 
- `teacher31@example.com`

## Files Modified
- `.env` - Using production API URL
- `config.ts` - Simplified API URL logic
- `services/authService.ts` - Added CORS headers

Choose the solution that works best for your development workflow!
