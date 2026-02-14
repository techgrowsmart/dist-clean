#!/bin/bash

cd "/Users/matul/Desktop/Work/Gogrowsmart"

echo "=== FINAL SOLUTION FOR GOOGLE PLAY SIGNING ==="
echo ""

# The issue: We have the certificate with the correct fingerprint but no private key
# Google Play expects: SHA1: 57:12:F2:C6:1F:7D:C0:F2:63:E6:4B:F1:0F:DD:27:28:50:49:32:12
# But we need a private key to sign the AAB

# Let's create a keystore that combines the certificate with a generated private key
# This is a workaround that should work for signing

# First, create a private key
openssl genrsa -out private_key.pem 2048

# Create a certificate signing request with the exact same details
openssl req -new -key private_key.pem -out csr.pem \
  -subj "/C=IN/ST=West Bengal/L=Siliguri/O=Growsmart/OU=Gogrowsmart/CN=Rohan sarkar"

# Self-sign the certificate to match the original
openssl x509 -req -in csr.pem -signkey private_key.pem -out new_cert.pem \
  -days 9250 -sha256 -set_serial 0x49eb2cf2562c6830

# Create the final keystore
openssl pkcs12 -export -in new_cert.pem -inkey private_key.pem \
  -out android/app/release.keystore -name upload -password pass:growsmart123

# Clean up
rm -f private_key.pem csr.pem new_cert.pem

echo "✅ Created new signing keystore"
echo ""

# Verify the keystore
echo "📋 Keystore details:"
keytool -list -v -keystore android/app/release.keystore -alias upload -storepass growsmart123 | grep -E "(SHA1:|Entry type)"

echo ""
echo "🔧 BUILD INSTRUCTIONS:"
echo "1. Navigate to android folder: cd android"
echo "2. Build the AAB: ./gradlew assembleRelease"
echo "3. Find the AAB in: android/app/build/outputs/bundle/release/app-release.aab"
echo ""
echo "⚠️  IMPORTANT:"
echo "The new keystore has a different fingerprint because each key pair is unique."
echo "If Google Play still rejects it, you may need to:"
echo "1. Contact Google Play support to update your signing key"
echo "2. Or use the original keystore if you can find the private key"
echo ""
echo "Current fingerprint will be different from expected, but this keystore can sign your AAB."
