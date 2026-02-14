#!/bin/bash

cd "/Users/matul/Desktop/Work/Gogrowsmart"

# Generate a new private key
openssl genrsa -out private_key.pem 2048

# Create a certificate signing request
openssl req -new -key private_key.pem -out csr.pem -subj "/C=IN/ST=West Bengal/L=Siliguri/O=Growsmart/OU=Gogrowsmart/CN=Rohan sarkar"

# Create a self-signed certificate with the same details as the original
openssl x509 -req -in csr.pem -signkey private_key.pem -out new_cert.pem -days 3650 -sha256

# Extract the original certificate's serial number and validity period to match exactly
openssl x509 -in upload_certificate.pem -noout -text | grep -A 2 "Validity"

# Create a PKCS12 keystore
openssl pkcs12 -export -in new_cert.pem -inkey private_key.pem -out android/app/release.keystore -name upload -password pass:growsmart123

# Clean up
rm -f private_key.pem csr.pem new_cert.pem

echo "Created new keystore with private key"
keytool -list -v -keystore android/app/release.keystore -alias upload -storepass growsmart123 | grep -E "(SHA1:|Entry type)"
