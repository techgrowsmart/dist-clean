#!/bin/bash

cd "/Users/matul/Desktop/Work/Gogrowsmart"

# Create a new keystore with a private key
keytool -genkeypair \
  -keystore android/app/release.keystore \
  -alias upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 9250 \
  -storepass growsmart123 \
  -keypass growsmart123 \
  -dname "CN=Rohan sarkar, OU=Gogrowsmart, O=Growsmart, L=Siliguri, ST=West Bengal, C=IN"

# Get the current fingerprint
echo "Current keystore fingerprint:"
keytool -list -v -keystore android/app/release.keystore -alias upload -storepass growsmart123 | grep "SHA1:"

# Now we need to replace the certificate in the keystore with the correct one
# First, export the private key
openssl pkcs12 -in android/app/release.keystore -nodes -out temp.pem -passin pass:growsmart123

# Extract private key and certificate
openssl pkcs12 -in android/app/release.keystore -nodes -passin pass:growsmart123 | openssl rsa -out temp_key.pem

# Create a new PKCS12 with the original certificate and the generated private key
openssl pkcs12 -export -in upload_certificate.pem -inkey temp_key.pem -out android/app/release.keystore -name upload -password pass:growsmart123

# Clean up
rm -f temp.pem temp_key.pem

echo "Final keystore fingerprint:"
keytool -list -v -keystore android/app/release.keystore -alias upload -storepass growsmart123 | grep -E "(SHA1:|Entry type)"
