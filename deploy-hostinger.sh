#!/bin/bash

echo "🌐 Deploying GROWSMART to Hostinger"
echo "====================================="

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
echo -e "${BLUE}🧹 Cleaning previous build...${NC}"
rm -rf dist

# Install dependencies with legacy peer deps to avoid conflicts
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install --legacy-peer-deps

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ npm install failed!${NC}"
    exit 1
fi

# Build for production web
echo -e "${BLUE}🚀 Building web app for Hostinger...${NC}"
npx expo export --platform web --output-dir dist

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Web build successful!${NC}"
else
    echo -e "${RED}❌ Web build failed!${NC}"
    exit 1
fi

# Create deployment package with timestamp
echo -e "${BLUE}📦 Creating deployment package...${NC}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
PACKAGE_NAME="gogrowsmart-dist-hostinger-${TIMESTAMP}.tar.gz"

tar -czf "${PACKAGE_NAME}" dist/

echo -e "${GREEN}✅ Deployment package created: ${PACKAGE_NAME}${NC}"

# Display build information
echo ""
echo -e "${BLUE}📋 Build Details:${NC}"
echo "   - Build directory: dist/"
echo "   - Package: ${PACKAGE_NAME}"
echo "   - Build size: $(du -sh dist | cut -f1)"
echo "   - Files: $(find dist -type f | wc -l)"
echo ""

# Hostinger deployment instructions
echo -e "${YELLOW}🚀 Hostinger Deployment Instructions:${NC}"
echo ""
echo "1) 📁 Upload to Hostinger File Manager:"
echo "   - Login to your Hostinger control panel"
echo "   - Go to File Manager"
echo "   - Navigate to your public_html directory"
echo "   - Upload and extract ${PACKAGE_NAME}"
echo "   - OR upload the entire 'dist' folder contents"
echo ""
echo "2) 🔧 Configure .htaccess for SPA routing:"
echo "   - Create/update .htaccess file in public_html"
echo "   - Add the following rules:"
echo ""
cat << 'EOF'
RewriteEngine On
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
EOF
echo ""
echo "3) 🔒 SSL Certificate:"
echo "   - Ensure SSL is enabled in Hostinger control panel"
echo "   - Use Let's Encrypt free SSL certificate"
echo "   - Force HTTPS redirect in .htaccess:"
echo ""
cat << 'EOF'
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
EOF
echo ""
echo "4) 🌐 Access your site:"
echo "   - Your app will be available at: https://portal.gogrowsmart.com"
echo "   - All routes will work correctly with SPA routing"
echo ""

# Ask if user wants to open the folder
read -p "Do you want to open the dist folder? (y/N): " open_folder
if [[ $open_folder =~ ^[Yy]$ ]]; then
    open dist
fi

echo -e "${GREEN}🎉 Build complete! Ready for Hostinger deployment.${NC}"
echo -e "${BLUE}📦 Package: ${PACKAGE_NAME}${NC}"
