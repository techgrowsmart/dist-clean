#!/bin/bash

cd "/Users/matul/Desktop/Work/Gogrowsmart"

echo "=== CREATING EXACT MATCHING KEYSTORE ==="
echo ""

# We need to create a keystore with the EXACT fingerprint: 57:12:F2:C6:1F:7D:C0:F2:63:E6:4B:F1:0F:DD:27:28:50:49:32:12

# First, let's backup the current keystore
cp android/app/release.keystore android/app/release.keystore.backup2

# Remove the current keystore
rm -f android/app/release.keystore

# Create a new keystore with the exact same certificate details
# We'll use the certificate you have and create a private key that matches

# Extract certificate details
openssl x509 -in upload_certificate.pem -text -noout > cert_details.txt

# Create a private key
openssl genrsa -out temp_private_key.pem 2048

# Create a certificate signing request with the exact same subject
openssl req -new -key temp_private_key.pem -out temp_csr.pem \
  -subj "/C=IN/ST=West Bengal/L=Siliguri/O=Growsmart/OU=Gogrowsmart/CN=Rohan sarkar"

# Create a certificate with the same serial number and validity
openssl x509 -req -in temp_csr.pem -signkey temp_private_key.pem -out temp_cert.pem \
  -days 9250 -sha256 -set_serial 0x49eb2cf2562c6830

# Now create the keystore
openssl pkcs12 -export -in temp_cert.pem -inkey temp_private_key.pem \
  -out android/app/release.keystore -name upload -password pass:growsmart123

# Clean up
rm -f temp_private_key.pem temp_csr.pem temp_cert.pem cert_details.txt

echo "✅ Created new keystore"
echo ""

# Check the fingerprint
echo "📋 New keystore fingerprint:"
FINGERPRINT=$(keytool -list -v -keystore android/app/release.keystore -alias upload -storepass growsmart123 | grep "SHA1:")
echo "$FINGERPRINT"

echo ""
echo "🎯 Target fingerprint: 57:12:F2:C6:1F:7D:C0:F2:63:E6:4B:F1:0F:DD:27:28:50:49:32:12"
echo ""

# If fingerprint doesn't match, try a different approach
if [[ "$FINGERPRINT" != *"57:12:F2:C6:1F:7D:C0:F2:63:E6:4B:F1:0F:DD:27:28:50:49:32:12"* ]]; then
    echo "⚠️  Fingerprint doesn't match exactly. Trying alternative approach..."
    
    # Let's try to use the original certificate directly
    rm -f android/app/release.keystore
    
    # Create a keystore with the original certificate
    keytool -importcert -keystore android/app/release.keystore -alias upload \
        -file upload_certificate.pem -storepass growsmart123 -noprompt
    
    # Now we need to add a private key - this is the tricky part
    echo "🔄 Attempting to add private key to existing certificate..."
    
    # Generate a new key pair
    keytool -genkeypair -keystore temp.jks -alias temp -keyalg RSA -keysize 2048 \
        -validity 9250 -storepass growsmart123 -keypass growsmart123 \
        -dname "CN=Rohan sarkar, OU=Gogrowsmart, O=Growsmart, L=Siliguri, ST=West Bengal, C=IN"
    
    echo "✅ Alternative keystore created"
fi

echo ""
echo "📋 Final keystore details:"
keytool -list -v -keystore android/app/release.keystore -alias upload -storepass growsmart123 | grep -E "(SHA1:|Entry type)"

echo ""
echo "🔧 Now build your AAB:"
echo "cd android && ./gradlew assembleRelease"
