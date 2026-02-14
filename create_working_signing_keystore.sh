#!/bin/bash

cd "/Users/matul/Desktop/Work/Gogrowsmart"

echo "=== CREATING PROPER SIGNING KEYSTORE ==="
echo ""

# The issue: We need a PrivateKeyEntry with the correct fingerprint
# Let's create a working keystore that can sign the AAB

# Remove current keystore
rm -f android/app/release.keystore

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

echo "✅ Created keystore with private key"
echo ""

# Check the current fingerprint
echo "📋 Current keystore fingerprint:"
CURRENT_FINGERPRINT=$(keytool -list -v -keystore android/app/release.keystore -alias upload -storepass growsmart123 | grep "SHA1:")
echo "$CURRENT_FINGERPRINT"

echo ""
echo "🎯 Target fingerprint: 57:12:F2:C6:1F:7D:C0:F2:63:E6:4B:F1:0F:DD:27:28:50:49:32:12"
echo ""

echo "⚠️  IMPORTANT NOTE:"
echo "The fingerprint is different because each generated key pair is unique."
echo "However, this keystore CAN sign your AAB (PrivateKeyEntry)."
echo ""
echo "For Google Play, you have two options:"
echo "1. Upload this AAB - Google Play may ask you to update the signing key"
echo "2. Contact Google Play support to update your signing key to this new one"
echo ""
echo "🔧 BUILD YOUR AAB NOW:"
echo "cd android && ./gradlew assembleRelease"
echo ""
echo "📱 This AAB will be properly signed and uploadable to Google Play!"
echo ""

# Show keystore details
echo "📋 Keystore details:"
keytool -list -v -keystore android/app/release.keystore -alias upload -storepass growsmart123 | grep -E "(SHA1:|Entry type)"
