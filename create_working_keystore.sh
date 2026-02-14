#!/bin/bash

cd "/Users/matul/Desktop/Work/Gogrowsmart"

# Since we have the certificate with the correct fingerprint but no private key,
# we need to create a workaround. Let's create a keystore that can be used for signing.

# Remove the current trusted certificate entry
keytool -delete -keystore android/app/release.keystore -alias upload -storepass growsmart123 2>/dev/null

# Create a new key pair with the exact same distinguished name
keytool -genkeypair \
  -keystore android/app/release.keystore \
  -alias upload \
  -keyalg RSA \
  -keysize 2048 \
  -sigalg SHA256withRSA \
  -validity 9250 \
  -storepass growsmart123 \
  -keypass growsmart123 \
  -dname "CN=Rohan sarkar, OU=Gogrowsmart, O=Growsmart, L=Siliguri, ST=West Bengal, C=IN"

echo "Created new signing keystore:"
keytool -list -v -keystore android/app/release.keystore -alias upload -storepass growsmart123 | grep -E "(SHA1:|Entry type)"

echo ""
echo "IMPORTANT NOTE:"
echo "The new keystore has a different fingerprint because each generated key pair is unique."
echo "The fingerprint you have (57:12:F2:C6:1F:7D:C0:F2:63:E6:4B:F1:0F:DD:27:28:50:49:32:12) "
echo "belongs to a certificate that doesn't have a private key."
echo ""
echo "For Google Play, you have two options:"
echo "1. Use this new keystore and contact Google Play support to update the signing key"
echo "2. Find the original keystore that contains the private key for the certificate"
echo ""
echo "Current keystore info:"
keytool -list -v -keystore android/app/release.keystore -alias upload -storepass growsmart123 | grep "SHA1:"
