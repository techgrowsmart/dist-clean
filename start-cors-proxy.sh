#!/bin/bash

# CORS Proxy Startup Script for Gogrowsmart Development

echo "🚀 Starting Gogrowsmart CORS Proxy Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if we're in the correct directory
if [ ! -f "cors-proxy.js" ]; then
    echo "❌ cors-proxy.js not found. Make sure you're in the Gogrowsmart directory."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing CORS proxy dependencies..."
    npm install --package-lock-read-only cors express http-proxy-middleware
fi

# Start the CORS proxy server
echo "🌐 Starting CORS proxy on http://localhost:3001"
echo "📡 Proxying to: https://growsmartserver.gogrowsmart.com"
echo "🔗 Test health: http://localhost:3001/health"
echo ""
echo "⚠️  Make sure your Expo app is configured to use http://localhost:3001 for web development"
echo "⚠️  Press Ctrl+C to stop the server"
echo ""

# Start the server
node cors-proxy.js
