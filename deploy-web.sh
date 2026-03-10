#!/bin/bash

echo "🌐 Deploying GROWSMART Web App to Production"
echo "==========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the Gogrowsmart directory.${NC}"
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

# Clean previous build
echo -e "${BLUE}🧹 Cleaning previous web build...${NC}"
rm -rf web-build

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

# Build for production web
echo -e "${BLUE}🚀 Building web app for production...${NC}"
npx expo export --platform web --output-dir web-build --minify

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Web build successful!${NC}"
else
    echo -e "${RED}❌ Web build failed!${NC}"
    exit 1
fi

# Create deployment package
echo -e "${BLUE}📦 Creating deployment package...${NC}"
cd web-build
tar -czf ../growsmart-web-build.tar.gz .
cd ..

echo -e "${GREEN}✅ Deployment package created: growsmart-web-build.tar.gz${NC}"

# Deployment options
echo ""
echo -e "${BLUE}🚀 Deployment Options:${NC}"
echo ""
echo "1) 🌐 Vercel (Recommended)"
echo "   - Install Vercel CLI: npm i -g vercel"
echo "   - Deploy: vercel --prod"
echo ""
echo "2) 🌐 Netlify"
echo "   - Drag and drop web-build folder to Netlify"
echo "   - Or use Netlify CLI: npm i -g netlify-cli && netlify deploy --prod --dir=web-build"
echo ""
echo "3) 🌐 Custom Server"
echo "   - Upload web-build folder to your server"
echo "   - Configure nginx/apache to serve static files"
echo ""
echo "4) 🌐 GitHub Pages"
echo "   - Push web-build folder to gh-pages branch"
echo "   - Enable GitHub Pages in repository settings"
echo ""
echo "5) 🌐 AWS S3 + CloudFront"
echo "   - Upload web-build to S3 bucket"
echo "   - Configure CloudFront distribution"
echo ""
echo -e "${YELLOW}📋 Build Details:${NC}"
echo "   - Build size: $(du -sh web-build | cut -f1)"
echo "   - Files: $(find web-build -type f | wc -l)"
echo "   - Package: growsmart-web-build.tar.gz"
echo ""

# Ask if user wants to deploy to Vercel
read -p "Do you want to deploy to Vercel now? (y/N): " deploy_vercel
if [[ $deploy_vercel =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🚀 Deploying to Vercel...${NC}"
    if command -v vercel &> /dev/null; then
        cd web-build
        vercel --prod
        cd ..
    else
        echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
        npm i -g vercel
        cd web-build
        vercel --prod
        cd ..
    fi
fi

echo -e "${GREEN}🎉 Web deployment setup complete!${NC}"
echo -e "${BLUE}📱 Your app will be available at the provided deployment URL${NC}"
