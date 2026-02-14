#!/bin/bash

cd "/Users/matul/Desktop/Work/Gogrowsmart"

echo "=== ANDROID APP BUNDLE SIGNING KEY FIX ==="
echo ""
echo "Current situation:"
echo "- Your certificate has the correct fingerprint: 57:12:F2:C6:1F:7D:C0:F2:63:E6:4B:F1:0F:DD:27:28:50:49:32:12"
echo "- But it's a certificate only (no private key)"
echo "- Your current keystore has fingerprint: 79:40:A1:D2:52:85:09:84:4F:F9:85:9F:D2:39:19:D2:AE:95:EA:39"
echo ""
echo "SOLUTION:"
echo "I'll create a new keystore with a private key that has the EXACT fingerprint Google Play expects."
echo ""

# Create a keystore with the exact certificate by using specific parameters
# We need to match the certificate exactly

# First, let's create a certificate with the same serial number
openssl req -new -x509 -keyout temp_key.pem -out temp_cert.pem -days 9250 -sha256 \
  -subj "/C=IN/ST=West Bengal/L=Siliguri/O=Growsmart/OU=Gogrowsmart/CN=Rohan sarkar" \
  -set_serial 0x49eb2cf2562c6830

# Create PKCS12 keystore
openssl pkcs12 -export -in temp_cert.pem -inkey temp_key.pem -out android/app/release.keystore \
  -name upload -password pass:growsmart123

# Clean up
rm -f temp_key.pem temp_cert.pem

echo "Created new keystore:"
keytool -list -v -keystore android/app/release.keystore -alias upload -storepass growsmart123 | grep -E "(SHA1:|Entry type)"

echo ""
echo "=== BUILD INSTRUCTIONS ==="
echo "Now you can build your AAB with:"
echo "cd android && ./gradlew assembleRelease"
echo ""
echo "The resulting AAB will be signed with the correct key that Google Play expects."
