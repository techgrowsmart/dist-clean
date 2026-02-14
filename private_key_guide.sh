#!/bin/bash

cd "/Users/matul/Desktop/Work/Gogrowsmart"

echo "=== 🔍 PRIVATE KEY LOCATION GUIDE ==="
echo ""

echo "📋 CURRENT SITUATION ANALYSIS:"
echo ""

echo "✅ WHAT WE HAVE:"
echo "- upload_certificate.pem (certificate only, NO private key)"
echo "- upload_cert.pem (certificate only, NO private key)"
echo "- Multiple .jks files (created during our attempts)"
echo "- release.keystore.backup2 (has private key but wrong fingerprint)"
echo ""

echo "❌ WHAT WE DON'T HAVE:"
echo "- The original private key for fingerprint 57:12:F2:C6:1F:7D:C0:F2:63:E6:4B:F1:0F:DD:27:28:50:49:32:12"
echo ""

echo "🔍 WHERE THE PRIVATE KEY SHOULD BE:"
echo ""

echo "1. 📁 ORIGINAL DEVELOPMENT MACHINE:"
echo "   - Check the computer where you first created the app"
echo "   - Look in folders like: ~/keystores/, ~/.android/, project/keystore/"
echo "   - Search for files: *.keystore, *.jks, *.p12, private_key.pem"
echo ""

echo "2. 📧 EMAIL FROM GOOGLE PLAY:"
echo "   - When you first uploaded the app, Google Play sent you an email"
echo "   - Check for 'App signing key' or 'Upload key' emails"
echo "   - The private key might be attached or linked"
echo ""

echo "3. 🗂️  BACKUP LOCATIONS:"
echo "   - External hard drives"
echo "   - Cloud storage (Google Drive, Dropbox, etc.)"
echo "   - USB drives used during development"
echo "   - Old laptops/computers"
echo ""

echo "4. 📱 TEAM MEMBERS:"
echo "   - Ask other developers who worked on the app"
echo "   - Check if anyone has the original keystore"
echo ""

echo "5. 🔐 PASSWORD MANAGERS:"
echo "   - 1Password, LastPass, etc."
echo "   - Search for 'keystore', 'Android', 'Gogrowsmart'"
echo ""

echo "🔧 HOW TO IDENTIFY THE CORRECT PRIVATE KEY:"
echo ""

echo "1. ✅ CHECK FINGERPRINT:"
echo "   keytool -list -v -keystore [keystore_file] -alias [alias]"
echo "   Look for SHA1: 57:12:F2:C6:1F:7D:C0:F2:63:E6:4B:F1:0F:DD:27:28:50:49:32:12"
echo ""

echo "2. ✅ CHECK ALIAS:"
echo "   The alias should be 'upload'"
echo ""

echo "3. ✅ CHECK SUBJECT:"
echo "   Should be: CN=Rohan sarkar, OU=Gogrowsmart, O=Growsmart, L=Siliguri, ST=West Bengal, C=IN"
echo ""

echo "📞 IF YOU CAN'T FIND THE PRIVATE KEY:"
echo ""

echo "OPTION 1 - GOOGLE PLAY SUPPORT:"
echo "- Contact Google Play Console support"
echo "- Explain you lost the private key"
echo "- They can help you reset the signing key"
echo ""

echo "OPTION 2 - USE CURRENT AAB:"
echo "- Upload the AAB I created"
echo "- Google Play will show fingerprint mismatch"
echo "- Request signing key update"
echo "- This is the standard process"
echo ""

echo "🎯 RECOMMENDATION:"
echo "Search thoroughly for the original private key first."
echo "If not found, use the current AAB - Google Play will handle it."
echo ""

echo "📱 Your current AAB is ready at:"
echo "android/app/build/outputs/bundle/release/app-release.aab"
