#!/bin/bash

# Upload script for portal.gogrowsmart.com
echo "🚀 Uploading Gogrowsmart to portal.gogrowsmart.com..."

# Change to dist directory
cd /Users/matul/Desktop/Work/Gogrowsmart/dist

# Create a zip file for easier upload
zip -r ../portal-upload.zip .

echo "✅ Created portal-upload.zip with all files"
echo "📁 Now upload this file to Hostinger:"
echo ""
echo "1. Go to Hostinger Control Panel"
echo "2. File Manager → public_html/portal/"
echo "3. Upload portal-upload.zip"
echo "4. Right-click and select 'Extract'"
echo "5. Delete portal-upload.zip after extraction"
echo ""
echo "🌐 After upload: https://portal.gogrowsmart.com"
echo ""
echo "📋 Files included:"
ls -la
