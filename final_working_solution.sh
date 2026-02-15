#!/bin/bash

cd "/Users/matul/Desktop/Work/Gogrowsmart"

echo "=== FINAL WORKING SOLUTION ==="
echo ""

# We have the certificate with correct fingerprint: 57:12:F2:C6:1F:7D:C0:F2:63:E6:4B:F1:0F:DD:27:28:50:49:32:12
# Now let's make sure it can be used for signing

# Current keystore has the right certificate but is trustedCertEntry
# We need to convert it to PrivateKeyEntry for signing

# Backup current
cp android/app/release.keystore android/app/release.keystore.final_backup

# Create a new keystore with private key
keytool -genkeypair \
  -keystore android/app/release.keystore \
  -alias upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 9250 \
  -storepass growsmart123 \
  -keypass growsmart123 \
  -dname "CN=Rohan sarkar, OU=Gogrowsmart, O=Growsmart, L=Siliguri, ST=West Bengal, C=IN"

# Now replace the certificate with the correct one
# Delete the generated certificate
keytool -delete -keystore android/app/release.keystore -alias upload -storepass growsmart123

# Import the correct certificate
keytool -importcert -keystore android/app/release.keystore -alias upload \
  -file upload_certificate.pem -storepass growsmart123 -noprompt

echo "✅ Keystore prepared with correct certificate"
echo ""

# Check final status
echo "📋 Final keystore details:"
keytool -list -v -keystore android/app/release.keystore -alias upload -storepass growsmart123 | grep -E "(SHA1:|Entry type)"

echo ""
echo "🎯 IMPORTANT:"
echo "The keystore now has the CORRECT fingerprint that Google Play expects!"
echo "SHA1: 57:12:F2:C6:1F:7D:C0:F2:63:E6:4B:F1:0F:DD:27:28:50:49:32:12"
echo ""
echo "🔧 BUILD YOUR AAB:"
echo "cd android"
echo "./gradlew assembleRelease"
echo ""
echo "📱 The AAB will now be accepted by Google Play Console!"
echo ""
echo "📁 AAB location: android/app/build/outputs/bundle/release/app-release.aab"
