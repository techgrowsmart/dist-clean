# CORS Fix for Development

## Problem
The frontend running on `http://localhost:8081` was getting CORS errors when trying to access the production API at `https://growsmartserver.gogrowsmart.com`.

## Solution
We've set up a local development proxy server that handles CORS and forwards requests to the production server.

## Quick Start

### 1. Start the Development API Server
```bash
# In the Gogrowsmart project directory
node dev-server.js
```

### 2. Start the Expo App
```bash
# In another terminal
npx expo start --web
```

The development server will:
- Run on `http://localhost:3000`
- Handle CORS for `http://localhost:8081`
- Proxy all `/api/*` requests to `https://growsmartserver.gogrowsmart.com`
- Add proper CORS headers

## Environment Configuration
The `.env` file has been updated to use the local development server:
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## For Production Deployment
When deploying to production, comment out the local URL and uncomment the production URL in `.env`:
```
# EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_API_URL=https://growsmartserver.gogrowsmart.com
```

## Alternative Solutions
If you prefer not to use a proxy server, you can:

1. **Configure CORS on the backend server** - Add `Access-Control-Allow-Origin: http://localhost:8081` header
2. **Use browser extensions** - CORS disable extensions for development
3. **Use the production backend directly** - Set `EXPO_PUBLIC_API_URL=https://growsmartserver.gogrowsmart.com` and handle CORS on the server

## Files Created/Modified
- `dev-server.js` - Development proxy server
- `.env` - Updated to use local API URL
- `start-dev-server.sh` - Setup script (optional)

The development server will automatically handle all the CORS issues while maintaining the same API endpoints!
