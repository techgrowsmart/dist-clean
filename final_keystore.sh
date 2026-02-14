#!/bin/bash

cd "/Users/matul/Desktop/Work/Gogrowsmart"

# Create a keystore with the exact certificate and a generated private key
# We'll use the certificate as-is and generate a matching private key

# First, let's create a JKS keystore and then replace the certificate
keytool -genkeypair \
  -keystore android/app/release.keystore \
  -alias upload \
  -keyalg RSA \
  -keysize 2048 \
  -validency 9250 \
  -storepass growsmart123 \
  -keypass growsmart123 \
  -dname "CN=Rohan sarkar, OU=Gogrowsmart, O=Growsmart, L=Siliguri, ST=West Bengal, C=IN"

# Now delete the generated certificate and import the correct one
keytool -delete -keystore android/app/release.keystore -alias upload -storepass growsmart123
keytool -importcert -keystore android/app/release.keystore -alias upload -file upload_certificate.pem -storepass growsmart123 -noprompt

# Convert to PKCS12 format which is better for signing
keytool -importkeystore \
  -srckeystore android/app/release.keystore \
  -destkeystore android/app/release_keystore.p12 \
  -deststoretype PKCS12 \
  -srcstorepass growsmart123 \
  -deststorepass growsmart123 \
  -srcalias upload \
  -destalias upload \
  -srckeypass growsmart123 \
  -destkeypass growsmart123

echo "Final keystore information:"
keytool -list -v -keystore android/app/release_keystore.p12 -alias upload -storepass growsmart123 | grep -E "(SHA1:|Entry type)"
