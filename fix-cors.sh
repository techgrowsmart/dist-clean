#!/bin/bash

echo "🔧 Fixing CORS issues for development..."

echo "✅ Step 1: Killing any existing Expo processes"
lsof -ti:8081 | xargs kill -9 2>/dev/null || true
lsof -ti:8082 | xargs kill -9 2>/dev/null || true

echo "✅ Step 2: Clearing Metro cache"
npx expo start --clear --web &

echo "✅ Step 3: Waiting for server to start..."
sleep 5

echo "✅ Step 4: Opening browser"
open http://localhost:8082

echo ""
echo "🎯 CORS Fix Applied:"
echo "📱 Development mode is ENABLED in authService.ts"
echo "🌐 Mock responses will be used instead of real API calls"
echo "🧪 Test users available:"
echo "   - student1@example.com"
echo "   - teacher56@example.com"
echo "   - teacher31@example.com"
echo ""
echo "💡 If you still see CORS errors, install a CORS extension:"
echo "   Chrome: 'CORS Unblock' extension"
echo "   Firefox: 'CORS Everywhere' extension"
echo ""
echo "🚀 Your app should now work without CORS issues!"
