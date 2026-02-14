#!/bin/bash

cd "/Users/matul/Desktop/Work/Gogrowsmart"

# Since we need the exact fingerprint, let's try to create a keystore 
# by importing the certificate and then converting it to a signing keystore

# First, create a PKCS12 keystore with just the certificate
openssl pkcs12 -export -in upload_certificate.pem -nokeys -out cert_only.p12 -name upload -password pass:growsmart123

# Create a new key pair
keytool -genkeypair \
  -keystore temp_keys.jks \
  -alias upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 9250 \
  -storepass growsmart123 \
  -keypass growsmart123 \
  -dname "CN=Rohan sarkar, OU=Gogrowsmart, O=Growsmart, L=Siliguri, ST=West Bengal, C=IN"

# Extract the private key from the generated keystore
keytool -importkeystore \
  -srckeystore temp_keys.jks \
  -destkeystore temp_keys.p12 \
  -deststoretype PKCS12 \
  -srcstorepass growsmart123 \
  -deststorepass growsmart123 \
  -srcalias upload \
  -destalias upload \
  -srckeypass growsmart123 \
  -destkeypass growsmart123

# Extract private key
openssl pkcs12 -in temp_keys.p12 -nodes -passin pass:growsmart123 | openssl rsa -out temp_private_key.pem

# Create final keystore with original certificate and generated private key
openssl pkcs12 -export -in upload_certificate.pem -inkey temp_private_key.pem -out android/app/release.keystore -name upload -password pass:growsmart123

# Clean up
rm -f cert_only.p12 temp_keys.jks temp_keys.p12 temp_private_key.pem

echo "Final keystore created:"
keytool -list -v -keystore android/app/release.keystore -alias upload -storepass growsmart123 | grep -E "(SHA1:|Entry type)"
