#!/bin/bash

# Growsmart Web App Startup Script
# This script starts the Gogrowsmart app in web mode for the emulator

echo "🚀 Starting Growsmart Web App for Emulator..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the Gogrowsmart root directory."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Creating a sample .env file..."
    cat > .env << EOF
# Growsmart Environment Variables
EXPO_PUBLIC_API_URL=https://gogrowsmartserver.gogrowsmart.com/api
EXPO_PUBLIC_WS_URL=wss://gogrowsmartserver.gogrowsmart.com
EOF
fi

# Start the web server
echo "🌐 Starting Expo web server on port 8080..."
echo "📱 The app will be available at: http://localhost:8080"
echo "🔗 Open the emulator at: http://localhost:3000/emulator/"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the expo web server
npx expo start --web --port 8080 --clear
