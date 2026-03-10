#!/bin/bash

echo "🏗️  Building GROWSMART for Production"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}❌ Error: package.json not found. Please run this script from the Gogrowsmart directory.${NC}"
    exit 1
fi

# Load production environment
echo -e "${BLUE}🔧 Loading production environment...${NC}"
if [ -f ".env.production" ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
    echo -e "${GREEN}✅ Production environment loaded${NC}"
else
    echo -e "${YELLOW}⚠️  No .env.production found, using existing .env${NC}"
fi

# Clean any previous builds
echo -e "${BLUE}🧹 Cleaning previous builds...${NC}"
rm -rf android/app/build
rm -rf node_modules/expo-constants/android/build
rm -rf ios/build
rm -rf dist
rm -rf web-build

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

# Build for different platforms
echo -e "${BLUE}📱 Select build platform:${NC}"
echo "1) Android APK (Direct distribution)"
echo "2) Android AAB (Google Play Store)"
echo "3) iOS (App Store)"
echo "4) Web (Static build)"
echo "5) All platforms"

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo -e "${BLUE}🚀 Building Android APK for production...${NC}"
        npx eas build --platform android --profile production-apk
        ;;
    2)
        echo -e "${BLUE}🚀 Building Android AAB for Google Play Store...${NC}"
        npx eas build --platform android --profile production-aab
        ;;
    3)
        echo -e "${BLUE}🚀 Building iOS for App Store...${NC}"
        npx eas build --platform ios --profile production
        ;;
    4)
        echo -e "${BLUE}🌐 Building Web for production...${NC}"
        npx expo export --platform web --output-dir web-build --minify
        echo -e "${GREEN}✅ Web build complete! Files in ./web-build${NC}"
        echo -e "${BLUE}� To deploy web build:${NC}"
        echo "   - Upload web-build folder to your web server"
        echo "   - Or deploy to Vercel, Netlify, etc."
        ;;
    5)
        echo -e "${BLUE}🚀 Building all platforms...${NC}"
        echo -e "${YELLOW}This will take a while...${NC}"
        
        echo "Building Android APK..."
        npx eas build --platform android --profile production-apk
        
        echo "Building Android AAB..."
        npx eas build --platform android --profile production-aab
        
        echo "Building iOS..."
        npx eas build --platform ios --profile production
        
        echo "Building Web..."
        npx expo export --platform web --output-dir web-build --minify
        ;;
    *)
        echo -e "${YELLOW}❌ Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}✅ Production build complete!${NC}"
echo ""
echo -e "${BLUE}📋 App Details:${NC}"
echo "   Package: com.gogrowsmart.app.mobile"
echo "   Version: 2.0.10"
echo "   Version Code: 14"
echo ""
echo -e "${BLUE}📱 Distribution:${NC}"
echo "   - Check your Expo dashboard for build artifacts"
echo "   - For web: deploy the web-build folder"
echo "   - For mobile: upload to app stores or distribute directly"
