#!/bin/bash

echo "🔑 Production Keystore Setup Script"
echo "=================================="
echo ""

# Check if we can find any existing keystores
echo "🔍 Scanning for existing keystores..."
find ~/. -name "*.keystore" -o -name "*.jks" 2>/dev/null | head -5
echo ""

echo "📋 To fix the signing key mismatch, you need to:"
echo ""
echo "1. FIND YOUR ORIGINAL KEYSTORE with SHA1: C7:12:67:D2:68:E7:D1:26:34:95:5F:57:E1:78:9F:EA:91:78:61:30"
echo ""
echo "2. Check keystore SHA1 fingerprint:"
echo "   keytool -list -v -keystore /path/to/keystore -alias your-alias"
echo ""
echo "3. Place the CORRECT keystore at:"
echo "   android/app/release.keystore"
echo ""
echo "4. Update gradle.properties with correct values:"
echo ""

cat << 'EOF'
# Production signing configuration
MYAPP_RELEASE_STORE_FILE=release.keystore
MYAPP_RELEASE_KEY_ALIAS=your_actual_key_alias
MYAPP_RELEASE_STORE_PASSWORD=your_actual_keystore_password
MYAPP_RELEASE_KEY_PASSWORD=your_actual_key_password
EOF

echo ""
echo "🚀 After setting up:"
echo "1. Clean build: cd android && ./gradlew clean"
echo "2. Build AAB: ./gradlew bundleRelease"
echo "3. Verify SHA1: keytool -list -v -keystore app/build/outputs/bundle/release/app-release.aab"
echo ""
echo "⚠️  IMPORTANT: You MUST use the original keystore that matches the expected SHA1!"
echo ""

# Check if release.keystore exists
if [ -f "android/app/release.keystore" ]; then
    echo "✅ Found: android/app/release.keystore"
    echo "🔍 Checking its SHA1..."
    keytool -list -v -keystore android/app/release.keystore 2>/dev/null | grep SHA1 || echo "   (Password required to check SHA1)"
else
    echo "❌ Missing: android/app/release.keystore"
    echo "   You need to place your original keystore here!"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Find your original keystore file"
echo "2. Copy it to android/app/release.keystore"
echo "3. Update the 4 values in gradle.properties"
echo "4. Rebuild the AAB"
echo "5. Upload to Google Play Console"
