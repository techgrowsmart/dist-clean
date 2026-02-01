#!/bin/bash

echo "🔍 SEARCHING FOR KEYSTORE WITH SHA256: 57:12:F2:C6:1F:7D:C0:F2:63:E6:4B:F1:0F:DD:27:28:50:49:32:12"
echo "============================================================================================="
echo ""

echo "📁 Searching all possible locations..."

# Search all keystore files and check their SHA256
find /Users/matul -name "*.keystore" -o -name "*.jks" 2>/dev/null | while read file; do
    echo "🔍 Checking: $file"
    
    # Try common passwords
    for password in "android" "password" "123456" "growsmart" "upload" "key0" ""; do
        sha256=$(keytool -list -v -keystore "$file" -storepass "$password" 2>/dev/null | grep "SHA256: 57:12:F2:C6")
        if [ ! -z "$sha256" ]; then
            echo "✅ FOUND MATCH!"
            echo "📁 File: $file"
            echo "🔐 Password: '$password'"
            echo "🔍 SHA256: $sha256"
            echo ""
            echo "📋 Full details:"
            keytool -list -v -keystore "$file" -storepass "$password" 2>/dev/null
            exit 0
        fi
    done
done

echo ""
echo "🔍 Method 2: Check if this is your release.keystore..."
if [ -f "android/app/release.keystore" ]; then
    echo "📁 Checking android/app/release.keystore..."
    keytool -list -v -keystore android/app/release.keystore 2>/dev/null | grep "SHA256: 57:12:F2:C6" && echo "✅ FOUND!" || echo "❌ No match"
fi

echo ""
echo "🔍 Method 3: Check upload-keystore.jks..."
if [ -f "upload-keystore.jks" ]; then
    echo "📁 Checking upload-keystore.jks..."
    keytool -list -v -keystore upload-keystore.jks -storepass growsmart123 2>/dev/null | grep "SHA256: 57:12:F2:C6" && echo "✅ FOUND!" || echo "❌ No match"
fi

echo ""
echo "📋 If you have any keystore file, test it with:"
echo "keytool -list -v -keystore /path/to/keystore"
echo "Look for SHA256: 57:12:F2:C6:1F:7D:C0:F2:63:E6:4B:F1:0F:DD:27:28:50:49:32:12"
