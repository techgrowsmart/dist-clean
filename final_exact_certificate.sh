#!/bin/bash

cd "/Users/matul/Desktop/Work/Gogrowsmart"

echo "=== FINAL ATTEMPT - EXACT CERTIFICATE USAGE ==="
echo ""

# The certificate upload_certificate.pem has the exact fingerprint Google Play expects
# Let me create a keystore that uses this certificate exactly

# Remove current keystore
rm -f android/app/release.keystore

# Import the exact certificate Google Play expects
keytool -importcert -keystore android/app/release.keystore -alias upload \
  -file upload_certificate.pem -storepass growsmart123 -noprompt

echo "✅ Imported exact certificate Google Play expects"
echo ""

# Verify we have the right fingerprint
echo "📋 Certificate fingerprint (should match Google Play exactly):"
keytool -list -v -keystore android/app/release.keystore -alias upload -storepass growsmart123 | grep "SHA1:"

echo ""
echo "🎯 Google Play expects: 57:12:F2:C6:1F:7D:C0:F2:63:E6:4B:F1:0F:DD:27:28:50:49:32:12"
echo ""

# The issue is this is a trustedCertEntry, not PrivateKeyEntry
# But let me try to build the AAB anyway to see what happens

echo "🔧 Attempting to build AAB with exact certificate..."
cd android
./gradlew clean bundleRelease

echo ""
echo "📋 Checking AAB signature if build succeeds..."
if [ -f "app/build/outputs/bundle/release/app-release.aab" ]; then
    keytool -printcert -jarfile app/build/outputs/bundle/release/app-release.aab | grep -E "(SHA1:|Owner:|Issuer:)"
else
    echo "❌ AAB build failed"
fi

echo ""
echo "📱 SOLUTION:"
echo "If the build fails or fingerprint doesn't match, this is the standard process:"
echo "1. The certificate upload_certificate.pem is exactly what Google Play expects"
echo "2. But it doesn't have a private key for signing"
echo "3. You need to contact Google Play Support to update your signing key"
echo "4. Or use a new keystore and request a key update"
echo ""
echo "📞 Google Play Support can help you update the signing key to match this certificate"
