#!/bin/bash

cd "/Users/matul/Desktop/Work/Gogrowsmart"

# Let's extract the exact certificate details and try to recreate it
echo "Extracting certificate details..."
openssl x509 -in upload_certificate.pem -text -noout > cert_details.txt

# Try to create a keystore with the exact same serial number and dates
# Extract serial number
SERIAL=$(openssl x509 -in upload_certificate.pem -noout -serial | cut -d'=' -f2)
echo "Serial: $SERIAL"

# Extract dates
START_DATE=$(openssl x509 -in upload_certificate.pem -noout -startdate | cut -d'=' -f2)
END_DATE=$(openssl x509 -in upload_certificate.pem -noout -enddate | cut -d'=' -f2)
echo "Valid from: $START_DATE to: $END_DATE"

# Create a new keystore with specific parameters
keytool -genkeypair \
  -keystore android/app/release.keystore \
  -alias upload \
  -keyalg RSA \
  -keysize 2048 \
  -sigalg SHA256withRSA \
  -validity 9250 \
  -storepass growsmart123 \
  -keypass growsmart123 \
  -dname "CN=Rohan sarkar, OU=Gogrowsmart, O=Growsmart, L=Siliguri, ST=West Bengal, C=IN" \
  -ext SAN=dns:localhost,ip:127.0.0.1

echo "Generated keystore with fingerprint:"
keytool -list -v -keystore android/app/release.keystore -alias upload -storepass growsmart123 | grep "SHA1:"

# Restore original gradle.properties
cp android/gradle.properties.bak android/gradle.properties

echo ""
echo "Restored gradle.properties to use release.keystore"
echo ""
echo "NOTE: The fingerprint is different because each generated key pair is unique."
echo "For Google Play, you need to use the ORIGINAL keystore that was used to sign the first version."
echo "If you don't have the original private key, you may need to contact Google Play support."
