#!/bin/bash

# Script to create a proper signing keystore with the correct certificate
cd "/Users/matul/Desktop/Work/Gogrowsmart"

# Create a temporary keystore with a new key pair
keytool -genkeypair \
  -keystore temp_keystore.jks \
  -alias upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass growsmart123 \
  -keypass growsmart123 \
  -dname "CN=Rohan sarkar, OU=Gogrowsmart, O=Growsmart, L=Siliguri, ST=West Bengal, C=IN"

# Export the certificate from the original PEM to a temporary file
openssl x509 -in upload_certificate.pem -outform DER -out cert.der

# Delete the generated certificate and import the correct one
keytool -delete -keystore temp_keystore.jks -alias upload -storepass growsmart123
keytool -importcert -keystore temp_keystore.jks -alias upload -file cert.der -storepass growsmart123 -noprompt

# Copy to the final location
cp temp_keystore.jks android/app/release.keystore

# Clean up
rm -f temp_keystore.jks cert.der

echo "Created keystore with correct certificate"
keytool -list -v -keystore android/app/release.keystore -alias upload -storepass growsmart123 | grep "SHA1:"
