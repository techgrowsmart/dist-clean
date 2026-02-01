#!/bin/bash

echo "🔍 FINDING ORIGINAL KEYSTORE WITH SHA1: C7:12:67:D2:68:E7:D1:26:34:95:5F:57:E1:78:9F:EA:91:78:61:30"
echo "=============================================================================================="
echo ""

echo "🔍 Method 1: Search all possible keystore files..."
echo "Searching for .keystore and .jks files..."

# Search common locations
echo "📁 Searching in common locations..."
find ~/Desktop -name "*.keystore" -o -name "*.jks" 2>/dev/null | while read file; do
    echo "🔍 Checking: $file"
    keytool -list -v -keystore "$file" 2>/dev/null | grep "SHA1: C7:12:67" && echo "✅ FOUND MATCH!" || echo "❌ No match"
done

find ~/Documents -name "*.keystore" -o -name "*.jks" 2>/dev/null | while read file; do
    echo "🔍 Checking: $file"
    keytool -list -v -keystore "$file" 2>/dev/null | grep "SHA1: C7:12:67" && echo "✅ FOUND MATCH!" || echo "❌ No match"
done

find ~/Downloads -name "*.keystore" -o -name "*.jks" 2>/dev/null | while read file; do
    echo "🔍 Checking: $file"
    keytool -list -v -keystore "$file" 2>/dev/null | grep "SHA1: C7:12:67" && echo "✅ FOUND MATCH!" || echo "❌ No match"
done

echo ""
echo "🔍 Method 2: Try common passwords with existing keystores..."
echo "Checking if any existing keystores match with common passwords..."

# Check if we have any keystores to test
echo "📁 Looking for any keystores in project directories..."
find /Users/matul/Desktop/Work -name "*.keystore" -o -name "*.jks" 2>/dev/null | while read file; do
    echo "🔍 Testing keystore: $file"
    
    # Try common passwords
    for password in "android" "password" "123456" "growsmart" "upload" "key0" ""; do
        echo "  Trying password: '$password'"
        result=$(keytool -list -v -keystore "$file" -storepass "$password" 2>/dev/null | grep "SHA1: C7:12:67")
        if [ ! -z "$result" ]; then
            echo "✅ FOUND MATCH! Password: '$password'"
            echo "📋 Full details:"
            keytool -list -v -keystore "$file" -storepass "$password" 2>/dev/null
            exit 0
        fi
    done
done

echo ""
echo "🔍 Method 3: Check Google Play Console download..."
echo "You can download the original signing key from Google Play Console:"
echo "1. Go to Google Play Console"
echo "2. Navigate: Setup → App integrity → App signing"
echo "3. Look for 'Download signing key' option"
echo ""

echo "🔍 Method 4: Check email and cloud storage..."
echo "Look for emails with:"
echo "- 'keystore' in subject"
echo "- 'android signing key'"
echo "- 'release key'"
echo ""

echo "📋 If you find a keystore file, test it with:"
echo "keytool -list -v -keystore /path/to/keystore"
echo ""

echo "🎯 Target SHA1 to find: C7:12:67:D2:68:E7:D1:26:34:95:5F:57:E1:78:9F:EA:91:78:61:30"
