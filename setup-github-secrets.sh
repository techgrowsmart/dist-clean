#!/bin/bash

echo "=== GitHub Secrets Setup Script ==="
echo ""
echo "This script will help you set up the required GitHub secrets for signing your Android app."
echo ""

# Check if keystore file exists
if [ ! -f "android/app/release.keystore" ]; then
    echo "❌ Keystore file not found at android/app/release.keystore"
    echo "Please make sure your keystore file is in the correct location."
    exit 1
fi

echo "✅ Keystore file found"

# Encode keystore to base64
echo ""
echo "📦 Encoding keystore to base64..."
KEYSTORE_BASE64=$(base64 -w 0 android/app/release.keystore)
echo "✅ Keystore encoded successfully"

# Display the base64 string
echo ""
echo "=== KEYSTORE_BASE64 ==="
echo "Copy this entire string and add it as a GitHub secret named 'KEYSTORE_BASE64':"
echo ""
echo "$KEYSTORE_BASE64"
echo ""

# Prompt for other secrets
echo ""
echo "=== Additional Required Secrets ==="
echo ""
echo "Please add these additional secrets to your GitHub repository:"
echo ""
echo "1. KEYSTORE_PASSWORD"
echo "   - Your keystore password"
echo ""
echo "2. KEY_ALIAS" 
echo "   - Your key alias (usually 'upload' or 'key0')"
echo ""
echo "3. KEY_PASSWORD"
echo "   - Your key password"
echo ""
echo "4. GOOGLE_PLAY_SERVICE_ACCOUNT (optional)"
echo "   - JSON service account for Google Play Console deployment"
echo "   - Only needed if you want automatic deployment to Play Store"
echo ""

echo "=== Setup Instructions ==="
echo "1. Go to your GitHub repository"
echo "2. Navigate to Settings → Secrets and variables → Actions"
echo "3. Click 'New repository secret'"
echo "4. Add each secret with the exact names shown above"
echo "5. Once all secrets are added, push your changes to trigger the workflow"
echo ""

echo "✅ Setup complete! Your CI/CD pipeline is ready to build signed AAB and APK files."
