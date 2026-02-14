#!/bin/bash

cd "/Users/matul/Desktop/Work/Gogrowsmart"

# Create a brand new keystore with a private key for signing
keytool -genkeypair \
  -keystore android/app/release_signing.keystore \
  -alias upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 9250 \
  -storepass growsmart123 \
  -keypass growsmart123 \
  -dname "CN=Rohan sarkar, OU=Gogrowsmart, O=Growsmart, L=Siliguri, ST=West Bengal, C=IN"

echo "New signing keystore created:"
keytool -list -v -keystore android/app/release_signing.keystore -alias upload -storepass growsmart123 | grep -E "(SHA1:|Entry type)"

# Update gradle.properties to use the new keystore
sed -i.bak 's/MYAPP_RELEASE_STORE_FILE=release.keystore/MYAPP_RELEASE_STORE_FILE=release_signing.keystore/' android/gradle.properties

echo ""
echo "Updated gradle.properties to use release_signing.keystore"
echo "You can now build your AAB with this keystore."
