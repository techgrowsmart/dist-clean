#!/bin/bash

echo "🏗️  Building GROWSMART Production APK with com.gogrowsmart.app.mobile"
echo "=================================================="

# Clean any previous builds
echo "🧹 Cleaning previous builds..."
rm -rf android/app/build
rm -rf node_modules/expo-constants/android/build

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build production APK
echo "🚀 Building production APK..."
npx eas build --platform android --profile production

echo "✅ Build complete!"
echo "📱 APK will be available in your Expo dashboard or locally if configured"
echo ""
echo "📋 App Details:"
echo "   Package: com.gogrowsmart.app.mobile"
echo "   Version: 2.0.9"
echo "   Version Code: 13"
