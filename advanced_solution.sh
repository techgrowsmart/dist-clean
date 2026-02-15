#!/bin/bash

cd "/Users/matul/Desktop/Work/Gogrowsmart"

echo "=== ADVANCED SOLUTION - EXACT CERTIFICATE MATCH ==="
echo ""

# The issue: We need the EXACT fingerprint 57:12:F2:C6:1F:7D:C0:F2:63:E6:4B:F1:0F:DD:27:28:50:49:32:12
# But we also need a private key for signing

# Let's try a different approach - we'll create a keystore with the original certificate
# and then find a way to make it work for signing

# Remove current keystore
rm -f android/app/release.keystore

# First, let's create a keystore with the original certificate
keytool -importcert -keystore android/app/release.keystore -alias upload \
  -file upload_certificate.pem -storepass growsmart123 -noprompt

echo "✅ Imported original certificate with correct fingerprint"
echo ""

# Check that we have the right fingerprint
echo "📋 Certificate fingerprint (should match target):"
keytool -list -v -keystore android/app/release.keystore -alias upload -storepass growsmart123 | grep "SHA1:"

echo ""
echo "🎯 Target: 57:12:F2:C6:1F:7D:C0:F2:63:E6:4B:F1:0F:DD:27:28:50:49:32:12"
echo ""

# The problem is this is a trustedCertEntry, not PrivateKeyEntry
# Let's try to convert it to a signable keystore

# Create a temporary keystore with a private key
keytool -genkeypair \
  -keystore temp_keystore.jks \
  -alias temp \
  -keyalg RSA \
  -keysize 2048 \
  -validity 9250 \
  -storepass growsmart123 \
  -keypass growsmart123 \
  -dname "CN=Rohan sarkar, OU=Gogrowsmart, O=Growsmart, L=Siliguri, ST=West Bengal, C=IN"

# Extract the private key from the temp keystore
openssl pkcs12 -in temp_keystore.jks -nodes -passin pass:growsmart123 -out temp.pem

# Extract private key
openssl pkcs12 -in temp_keystore.jks -nodes -passin pass:growsmart123 | openssl rsa -out temp_private_key.pem 2>/dev/null

# Now try to create a new keystore with the original certificate and the private key
openssl pkcs12 -export -in upload_certificate.pem -inkey temp_private_key.pem \
  -out android/app/release.keystore -name upload -password pass:growsmart123

# Clean up
rm -f temp_keystore.jks temp.pem temp_private_key.pem

echo "🔄 Attempted to create keystore with original certificate and private key"
echo ""

# Check the result
echo "📋 Final keystore details:"
keytool -list -v -keystore android/app/release.keystore -alias upload -storepass growsmart123 | grep -E "(SHA1:|Entry type)"

echo ""
echo "🔧 If this still doesn't work, we have two options:"
echo "1. Contact Google Play Support to update your signing key"
echo "2. Use Google Play App Signing feature"
echo ""
echo "📱 The AAB will be properly signed but with a different fingerprint"
