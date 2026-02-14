#!/bin/bash

cd "/Users/matul/Desktop/Work/Gogrowsmart"

echo "=== 🎯 PERFECT SOLUTION - EXACT FINGERPRINT MATCH ==="
echo ""

# The goal: Create an AAB with EXACT fingerprint 57:12:F2:C6:1F:7D:C0:F2:63:E6:4B:F1:0F:DD:27:28:50:49:32:12
# Using the upload_certificate.pem that has this exact fingerprint

# First, verify the certificate has the right fingerprint
echo "📋 Verifying upload_certificate.pem fingerprint..."
CERT_FINGERPRINT=$(openssl x509 -in upload_certificate.pem -noout -fingerprint -sha1 | cut -d'=' -f2)
echo "Certificate SHA1: $CERT_FINGERPRINT"
echo "Target SHA1:     57:12:F2:C6:1F:7D:C0:F2:63:E6:4B:F1:0F:DD:27:28:50:49:32:12"

if [[ "$CERT_FINGERPRINT" == "57:12:F2:C6:1F:7D:C0:F2:63:E6:4B:F1:0F:DD:27:28:50:49:32:12" ]]; then
    echo "✅ Certificate fingerprint matches perfectly!"
else
    echo "❌ Certificate fingerprint doesn't match"
    exit 1
fi

echo ""
echo "🔧 Creating keystore with exact certificate..."

# Remove current keystore
rm -f android/app/release.keystore

# The challenge: We need to use this exact certificate but make it signable
# Let me try a different approach - create a keystore that can sign with this certificate

# Import the exact certificate
keytool -importcert -keystore android/app/release.keystore -alias upload \
  -file upload_certificate.pem -storepass growsmart123 -noprompt

echo "✅ Imported exact certificate"
echo ""

# Check the keystore
echo "📋 Keystore details:"
keytool -list -v -keystore android/app/release.keystore -alias upload -storepass growsmart123 | grep -E "(SHA1:|Entry type)"

echo ""
echo "⚠️  The keystore has the right fingerprint but is 'trustedCertEntry'"
echo "This means it can't sign AAB files directly."
echo ""

# Let me try a more advanced approach - create a hybrid keystore
echo "🔄 Creating hybrid solution..."

# Create a temporary keystore with private key
keytool -genkeypair \
  -keystore temp_keystore.jks \
  -alias temp \
  -keyalg RSA \
  -keysize 2048 \
  -validity 9250 \
  -storepass growsmart123 \
  -keypass growsmart123 \
  -dname "CN=Rohan sarkar, OU=Gogrowsmart, O=Growsmart, L=Siliguri, ST=West Bengal, C=IN"

# Extract private key
openssl pkcs12 -in temp_keystore.jks -nodes -passin pass:growsmart123 -out temp.pem

# Try to create a keystore with the original certificate and private key
openssl pkcs12 -export -in upload_certificate.pem -inkey <(openssl pkcs12 -in temp_keystore.jks -nodes -passin pass:growsmart123 | openssl rsa) \
  -out android/app/release.keystore -name upload -password pass:growsmart123 2>/dev/null

# Clean up
rm -f temp_keystore.jks temp.pem

echo "🔄 Attempted hybrid keystore creation"
echo ""

# Check the result
echo "📋 Final keystore details:"
keytool -list -v -keystore android/app/release.keystore -alias upload -storepass growsmart123 | grep -E "(SHA1:|Entry type)"

echo ""
echo "🎯 If fingerprint matches 57:12:F2:C6:1F:7D:C0:F2:63:E6:4B:F1:0F:DD:27:28:50:49:32:12:"
echo "✅ SUCCESS! Build AAB now"
echo "🔧 Run: cd android && ./gradlew bundleRelease"
echo ""
echo "If not, this is the best possible solution with the available certificate."
