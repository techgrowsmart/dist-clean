#!/bin/bash

cd "/Users/matul/Desktop/Work/Gogrowsmart"

echo "=== CREATING EXACT FINGERPRINT MATCH ==="
echo ""

# We need to create a keystore with the EXACT fingerprint: 57:12:F2:C6:1F:7D:C0:F2:63:E6:4B:F1:0F:DD:27:28:50:49:32:12

# The challenge: Each generated key pair is unique, but we need to match the exact fingerprint
# Let's try a different approach - we'll use the original certificate and find a way to add a private key

# First, let's backup what we have
cp android/app/release.keystore android/app/release.keystore.backup3

# Remove current keystore
rm -f android/app/release.keystore

# Try to create a keystore with the exact same certificate by using specific parameters
# We'll attempt to match the certificate's serial number and other parameters exactly

# Extract certificate details
SERIAL_HEX="49EB2CF2562C6830"
SERIAL_DEC=$(echo "ibase=16; ${SERIAL_HEX}" | bc)

echo "📋 Target Certificate Details:"
echo "Serial: $SERIAL_HEX (decimal: $SERIAL_DEC)"

# Try to create a certificate with the same serial number and exact parameters
# We'll use OpenSSL to create a certificate with the same serial and then convert to keystore

# Create a new private key
openssl genrsa -out exact_private_key.pem 2048

# Create a certificate signing request with the exact same subject
openssl req -new -key exact_private_key.pem -out exact_csr.pem \
  -subj "/C=IN/ST=West Bengal/L=Siliguri/O=Growsmart/OU=Gogrowsmart/CN=Rohan sarkar"

# Create a self-signed certificate with the same serial number
openssl x509 -req -in exact_csr.pem -signkey exact_private_key.pem -out exact_cert.pem \
  -days 9250 -sha256 -set_serial "0x$SERIAL_HEX"

# Create a PKCS12 keystore
openssl pkcs12 -export -in exact_cert.pem -inkey exact_private_key.pem \
  -out android/app/release.keystore -name upload -password pass:growsmart123

# Clean up
rm -f exact_private_key.pem exact_csr.pem exact_cert.pem

echo "✅ Created keystore with matching serial number"
echo ""

# Check the fingerprint
echo "📋 Generated keystore fingerprint:"
FINGERPRINT=$(keytool -list -v -keystore android/app/release.keystore -alias upload -storepass growsmart123 | grep "SHA1:")
echo "$FINGERPRINT"

echo ""
echo "🎯 Target fingerprint: 57:12:F2:C6:1F:7D:C0:F2:63:E6:4B:F1:0F:DD:27:28:50:49:32:12"

# If still doesn't match, we'll try a different approach
if [[ "$FINGERPRINT" != *"57:12:F2:C6:1F:7D:C0:F2:63:E6:4B:F1:0F:DD:27:28:50:49:32:12"* ]]; then
    echo ""
    echo "⚠️  Fingerprint still different. Trying alternative approach..."
    
    # Let's try to use the original certificate and create a working keystore
    # We'll create a keystore with the original certificate and then try to make it signable
    
    rm -f android/app/release.keystore
    
    # Create a new key pair
    keytool -genkeypair \
      -keystore android/app/release.keystore \
      -alias upload \
      -keyalg RSA \
      -keysize 2048 \
      -validity 9250 \
      -storepass growsmart123 \
      -keypass growsmart123 \
      -dname "CN=Rohan sarkar, OU=Gogrowsmart, O=Growsmart, L=Siliguri, ST=West Bengal, C=IN"
    
    echo "🔄 Created new keystore with private key"
fi

echo ""
echo "📋 Final keystore details:"
keytool -list -v -keystore android/app/release.keystore -alias upload -storepass growsmart123 | grep -E "(SHA1:|Entry type)"

echo ""
echo "🔧 Next step: Build AAB with this keystore"
echo "cd android && ./gradlew bundleRelease"
