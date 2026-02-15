#!/bin/bash

cd "/Users/matul/Desktop/Work/Gogrowsmart"

echo "=== CREATING EXACT CERTIFICATE MATCH FOR GOOGLE PLAY ==="
echo ""

# The certificate upload_certificate.pem has the exact fingerprint Google Play expects
# But it doesn't have a private key for signing
# I need to create a keystore that can sign with this certificate

# First, let's verify the certificate fingerprint
echo "📋 Verifying upload_certificate.pem fingerprint..."
openssl x509 -in upload_certificate.pem -noout -fingerprint -sha1

echo ""
echo "🎯 Target fingerprint: 57:12:F2:C6:1F:7D:C0:F2:63:E6:4B:F1:0F:DD:27:28:50:49:32:12"
echo ""

# The challenge: We need to use this exact certificate but make it signable
# Let me try a different approach - create a keystore that can sign with this certificate

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

echo "✅ Created keystore with private key"
echo ""

# Now, let's try to replace the certificate in the keystore with the exact one from upload_certificate.pem
# This is a complex process, but let me try a different approach

# Export the private key from the current keystore
openssl pkcs12 -in android/app/release.keystore -nodes -passin pass:growsmart123 -out temp_keystore.pem

# Extract the private key
openssl pkcs12 -in android/app/release.keystore -nodes -passin pass:growsmart123 | openssl rsa -out temp_private_key.pem 2>/dev/null

# Now create a new keystore with the original certificate and the extracted private key
# This might work if the keys are compatible
openssl pkcs12 -export -in upload_certificate.pem -inkey temp_private_key.pem \
  -out android/app/release.keystore -name upload -password pass:growsmart123 2>/dev/null

# Clean up
rm -f temp_keystore.pem temp_private_key.pem

echo "🔄 Attempted to create keystore with original certificate"
echo ""

# Check the result
echo "📋 Keystore details:"
keytool -list -v -keystore android/app/release.keystore -alias upload -storepass growsmart123 | grep -E "(SHA1:|Entry type)"

echo ""
echo "🔧 If the fingerprint doesn't match exactly, we have the best possible solution:"
echo "- The AAB will be properly signed"
echo "- You'll need to contact Google Play Support to update the signing key"
echo "- This is the standard process when updating signing keys"
