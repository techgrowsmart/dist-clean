#!/bin/bash

# Deployment Script for portal.gogrowsmart.com
echo "🚀 Deploying Gogrowsmart to portal.gogrowsmart.com..."

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo "❌ dist folder not found. Run 'npx expo export' first."
    exit 1
fi

echo "✅ Found dist folder with build files"
echo "📁 Contents of dist folder:"
ls -la dist/

echo ""
echo "📋 Manual Upload Instructions:"
echo "1. Go to Hostinger Control Panel → File Manager"
echo "2. Navigate to: public_html/portal"
echo "3. Upload ALL files and folders from dist/ to public_html/portal/"
echo ""
echo "📁 Files to upload:"
echo "- index.html (main entry point)"
echo "- _expo/ (Expo assets)"
echo "- assets/ (images, fonts, icons)"
echo "- TeacherDashBoard/ (teacher pages)"
echo "- StudentDashBoard/ (student pages)"
echo "- auth/ (authentication pages)"
echo "- All other folders and files"
echo ""
echo "🌐 After upload, visit: https://portal.gogrowsmart.com"
echo "🔧 Don't forget to clear cache in Hostinger if needed"
echo ""
echo "✅ Build ready for deployment!"
