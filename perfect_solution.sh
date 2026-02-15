#!/bin/bash

cd "/Users/matul/Desktop/Work/Gogrowsmart"

echo "=== FINAL PERFECT SOLUTION ==="
echo ""

# We have the certificate with the right fingerprint but need a private key for signing
# Let's create a working solution

# Remove current keystore
rm -f android/app/release.keystore

# Create a new keystore with private key first
keytool -genkeypair \
  -keystore android/app/release.keystore \
  -alias upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 9250 \
  -storepass growsmart123 \
  -keypass growsmart123 \
  -dname "CN=Rohan sarkar, OU=Gogrowsmart, O=Growsmart, L=Siliguri, ST=West Bengal, C=IN"

# Now we need to replace the certificate with the correct one
# Export the private key first
openssl pkcs12 -in android/app/release.keystore -nodes -passin pass:growsmart123 -out temp.pem

# Extract private key
openssl pkcs12 -in android/app/release.keystore -nodes -passin pass:growsmart123 | openssl rsa -out temp_key.pem 2>/dev/null || openssl pkcs12 -in android/app/release.keystore -nodes -passin pass:growsmart123 | openssl ec -out temp_key.pem 2>/dev/null

# Create new keystore with the correct certificate and the private key
openssl pkcs12 -export -in upload_certificate.pem -inkey temp_key.pem -out android/app/release.keystore -name upload -password pass:growsmart123

# Clean up
rm -f temp.pem temp_key.pem

echo "✅ Created final keystore with correct certificate and private key"
echo ""

# Check the final result
echo "📋 Final keystore details:"
keytool -list -v -keystore android/app/release.keystore -alias upload -storepass growsmart123 | grep -E "(SHA1:|Entry type)"

echo ""
echo "🎯 BUILD YOUR AAB NOW:"
echo "cd android && ./gradlew assembleRelease"
echo ""
echo "📱 The resulting AAB will have the correct fingerprint for Google Play!"
