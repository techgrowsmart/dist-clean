#!/bin/bash

# Generate a keystore with the exact certificate details needed
cd "/Users/matul/Desktop/Work/Gogrowsmart"

# Remove existing keystore if any
rm -f gogrowsmart_exact.jks

# Generate key with exact same distinguished name
keytool -genkeypair \
  -keystore gogrowsmart_exact.jks \
  -alias gogrowsmart \
  -keyalg RSA \
  -keysize 2048 \
  -validity 9250 \
  -storepass gogrowsmart123 \
  -keypass gogrowsmart123 \
  -dname "CN=Rohan sarkar, OU=Gogrowsmart, O=Growsmart, L=Siliguri, ST=West Bengal, C=IN" \
  -startdate "2026/01/30 19:54:47" \
  -ext SAN=dns:localhost,ip:127.0.0.1

echo "Generated keystore. Checking fingerprint..."

# Check the fingerprint
keytool -list -v -keystore gogrowsmart_exact.jks -alias gogrowsmart -storepass gogrowsmart123 | grep "SHA1:"
